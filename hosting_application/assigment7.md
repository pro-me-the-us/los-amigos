## A. Business Rules Implementation

Business rules are conditions and policies the application enforces to govern its core operations. In **Argus**, business rules are implemented at the **Application/Service Layer**, keeping them separate from controllers (which only orchestrate requests) and repositories (which only handle persistence).

### 1. Deployment Module — `DeploymentService`

The Deployment Service enforces the following business rules before and during a deployment:

- **Authorization Rule:** A deployment request is only processed if the requesting user is authenticated and holds a valid role (developer or admin). This is enforced by `AuthenticationService` before `DeploymentService` is invoked.
- **Sequential Deployment Rule:** A new deployment can only be triggered after the previous deployment has reached a terminal state (success or failure). Concurrent deployments to the same container slot are disallowed to prevent state corruption.
- **Version Existence Rule:** Before deploying, `DeploymentService` checks via `VersionRepository` that the requested application version actually exists and is not already the currently running version.

```
Developer → DeploymentController
          → AuthenticationService  ← (Rule: valid user + role)
          → DeploymentService      ← (Rule: version exists, no concurrent deploy)
              → DeploymentPlatformClient (deploy container)
```

### 2. Health Check & Failure Detection Module — `HealthCheckService` / `FailureDetectionService`

- **Health Threshold Rule:** After each deployment, `HealthCheckService` evaluates the container's health. A deployment is only marked *stable* if health checks pass within a defined time window. If the container fails to become healthy in time, it is treated as a failed deployment.
- **Rollback Trigger Rule:** `FailureDetectionService` applies the rule: *"if health status is unhealthy, automatically invoke rollback."* This keeps rollback decisions centralized and consistent — no ad-hoc checks scattered across the codebase.

### 3. Rollback Module — `RollbackService`

- **Stable Version Requirement Rule:** A rollback is only executed if a stable previous version exists in `StableVersionRepository`. If no stable version is available, the rollback is aborted and the failure is logged — preventing a rollback to an unknown or corrupt state.
- **Single Rollback Rule:** Only one rollback per failed deployment event is permitted. After rollback, the system logs the event and awaits a new deployment request.

### 4. Version Management Module — `VersionRepository` / `StableVersionRepository`

- **Stable Version Update Rule:** A version is promoted to stable only after it has passed health checks. This ensures the rollback target is always a known-good build.
- **Version Immutability Rule:** Once a deployment version is recorded, its metadata is not modified — only its status (pending → running → stable/failed) transitions.

### 5. Authentication Module — `AuthenticationService`

- **Credential Validation Rule:** Users must provide valid credentials. Invalid or expired tokens are rejected immediately, and the request does not propagate further.
- **Role-Based Access Rule:** Only admin users can access deployment logs via `AdminController`. Regular developer accounts can trigger deployments but cannot view or purge system logs.

---

## B. Validation Logic

Validation in Argus ensures that data entering the system is correct, complete, and in the proper format before it reaches the business logic layer or the database.

### 1. Input Validation at the Controller Layer

`DeploymentController` and `AdminController` act as the system's entry points. Before passing any data downstream, they validate incoming request payloads:

- **Deployment Request Validation:**
  - `applicationName` — must be a non-empty string.
  - `version` — must match a defined version format (e.g., semantic versioning like `1.0.3`).
  - `environment` — must be one of the allowed values (e.g., `staging`, `production`).
  - Missing or malformed fields cause an immediate `400 Bad Request` response without touching the service layer.

- **Authentication Token Validation:**
  - JWT or session tokens are validated for structure, expiry, and signature before any protected route proceeds.

### 2. Business-Level Validation in the Service Layer

`DeploymentService` performs domain-specific validation beyond simple field checks:

- Verifies that the requested version exists in `VersionRepository` — preventing deployment of phantom versions.
- Checks that the target environment is not already running the same version (idempotency guard).
- Confirms the user has permission to deploy to the specified environment (e.g., only admins deploy to production).

`RollbackService` validates:

- That a stable version record exists in `StableVersionRepository` before initiating rollback. If none exists, rollback is rejected with an appropriate error log.

### 3. Health Report Validation — `HealthCheckService`

