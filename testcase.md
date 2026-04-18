# Argus Test Cases (Black-Box and White-Box)

## Scope and assumptions
- Scope is based on current implemented functionalities in `argus-src/CLI.js`, `argus-src/src/app.js`, and service modules.
- No login/auth test cases are included.
- MongoDB service is running and reachable.
- Argus server is running on `http://localhost:5000`.

## Functionalities covered from help/commands
- `argus demo`
- `argus health-check <deploymentId> [url]`
- `argus deploy-app --image=<name:tag> [--url=...] [--deploymentId=...]`
- `argus list-versions [imageName]`
- `argus rollback --version=<v> --image=<name> [--deploymentId=...]`
- `argus show-logs` (and alias `showlogs`)
- `argus show-interactions`
- HTTP routes: `/`, `/business-modules`, `/ui-interactions`, `/health-check`, `/detect-failure`, `/rollback`, `/logs`, `/versions`, `/analyze`, `/deploy`

## Black-box test cases

| TC ID | Feature | Preconditions | Steps | Expected Result |
|---|---|---|---|---|
| BB-01 | CLI help output | None | Run `node CLI.js` | Help text shows all supported commands. |
| BB-02 | Unknown command handling | None | Run `node CLI.js invalid-command` | Prints `Unknown command` and help text. |
| BB-03 | Health check happy path | Server running, internet available | Run `node CLI.js health-check DEP-1001 https://jsonplaceholder.typicode.com/posts/1` | Prints healthy health report and failure=false. |
| BB-04 | Health check missing deploymentId | Server running | Run `node CLI.js health-check` | Prints usage guidance for `health-check`. |
| BB-05 | Deploy happy path with valid image | Docker running, image available (local or hub) | Run `node CLI.js deploy-app --image=nginx:latest --url=https://jsonplaceholder.typicode.com/posts/1` | Deployment result printed, health/failure analysis returned, data persisted. |
| BB-06 | Deploy missing image | Server running | Run `node CLI.js deploy-app` | Prints usage guidance for deploy-app image flag. |
| BB-07 | Deploy invalid/non-existent image | Docker running | Run `node CLI.js deploy-app --image=myapp:v2` | Clean error message + actionable hint is shown. |
| BB-08 | Rollback happy path | Docker running, image tag available | Run `node CLI.js rollback --version=latest --image=nginx` | Rollback result JSON printed. |
| BB-09 | Rollback missing required flags | Server running | Run `node CLI.js rollback --version=latest` | Prints rollback usage guidance. |
| BB-10 | Show logs default | Server + Mongo running with log records | Run `node CLI.js show-logs` | Displays stored logs list with timestamps and deployment IDs. |
| BB-11 | Show logs alias | Server + Mongo running | Run `node CLI.js showlogs` | Behaves same as `show-logs` command. |
| BB-12 | Show interactions | Server running | Run `node CLI.js show-interactions` | Prints core modules and presentation-business interactions. |
| BB-13 | List versions all | Server running | Run `node CLI.js list-versions` | Prints version records or `No versions found.` |
| BB-14 | List versions filtered | Server running and data present | Run `node CLI.js list-versions nginx` | Shows only versions for `nginx` imageName. |
| BB-15 | Demo command | Server running | Run `node CLI.js demo` | Prints healthy scenario and failed scenario output (or descriptive error if rollback image missing). |
| BB-16 | Root endpoint | Server running | Call `GET /` | Response is `Argus Server Running`. |
| BB-17 | Business modules endpoint | Server running | Call `GET /business-modules` | Returns array of module definitions. |
| BB-18 | UI interactions endpoint | Server running | Call `GET /ui-interactions` | Returns interaction mapping object. |
| BB-19 | Logs endpoint with filters | Server running + data in Mongo | Call `GET /logs?level=error&limit=10` | Returns `{ success, count, logs }`, logs filtered by level and limited. |
| BB-20 | Versions endpoint | Server running | Call `GET /versions` | Returns array of versions from Mongo-backed state service. |

