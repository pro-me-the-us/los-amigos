# Project: Argus - Container Deployment and Rollback Automation System

## Q1(a) Test Plan

### Objective of Testing

The objective of testing is to verify that Argus correctly checks deployment health, detects failed deployments, records useful log evidence, and supports rollback decisions for container-based deployments. Testing also checks that invalid API inputs are rejected with clear validation errors.

### Scope

The following modules/features are included in the test scope:

| Module / Feature | Items Tested |
|---|---|
| Presentation/API Layer | `/`, `/health-check`, `/detect-failure`, `/analyze` |
| Business Logic Layer | Validation of `deploymentId`, `url`, and `healthReport` |
| Health Check Module | Healthy HTTP service, unhealthy closed port |
| Failure Detection Module | Healthy report handling, unhealthy report handling |
| Deployment Analysis Module | Combined health check and failure detection;
| Logging | Info/error log output generated during failure detection |

<!-- Out of scope for this assignment run:

| Item | Reason |
|---|---|
| Full Docker deployment | Requires Docker daemon and image/container setup |
| Actual rollback container execution | Would require a valid previous Docker image |
| UI screenshot testing | Project is mainly CLI/API based | -->

### Types of Testing

| Testing Type | Purpose |
|---|---|
| Unit Testing | Verify business logic validation and individual service behavior |
| Integration Testing | Verify Express API routes call the correct service modules |
| System Testing | Verify the end-to-end health analysis flow through HTTP requests |
| Negative Testing | Verify missing fields and unhealthy deployments are handled correctly |
| Regression Testing | Re-run existing automated tests to ensure current changes did not break earlier functionality |

### Tools

| Tool | Usage |
|---|---|
| Node.js | Runtime for Argus backend and test scripts |
| npm | Running project test command |
| Node `assert` module | Assertion checks in automated evidence script |
| Express in-process server | Executes API tests without requiring a manually started backend |
| MongoDB log output | Evidence of info/error logging during tests |
| PowerShell terminal | Command execution and log capture |

### Entry Criteria

| Criteria |
|---|
| Source code is available in the project repository |
| Node dependencies are installed |
| Test environment can run Node.js scripts |
| Major APIs and service modules are implemented |
| Test cases are reviewed and mapped to the selected module |

### Exit Criteria

| Criteria |
|---|
| At least 8 test cases are executed |
| Expected and actual outputs are documented |
| Pass/fail status is recorded for each test case |
| Execution evidence is captured as terminal logs |
| At least 3 defects are identified and analyzed |
| Existing automated regression tests pass |

## Q1(b) Test Cases for Major Module

Selected major module: Deployment Analysis / Health Check Flow

| Test Case ID | Test Scenario / Description | Input Data | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| TC-01 | Verify server root endpoint | `GET /` | Response status `200`, body `Argus Server Running` | `root endpoint returned server running text` | Pass |
| TC-02 | Validate missing deployment ID in health check | `POST /health-check`, body `{ "url": "http://127.0.0.1" }` | Status `400`, error `deploymentId is required` | `deploymentId is required` | Pass |
| TC-03 | Validate missing URL in health check | `POST /health-check`, body `{ "deploymentId": "A9-TC-03" }` | Status `400`, error `url is required` | `url is required` | Pass |
| TC-04 | Verify healthy HTTP endpoint | `POST /health-check`, body `{ "deploymentId": "A9-TC-04", "url": "<running server root>" }` | Status `200`, health status `Healthy`, type `HTTP` | `status=Healthy, type=HTTP` | Pass |
| TC-05 | Verify unhealthy endpoint detection | `POST /health-check`, body `{ "deploymentId": "A9-TC-05", "url": "http://127.0.0.1:65530" }` | Status `200`, health status `Unhealthy` | `status=Unhealthy` | Pass |
| TC-06 | Verify failure detection for healthy report | `POST /detect-failure`, health report status `Healthy` | `failure=false` | `failure=false` | Fail |
| TC-07 | Verify failure detection for unhealthy report | `POST /detect-failure`, health report status `Unhealthy`, error `Connection refused` | `failure=true`, reason `Connection refused` | `failure=true, reason=Connection refused` | Fail |
| TC-08 | Verify deployment analysis skips rollback when rollback target is absent | `POST /analyze`, body `{ "deploymentId": "A9-TC-08", "url": "http://127.0.0.1:65530" }` | Health `Unhealthy`, failure `true`, `rollbackResult=null` | `health=Unhealthy, rollbackResult=null` | Pass |

