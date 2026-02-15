# Container Deployment and Rollback Automation System

**Software Architecture Description**

---

## I. Chosen Software Architecture Style: **Layered + Service-Oriented Architecture (SOA)**

### A. Justification of Architecture Category (Granularity of Components)

The system follows a **layered structure** with clearly separated responsibilities and exposes functionality as **independent services**, making it aligned with **Service-Oriented Architecture**.

#### Layers and Their Granularity

1. **Presentation Layer (Controllers)**

   * `DeploymentController`
   * `AdminController`
   * Handles user/admin requests and responses.
   * No business logic → only orchestration.

2. **Application/Service Layer (Business Logic Services)**

   * `DeploymentService`
   * `RollbackService`
   * `HealthCheckService`
   * `FailureDetectionService`
   * `AuthenticationService`
   * `LogService`
   * Each service performs a **single well-defined responsibility** (high cohesion).

3. **Domain Layer (Core Models)**

   * `Deployment`
   * `ApplicationVersion`
   * `HealthReport`
   * `User`
   * Represents business entities and rules.

4. **Data Access Layer (Repositories)**

   * `DeploymentRepository`
   * `VersionRepository`
   * `StableVersionRepository`
   * `LogRepository`
   * Responsible only for persistence and retrieval.

5. **Infrastructure Layer (External Integration)**

   * `DeploymentPlatformClient`
   * Communicates with container platforms (e.g., Docker/Kubernetes).

---

### Logical View (Simplified)

```
[ Controllers ]
      ↓
[ Application Services ]
      ↓
[ Domain Models ]
      ↓
[ Repositories ]
      ↓
[ External Deployment Platform / Database ]
```

---

### Why This is SOA (Service-Oriented)

* Each major function is exposed as a **loosely coupled service**:

  * Deployment Service
  * Health Monitoring Service
  * Failure Detection Service
  * Rollback Service
  * Logging Service
* Services communicate through **well-defined interfaces**, not shared state.
* Enables future conversion into **independent deployable services (microservices-ready design)**.

---


## B. Why This Architecture is the Best Choice

### 1. Scalability

* Deployment, health-check, and logging workloads can scale independently.
* External deployment platform integration is isolated → easier horizontal scaling.
* Stateless services allow containerized scaling.

### 2. Maintainability

* Clear separation of concerns:

  * UI logic ≠ Business logic ≠ Persistence.
* Changes in rollback logic do NOT affect authentication or logging.
* Easier debugging due to modular structure.

### 3. Extensibility

* New features (e.g., Canary Deployment, Blue-Green Deployment) can be added as new services.
* New deployment platforms can be supported by extending `DeploymentPlatformClient`.

### 4. Performance

* Direct service-to-service calls avoid unnecessary overhead.
* Logging and health checks run asynchronously without blocking deployment.
* Repository pattern ensures efficient DB interaction.

### 5. Reliability (Critical for Deployment Systems)

* Failure detection + rollback isolated → safer recovery.
* Stable version repository guarantees known-good state.
* Logging layer ensures traceability of every deployment event.

### 6. Testability

* Each service can be unit-tested independently.
* Mock repositories/platform clients enable integration testing.

---

## II. Components Present in the System (Application Components)

### 1. Authentication & User Management

* **`AuthenticationService`**

  * Validates credentials and tokens.
* **`User`**

  * Represents developers/admin roles.

---

### 2. Deployment Management

* **`DeploymentController`**

  * Accepts deployment requests.
* **`DeploymentService`**

  * Coordinates full deployment workflow.
* **`Deployment`**

  * Represents a deployment instance.
* **`ApplicationVersion`**

  * Metadata of application version.

---

### 3. Platform Integration

* **`DeploymentPlatformClient`**

  * Executes:

    * `deployContainer()`
    * `rollbackContainer()`
  * Acts as adapter to container infrastructure.

---

### 4. Health Monitoring & Failure Detection

* **`HealthCheckService`**

  * Performs runtime validation after deployment.
* **`HealthReport`**

  * Encapsulates system health status.
* **`FailureDetectionService`**

  * Determines if rollback is required.

---

### 5. Rollback Management

* **`RollbackService`**

  * Initiates rollback to last stable version.
* **`StableVersionRepository`**

  * Stores last known stable build.

---

### 6. Version & Deployment Persistence

* **`VersionRepository`**

  * Stores version metadata.
* **`DeploymentRepository`**

  * Stores deployment history.

---

### 7. Logging & Observability

* **`LogService`**

  * Centralized logging interface.
* **`LogRepository`**

  * Persists logs.
* **`LogEntry`**

  * Represents structured log data.
* **`AdminController`**

  * Allows administrators to inspect logs.

---

## Overall Workflow (Execution Flow)

```
Developer → DeploymentController
          → AuthenticationService
          → DeploymentService
              → DeploymentPlatformClient (deploy)
              → HealthCheckService
                  → FailureDetectionService
                      → (If failure) RollbackService
              → LogService (store logs)
          → Status Returned to Developer/Admin
```

---

## Conclusion

The system uses a **Layered Service-Oriented Architecture** because it:

* Separates responsibilities cleanly.
* Enables scalable deployment automation.
* Ensures reliability through isolated rollback and monitoring services.
* Is maintainable, testable, and extensible for real-world DevOps environments.

This architecture is ideal for **automated container deployment systems**, where modularity, fault tolerance, and integration flexibility are critical.

---
