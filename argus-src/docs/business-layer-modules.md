# Business Logic Layer Modules and Presentation Interaction

## Core Functional Modules (Business Logic Layer)

The business layer is implemented through the `BusinessLogicLayer` facade in:

- `argus-src/src/services/services.js`

It coordinates these core modules:

1. **Deployment Management Module**
- Service: `DeploymentManagementService`
- Responsibilities:
  - Parse and validate deploy image reference.
  - Start deployment container via Docker client.
  - Persist deployment and version records.

2. **Deployment Analysis Module**
- Services: `DeploymentAnalysisService`, `HealthCheckService`, `FailureDetectionService`, `RollbackService`
- Responsibilities:
  - Run health checks.
  - Detect unhealthy deployment outcomes.
  - Trigger rollback when a stable previous version exists.

3. **Version Control Module**
- Service/Store: `stateService`
- Responsibilities:
  - Maintain version history.
  - Resolve last stable version for rollback.
  - Serve version list requests.

4. **Logging and Audit Module**
- Services: `LogService`, `stateService`
- Responsibilities:
  - Capture INFO/ERROR deployment events.
  - Persist logs for traceability.
  - Provide logs to presentation layer.

---

## Presentation Layer Components and Their Interaction

### 1) HTTP Presentation (`argus-src/src/app.js`)

The HTTP handlers now call only `BusinessLogicLayer` methods:

- `POST /deploy` -> `BusinessLogicLayer.deployApplication()`
- `POST /analyze` -> `BusinessLogicLayer.analyzeDeployment()`
- `POST /health-check` -> `BusinessLogicLayer.runHealthCheck()`
- `POST /detect-failure` -> `BusinessLogicLayer.detectFailure()`
- `POST /rollback` -> `BusinessLogicLayer.runRollback()`
- `GET /versions` -> `BusinessLogicLayer.listVersions()`
- `GET /logs` -> `BusinessLogicLayer.fetchLogs()`

### 2) CLI Presentation (`argus-src/CLI.js`)

CLI commands interact with HTTP presentation endpoints, which then call business modules:

- `argus deploy-app` -> `/deploy` -> Deployment + Analysis + Version + Logging modules
- `argus health-check` -> `/health-check` and `/detect-failure` -> Analysis + Logging modules
- `argus rollback` -> `/rollback` -> Analysis + Version + Logging modules
- `argus list-versions` -> `/versions` -> Version module
- `argus show-logs` -> `/logs` -> Logging module
- `argus show-interactions` -> `/ui-interactions` and `/business-modules` for explicit layer mapping

---