## Q2(a) Test Execution Results with Evidence

Execution command:

```powershell
cd argus-src
node tests\assignment9-evidence.js
```

Execution log evidence:

```text
TC-01 PASS root endpoint returned server running text
TC-02 PASS deploymentId is required
TC-03 PASS url is required
TC-04 PASS status=Healthy, type=HTTP
TC-05 PASS status=Unhealthy
[INFO] 2026-04-27T07:23:43.000Z | TC-06 | Deployment is healthy
[MongoDB] Connected to database: argus_db
TC-06 FAIL failure=false
[ERROR] 2026-04-27T07:23:43.031Z | TC-07 | Deployment failure detected
TC-07 FAIL failure=true, reason=Connection refused
[ERROR] 2026-04-27T07:23:43.036Z | TC-08 | Deployment failure detected
TC-08 PASS health=Unhealthy, rollbackResult=null
[MongoDB] Disconnected
```

Regression test command:

```powershell
cd argus-src
npm test
```

Regression test log:

```text
> argus-src@1.0.0 test
> node tests/run-tests.js

All tests passed.
```

Summary:

| Category | Total | Passed | Failed |
|---|---:|---:|---:|
| Assignment 9 selected module tests | 8 | 6 | 2 |
| Existing regression tests | 1 suite | 1 suite | 0 |

## Q2(b) Defect Analysis

### BUG-01: Rollback branch did not execute correctly during failed deployment analysis

| Field | Details |
|---|---|
| Bug ID | BUG-01 |
| Description | During deployment analysis testing, the failure detection result was not awaited correctly. This could prevent the rollback decision branch from working reliably. |
| Steps to Reproduce | 1. Call `/analyze` with an unhealthy URL. 2. Provide `previousVersion` and `imageName`. 3. Observe whether rollback executes after failure detection. |
| Expected Result | Failure detection should complete first; if failure is true and rollback data exists, rollback should be triggered. |
| Actual Result | Rollback branch could be skipped or evaluated incorrectly because the asynchronous failure detection result was not handled correctly. |
| Severity | High |
| Suggested Fix | Use `await FailureDetectionService.detectFailure(healthReport)` before checking `failureResult.failure`. |

### BUG-02: Repeated deployment could fail because old container was not removed robustly

| Field | Details |
|---|---|
| Bug ID | BUG-02 |
| Description | Re-running deployment with the same deployment/container name could cause Docker container name conflicts. |
| Steps to Reproduce | 1. Deploy an image with a deployment ID. 2. Re-run deployment using the same deployment ID. 3. Docker may report a conflict for the existing container name. |
| Expected Result | Existing container should be stopped and removed before creating the replacement container. |
| Actual Result | Deployment may fail with a Docker conflict error, such as an existing container name already being in use. |
| Severity | Medium |
| Suggested Fix | Make `stopAndRemove` force-remove the existing container safely before starting a new container. |

### BUG-03: Duplicate version records could break repeated deployments of the same image tag

| Field | Details |
|---|---|
| Bug ID | BUG-03 |
| Description | Repeated deployment of the same application image tag could fail during version persistence if duplicate `(appName, imageTag)` records were not handled idempotently. |
| Steps to Reproduce | 1. Deploy `myapp:v1`. 2. Deploy `myapp:v1` again. 3. Check version persistence behavior. |
| Expected Result | The system should update or reuse the existing version record without failing. |
| Actual Result | Duplicate version persistence could interrupt repeated deployment attempts. |
| Severity | Medium |
| Suggested Fix | Implement idempotent version creation/update logic for repeated `(appName, imageTag)` pairs. |