## White-box test cases

| TC ID | Code path/branch | Preconditions | Test input/steps | Expected branch behavior |
|---|---|---|---|---|
| WB-01 | `requireString` validation in `services.js` for health-check | Server running | `POST /health-check` with missing `deploymentId` | Throws `ValidationError`, API returns 400 with `deploymentId is required`. |
| WB-02 | `requireString` validation for deploy image | Server running | `POST /deploy` with missing `image` | Returns 400 with `image is required`. |
| WB-03 | `detectFailure` healthy branch | Server running | `POST /detect-failure` with `{ healthReport: { deploymentId: 'D1', status: 'Healthy' } }` | Returns `{ failure: false }`; info log is written. |
| WB-04 | `detectFailure` failure branch | Server running | `POST /detect-failure` with unhealthy healthReport | Returns `{ failure: true, reason: ... }`; error log is written. |
| WB-05 | HealthCheckService HTTP success branch | Reachable URL | Call health-check with HTTP 200 URL | Returns `{ status: 'Healthy', type: 'HTTP' }`. |
| WB-06 | HealthCheckService TCP fallback branch | HTTP fails, TCP port open | Use URL where HTTP path fails but service port accepts socket | Returns `{ status: 'Healthy', type: 'TCP' }`. |
| WB-07 | HealthCheckService unhealthy branch | HTTP fails, TCP closed | Use invalid URL/closed port | Returns `{ status: 'Unhealthy' }` and logs error. |
| WB-08 | DeploymentAnalysisService rollback skipped branch | previousVersion or imageName missing | Call `POST /analyze` with failed health and no rollback target | `rollbackResult` remains `null`. |
| WB-09 | DeploymentAnalysisService rollback executed branch | previousVersion and imageName provided | Call `POST /analyze` with failing URL and rollback params | `rollbackResult` object returned. |
| WB-10 | `parseImage` success branch in deployment management | None | Input image `nginx:latest` | Parses to `{ imageName: 'nginx', version: 'latest' }`. |
| WB-11 | `parseImage` invalid image branch | None | Input image `:latest` or empty name | Throws `Invalid image format`. |
| WB-12 | Docker image existence branch | Docker running | Deploy with image already local | `pullImage` is skipped; container is created directly. |
| WB-13 | Docker image pull branch | Docker running | Deploy with valid remote image not local | `pullImage` executes before container creation. |
| WB-14 | Stable version update branch | Successful deployment | Deploy healthy image | `addVersion` marks stable and updates `stable_versions` collection. |
| WB-15 | `/logs` route branch: deployment filter | Logs present | `GET /logs?deploymentId=<id>&limit=5` | Uses `findByDeployment` path. |
| WB-16 | `/logs` route branch: level filter | Logs present | `GET /logs?level=info&limit=5` | Uses `findByLevel` path. |
| WB-17 | `/logs` route branch: default recent | Logs present | `GET /logs` | Uses `listRecent` path. |
| WB-18 | Legacy migration branch in state service | Legacy `data/state.json` exists and Mongo collections initially empty | Start server | `migrateLegacyStateToMongo` imports logs/versions/deployments into Mongo once. |
| WB-19 | No-op migration branch | Legacy file absent or Mongo already populated | Start server | Migration exits without duplicating records. |
| WB-20 | `/versions` async path | Server running | `GET /versions` and `GET /versions?imageName=nginx` | Returns mapped version docs from Mongo-backed `getVersions`. |

## Data verification checklist in MongoDB Compass
- Verify collections exist: `logs`, `deployments`, `application_versions`, `stable_versions`.
- After running deploy/rollback/health-check flows, verify:
  - New log entries appear in `logs`.
  - Deployment entries appear in `deployments`.
  - Version entries appear in `application_versions`.
  - Stable pointer updates appear in `stable_versions`.

## Out-of-scope
- Authentication and authorization (login) test cases.
- Performance/load/security penetration testing.
- CI/CD pipeline deployment tests.