- The health check result (`HealthReport`) is validated before `FailureDetectionService` consumes it. The report must include a status field (`healthy` / `unhealthy`) and a timestamp. Incomplete or malformed health reports are treated as failures.

### 4. Log Entry Validation — `LogService`

- Before persisting to `LogRepository`, every log entry is validated to contain: an event type, a timestamp, a deployment ID reference, and a message. Entries missing required fields are either completed with defaults or discarded to avoid polluting the audit trail.

### Summary Table

| Layer | Validated Entity | Validation Applied |
|---|---|---|
| Controller | Deployment Request | Field presence, format, type |
| Controller | Auth Token | Structure, expiry, signature |
| Service | Version | Existence in repository |
| Service | Environment | Allowed values, permissions |
| Service | Stable Version (Rollback) | Existence before rollback |
| Service | HealthReport | Completeness, status field |
| Service | Log Entry | Required fields, references |

---

## C. Data Transformation

Data retrieved from the database (via repositories) is often in raw storage format and must be transformed before being consumed by services or returned to the presentation layer (controllers/UI).

### 1. Deployment Data — `DeploymentRepository` → `DeploymentService`

When a deployment record is fetched from MongoDB, it comes back as a raw document (e.g., with `_id`, raw timestamps in BSON format, internal status codes). `DeploymentService` transforms this into a clean `Deployment` domain object:

- `_id` → mapped to a human-readable `deploymentId` string.
- BSON `Date` objects → ISO 8601 strings (`2025-06-01T10:30:00Z`) for consistent handling across the application.
- Numeric status codes → descriptive status strings (`0` → `"pending"`, `1` → `"running"`, `2` → `"stable"`, `3` → `"failed"`).

### 2. Version Metadata — `VersionRepository` → `DeploymentService`

Raw version documents from the database include internal fields like `__v` (Mongoose version key) and nested metadata arrays. Before use, these are transformed into clean `ApplicationVersion` objects:

- Unwanted internal fields (`__v`, internal audit fields) are stripped out.
- Nested dependency arrays are flattened or summarized for display.
- Version tags are normalized to lowercase for consistent comparison logic.

### 3. Health Report — `HealthCheckService` → `FailureDetectionService`

The raw response from the container platform (Docker/Kubernetes health endpoint) arrives as an unstructured JSON blob. `HealthCheckService` transforms it into a structured `HealthReport` domain object:

- Extracts relevant fields (`status`, `responseTime`, `exitCode`).
- Normalizes platform-specific status strings (e.g., Docker's `"healthy"` / `"unhealthy"` / `"starting"`) into a unified internal enum.
- Attaches a timestamp and the associated `deploymentId` so the report is traceable.

### 4. Log Entries — `LogRepository` → `AdminController`

When an admin queries deployment logs, raw `LogEntry` documents from MongoDB are transformed before being sent in the API response:

- Sensitive internal fields are removed (e.g., internal system user IDs).
- Timestamps are formatted into human-readable strings.
- Log entries are sorted by timestamp descending and paginated so the UI does not receive unbounded data.

### 5. Rollback Data — `StableVersionRepository` → `RollbackService`

The stable version record is retrieved and transformed into a format `DeploymentPlatformClient` can use to invoke `rollbackContainer()`:

- The stored Docker image tag is extracted and validated.
- Environment-specific configuration (e.g., port bindings, volume mounts) is reconstructed from the stored version metadata so the rollback deploys with the correct container configuration.

### Transformation Flow (Summary)

```
[ MongoDB / External Platform ]
         ↓  (raw documents / API blobs)
[ Repository Layer ]
         ↓  (domain object construction)
[ Service Layer ]   ← Transformation happens here
         ↓  (clean domain models)
[ Controller Layer ]
         ↓  (formatted API responses)
[ UI / Admin Dashboard / Developer CLI ]
```

The transformation responsibility is deliberately placed in the **Service Layer**, not in repositories or controllers, following the principle of separation of concerns — repositories handle only data access, and controllers handle only request/response formatting.

---

*Document prepared based on the Argus project repository: [github.com/pro-me-the-us/los-amigos](https://github.com/pro-me-the-us/los-amigos)*
