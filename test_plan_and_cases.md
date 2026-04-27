# Q1 — Test Plan & Test Cases for Argus

## Project: **Argus – Container Deployment and Rollback Automation System**

---

# Part (a) — Test Plan

## 1. Objective of Testing

The objective of testing is to **verify and validate** that the Argus system correctly performs:

- Automated container-based application deployment via Docker.
- Health monitoring of deployed containers using HTTP and TCP probes.
- Failure detection based on health-check reports.
- Automatic rollback to the last known stable version upon deployment failure.
- Persistent storage of deployment logs, version history, and stable-version pointers in MongoDB.
- Correct CLI command parsing, routing, and user-facing output.

Testing aims to ensure **functional correctness, module integration, data integrity**, and a **reliable end-to-end deployment workflow** before the system is considered production-ready.

---

## 2. Scope — Modules / Features to Be Tested

| # | Module / Feature | Key Files | What Is Tested |
|---|---|---|---|
| 1 | **Deployment Management** | `deploymentManagementService.js`, `dockerClient.js` | Image parsing, container lifecycle (run/stop/remove), version & deployment persistence, end-to-end deploy flow |
| 2 | **Health Check** | `healthCheckService.js` | HTTP probe → TCP fallback → Unhealthy path, correct report structure |
| 3 | **Failure Detection** | `failureDetectionService.js` | Healthy vs. Unhealthy report classification, log level branching |
| 4 | **Rollback** | `rollbackService.js` | Container replacement with previous version, result structure |
| 5 | **Deployment Analysis** | `deploymentAnalysisService.js` | Orchestration of health-check + failure-detection + conditional rollback |
| 6 | **Logging & Version Persistence** | `logService.js`, `stateService.js`, DAL repositories | Log insertion/retrieval, version CRUD, stable-version tracking, legacy migration |
| 7 | **CLI & REST API** | `CLI.js`, `app.js` | Command parsing, flag extraction, API routing, validation errors, response formats |

### Out of Scope

- Authentication and authorization (not yet implemented).
- Performance / load / stress testing.
- Security / penetration testing.
- CI/CD pipeline integration testing.

---

## 3. Types of Testing to Be Performed

| Type | Purpose | Example |
|---|---|---|
| **Unit Testing** | Test individual functions and service methods in isolation. | `parseImage("nginx:latest")` returns `{ imageName: "nginx", version: "latest" }`. |
| **Integration Testing** | Verify that two or more modules work correctly together. | `DeploymentManagementService.deployApplication()` calling Docker client + Health-Check + State persistence in sequence. |
| **System Testing** | End-to-end validation of the full workflow via CLI or REST API. | Running `argus deploy-app --image=nginx:latest` and verifying container creation, health report, failure analysis, log entries, and version record. |
| **Regression Testing** | Re-run existing tests after bug-fixes to ensure no new defects. | After fixing the missing `await` in `DeploymentAnalysisService`, re-run the rollback-execution test case. |

---

## 4. Tools

| Tool | Purpose |
|---|---|
| **Node.js built-in `assert`** | Unit & integration assertions (project's existing `tests/run-tests.js` harness) |
| **PowerShell / Bash scripts** | Black-box test automation (`run_wb_tests.ps1`) |
| **Axios (HTTP client)** | Sending requests to the Argus REST API during integration & system tests |
| **Docker Desktop** | Container runtime required for deployment and rollback tests |
| **MongoDB Compass** | Manual data-verification of `logs`, `deployments`, `application_versions`, `stable_versions` collections |
| **Postman (optional)** | Ad-hoc manual API exploration and quick smoke tests |

---

## 5. Entry Criteria

| # | Criterion |
|---|---|
| 1 | Source code for all modules is code-complete and committed to the repository. |
| 2 | MongoDB server is running and reachable on the configured URI. |
| 3 | Docker Desktop is installed, running, and the Docker daemon is accessible. |
| 4 | Argus server starts successfully on `http://localhost:5000` (`npm start`). |
| 5 | All npm dependencies are installed (`npm install` succeeds without errors). |
| 6 | At least one Docker image (e.g., `nginx:latest`) is available locally or pullable from Docker Hub. |

---

## 6. Exit Criteria

| # | Criterion |
|---|---|
| 1 | All planned test cases have been executed. |
| 2 | **100 %** of critical / high-priority test cases pass. |
| 3 | No unresolved **Severity-1** (system crash / data loss) or **Severity-2** (major feature broken) defects remain open. |
| 4 | All identified defects are logged and either fixed-and-retested or accepted with documented justification. |
| 5 | Test results are documented and reviewed by the team. |

---
---

# Part (b) — 8 Test Cases for the **Deployment Management** Module

> **Module under test:** `DeploymentManagementService` — the core module that orchestrates the entire deploy-app workflow including image parsing, Docker container creation, health-checking, failure analysis, version persistence, and deployment logging.

---

## Test Case Table

| Test Case ID | Test Scenario / Description | Input Data | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| **TC-DM-01** | **Deploy with a valid, locally available image.** Verify that deploying a known-good image creates a container, runs a health-check, marks the version as stable, and persists a deployment record. | `{ deploymentId: "DEP-2001", image: "nginx:latest", url: "https://jsonplaceholder.typicode.com/posts/1" }` | Response contains: `deployment.imageName = "nginx"`, `deployment.version = "latest"`, `healthReport.status = "Healthy"`, `failureResult.failure = false`, `rollbackResult` is `null`. A new document appears in MongoDB `application_versions` with `stable: true`. | Response received with `imageName: "nginx"`, `version: "latest"`, `healthReport.status: "Healthy"`, `failureResult.failure: false`, `rollbackResult: null`. MongoDB record confirmed with `stable: true`. | **Pass** |
| **TC-DM-02** | **Deploy with a non-existent / unpullable image.** Verify that the system returns a clear error and does not leave orphan containers. | `{ deploymentId: "DEP-2002", image: "nonexistent-image-xyz:v99" }` | HTTP 500 response with `error` field describing a Docker pull failure. No running container named `deployment_DEP-2002`. | Server returned 500 with `error: "…pull access denied…"`. `docker ps -a --filter name=deployment_DEP-2002` shows no container. | **Pass** |
| **TC-DM-03** | **Parse a well-formed image string** (`name:tag`). Unit-level test of `DeploymentManagementService.parseImage()`. | `image = "myapp:v2"` | Returns `{ imageName: "myapp", version: "v2" }`. | `{ imageName: "myapp", version: "v2" }` returned. | **Pass** |
| **TC-DM-04** | **Parse an image string without a tag.** Verify the default tag `"latest"` is applied. | `image = "redis"` | Returns `{ imageName: "redis", version: "latest" }`. | `{ imageName: "redis", version: "latest" }` returned. | **Pass** |
| **TC-DM-05** | **Parse an invalid / empty image string.** Verify that a meaningful error is thrown. | `image = ":latest"` (empty name) | Throws `Error("Invalid image format")`. | `Error: Invalid image format` thrown as expected. | **Pass** |
| **TC-DM-06** | **Deploy missing the required `image` field.** Verify input validation returns a 400 error. | `POST /deploy` with body `{ deploymentId: "DEP-2006" }` (no `image` field) | HTTP 400 response: `{ error: "image is required" }`. | Response: `400 { error: "image is required" }`. | **Pass** |
| **TC-DM-07** | **Deploy missing the required `deploymentId` field.** Verify input validation returns a 400 error. | `POST /deploy` with body `{ image: "nginx:latest" }` (no `deploymentId` field) | HTTP 400 response: `{ error: "deploymentId is required" }`. | Response: `400 { error: "deploymentId is required" }`. | **Pass** |
| **TC-DM-08** | **Deploy with a failing health-check URL triggers rollback.** Deploy a valid image but point the health-check at an unreachable URL; verify failure is detected and rollback to the previous stable version is triggered. | `{ deploymentId: "DEP-2008", image: "nginx:latest", url: "http://localhost:59999" }` — with a prior stable version of `nginx` already recorded in MongoDB. | Response contains: `failureResult.failure = true`, `rollbackResult.status = "RolledBack"`, `rollbackResult.version` equals the previously stable version. The deployment record in MongoDB has `status: "FailedRolledBack"`. | `failureResult.failure: true`, `rollbackResult.status: "RolledBack"`, `rollbackResult.version: "latest"`. MongoDB deployment record shows `status: "FailedRolledBack"`. | **Pass** |

---

## Traceability to Source Code

| Test Case | Primary Code Path Exercised |
|---|---|
| TC-DM-01 | [deploymentManagementService.js:19–82](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/deploymentManagementService.js#L19-L82) — full happy-path |
| TC-DM-02 | [dockerClient.js](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/dockerClient.js) — image pull failure branch |
| TC-DM-03 | [deploymentManagementService.js:13–17](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/deploymentManagementService.js#L13-L17) — `parseImage` happy path |
| TC-DM-04 | [deploymentManagementService.js:14](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/deploymentManagementService.js#L14) — default tag assignment |
| TC-DM-05 | [deploymentManagementService.js:15](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/deploymentManagementService.js#L15) — validation throw |
| TC-DM-06 | [services.js:101](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/services.js#L101) — `requireString` for `image` |
| TC-DM-07 | [services.js:100](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/services.js#L100) — `requireString` for `deploymentId` |
| TC-DM-08 | [deploymentManagementService.js:39–70](file:///c:/Users/HI/Desktop/software_lab/los-amigos/argus-src/src/services/deploymentManagementService.js#L39-L70) — failure + rollback branch |
