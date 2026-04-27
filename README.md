# Argus — Container Deployment and Rollback Automation System

<img src="design/argus.png" style="height:200px; width:auto;">

> **Software Engineering Lab · Semester 6**
> Team: **Los Amigos**

---

## Overview

Argus automates **container-based application deployment** and provides a reliable **rollback mechanism** when a deployment fails.  
In modern software systems, frequent deployments are common — but a failed deploy can cause downtime and instability. Argus eliminates manual effort by:

- Deploying applications inside Docker containers
- Running health-checks (HTTP + TCP) after every deployment
- Detecting failures automatically
- Rolling back to the last known stable version
- Logging every event to MongoDB for full traceability

---

## Quick Start

```bash
# 1. Prerequisites: Docker Desktop + MongoDB running

# 2. Install dependencies
cd argus-src
npm install

# 3. Start the server
npm start          # → http://localhost:5000

# 4. Use the CLI
node CLI.js deploy-app --image=nginx:latest
node CLI.js show-logs
node CLI.js list-versions
```

> For a detailed environment setup walkthrough, see [`docs/setup/`](docs/setup/).

---

## Tech Stack

| Technology | Role |
|---|---|
| **Node.js + Express** | Backend API server |
| **Docker / Dockerode** | Container lifecycle management |
| **MongoDB** | Deployment logs, version history, stable-version tracking |
| **Axios** | HTTP health-check probes + CLI ↔ Server communication |
| **Shell / PowerShell** | Automation & test scripts |

---

## Repository Structure — Navigation Guide

```
los-amigos/
│
├── argus-src/                  ← 🔧 CORE APPLICATION
│   ├── CLI.js                  ← CLI entry point (user commands)
│   ├── demo.js                 ← Quick demo script
│   ├── Dockerfile              ← Container image for Argus itself
│   ├── package.json            ← Dependencies & npm scripts
│   │
│   ├── src/                    ← Application source code
│   │   ├── server.js           ← Express server bootstrap
│   │   ├── app.js              ← Route definitions (REST API)
│   │   ├── CLI.js              ← Internal CLI module
│   │   ├── demo.js             ← Demo scenario runner
│   │   │
│   │   ├── services/           ← ⭐ Business Logic Layer
│   │   │   ├── services.js                     ← BusinessLogicLayer facade + validation
│   │   │   ├── deploymentManagementService.js  ← Full deploy workflow orchestration
│   │   │   ├── healthCheckService.js           ← HTTP → TCP fallback health probes
│   │   │   ├── failureDetectionService.js      ← Healthy vs. Unhealthy classification
│   │   │   ├── rollbackService.js              ← Container rollback execution
│   │   │   ├── deploymentAnalysisService.js    ← Health + Failure + Rollback pipeline
│   │   │   ├── logService.js                   ← Structured logging (info/error)
│   │   │   ├── stateService.js                 ← Version/deployment state + legacy migration
│   │   │   ├── dockerClient.js                 ← Docker API wrapper (run/stop/pull)
│   │   │   └── businessModules.js              ← Module metadata & UI interaction map
│   │   │
│   │   ├── commands/           ← CLI command handlers
│   │   │   └── ShowLogs.js
│   │   │
│   │   └── config/
│   │       └── config.js       ← Environment configuration
│   │
│   ├── dal/                    ← 💾 Data Access Layer
│   │   ├── index.js            ← DAL barrel export
│   │   ├── db/
│   │   │   ├── connection.js   ← MongoDB connection manager
│   │   │   └── init.js         ← Database initialization
│   │   └── repositories/
│   │       ├── DeploymentRepository.js
│   │       ├── LogRepository.js
│   │       ├── VersionRepository.js
│   │       └── StableVersionRepository.js
│   │
│   ├── tests/                  ← 🧪 Test Suite
│   │   ├── run-tests.js        ← Test runner harness
│   │   ├── test-dal.js         ← DAL integration tests
│   │   ├── unit/
│   │   │   └── unit.js
│   │   └── integration/
│   │       └── integration.js
│   │
│   ├── scripts/
│   │   └── scripts.js          ← Utility scripts
│   │
│   └── docs/
│       └── business-layer-modules.md
│
├── design/                     ← 📐 Design Documents
│   ├── argus.png               ← Project logo
│   ├── CLASS_RELATIONSHIP.md   ← Class relationship descriptions
│   ├── KEY_CLASSES.md          ← Key class documentation
│   ├── DFD.md                  ← Data Flow Diagram descriptions
│   ├── UCD.md                  ← Use Case Diagram & descriptions
│   └── architecture/
│       └── softwareArchitecture.md  ← Full architecture document (Layered + SOA)
│
├── diagrams/                   ← 📊 Visual Diagrams (PNG)
│   ├── deployment/
│   │   └── UseCase_ContainerDeployment.png
│   ├── dfd/
│   │   ├── Level0DFD.png
│   │   └── level1DFD.png
│   └── uml/
│       ├── UML.png
│       └── classes.png
│
├── docs/                       ← 📚 All Documentation
│   ├── requirements/
│   │   └── SOFTWARE_REQUIREMENTS.md    ← SRS document
│   │
│   ├── assignments/            ← Lab assignment submissions
│   │   ├── Assignment4_Architecture.md ← Software architecture description
│   │   └── Assignment7_BusinessRules.md← Business rules, validation, data transformation
│   │
│   ├── hosting/                ← Deployment & hosting docs
│   │   ├── DEPLOYMENT_STRATEGY.md      ← Cloud deployment strategy
│   │   ├── SERVICE_MODEL.md            ← System architecture & component breakdown
│   │   └── CLI_JUSTIFICATION.md        ← Why CLI was chosen as the UI
│   │
│   ├── testing/                ← Testing documentation & scripts
│   │   ├── test_plan_and_cases.md      ← Test plan + 8 detailed test cases (Q1)
│   │   ├── test_cases_blackbox_whitebox.md ← 20 BB + 20 WB test cases
│   │   ├── test_results.md             ← Execution results report
│   │   └── run_wb_tests.ps1            ← Automated white-box test script
│   │
│   └── setup/                  ← Environment setup guides
│       ├── SETUP_BASH_GUIDE.md         ← Bash/WSL setup walkthrough
│       └── setup.sh                    ← One-click setup script
│
├── graphify-out/               ← 📈 Code Graph Analysis (auto-generated)
│   ├── GRAPH_REPORT.md         ← Graph analysis report
│   ├── graph.html              ← Interactive dependency graph
│   ├── graph.json              ← Raw graph data
│   └── cache/                  ← Graph extraction cache
│
├── .gitignore
├── package.json                ← Root package (workspace-level)
└── package-lock.json
```

---

## Where to Find What

| I want to… | Go to… |
|---|---|
| **Understand the project** | This README |
| **Read the SRS** | [`docs/requirements/SOFTWARE_REQUIREMENTS.md`](docs/requirements/SOFTWARE_REQUIREMENTS.md) |
| **See the architecture** | [`design/architecture/softwareArchitecture.md`](design/architecture/softwareArchitecture.md) |
| **View UML / DFD diagrams** | [`diagrams/`](diagrams/) and [`design/`](design/) |
| **Read key class descriptions** | [`design/KEY_CLASSES.md`](design/KEY_CLASSES.md) |
| **See class relationships** | [`design/CLASS_RELATIONSHIP.md`](design/CLASS_RELATIONSHIP.md) |
| **Read the source code** | [`argus-src/src/`](argus-src/src/) |
| **Understand the REST API** | [`argus-src/src/app.js`](argus-src/src/app.js) |
| **Use the CLI** | [`argus-src/CLI.js`](argus-src/CLI.js) |
| **Run tests** | `cd argus-src && npm test` or [`docs/testing/`](docs/testing/) |
| **Read test plan & test cases** | [`docs/testing/test_plan_and_cases.md`](docs/testing/test_plan_and_cases.md) |
| **See test results** | [`docs/testing/test_results.md`](docs/testing/test_results.md) |
| **Set up the environment** | [`docs/setup/`](docs/setup/) |
| **Deployment & hosting strategy** | [`docs/hosting/`](docs/hosting/) |
| **Business rules & validation** | [`docs/assignments/Assignment7_BusinessRules.md`](docs/assignments/Assignment7_BusinessRules.md) |
| **Explore code dependency graph** | [`graphify-out/graph.html`](graphify-out/graph.html) |

---

## System Architecture

The system follows a **Layered + Service-Oriented Architecture (SOA)**:

```
┌─────────────────────────────────┐
│   Presentation Layer (CLI/API)  │  CLI.js  ·  app.js
├─────────────────────────────────┤
│   Business Logic Layer          │  services/*.js
│   (Services)                    │  BusinessLogicLayer facade
├─────────────────────────────────┤
│   Data Access Layer (DAL)       │  dal/repositories/*.js
├─────────────────────────────────┤
│   Infrastructure Layer          │  Docker (dockerClient.js)
│                                 │  MongoDB (connection.js)
└─────────────────────────────────┘
```

> Full details: [`design/architecture/softwareArchitecture.md`](design/architecture/softwareArchitecture.md)

---

## Deployment Workflow

```
1. Developer pushes new code
2. Docker image is built
3. A new container is deployed
4. Health checks are performed (HTTP → TCP fallback)
5. If healthy → version marked as stable
6. If failed  → auto-rollback to last stable version
7. Every event is logged to MongoDB
```

---

## CLI Commands

| Command | Description |
|---|---|
| `argus deploy-app --image=<name:tag>` | Deploy a container image |
| `argus health-check <deploymentId> [url]` | Run a health check |
| `argus rollback --version=<v> --image=<name>` | Rollback to a specific version |
| `argus list-versions [imageName]` | List stored versions |
| `argus show-logs` | Display deployment logs |
| `argus show-interactions` | Show business module interactions |
| `argus demo` | Run a demo scenario |

---

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Server health ping |
| `GET` | `/business-modules` | List core business modules |
| `GET` | `/ui-interactions` | UI → Business interaction map |
| `POST` | `/health-check` | Run health check |
| `POST` | `/detect-failure` | Analyze health report for failure |
| `POST` | `/rollback` | Execute rollback |
| `POST` | `/deploy` | Deploy an application |
| `POST` | `/analyze` | Full deployment analysis pipeline |
| `GET` | `/logs` | Query logs (filter by `level`, `deploymentId`, `limit`) |
| `GET` | `/versions` | List versions (filter by `imageName`) |

---

## Lab Assignment Index

| # | Assignment | Document |
|---|---|---|
| 1 | Software Requirements Specification | [`docs/requirements/SOFTWARE_REQUIREMENTS.md`](docs/requirements/SOFTWARE_REQUIREMENTS.md) |
| 2 | Use Case Diagram | [`design/UCD.md`](design/UCD.md) |
| 3 | Class Diagram & DFD | [`design/KEY_CLASSES.md`](design/KEY_CLASSES.md) · [`design/DFD.md`](design/DFD.md) |
| 4 | Software Architecture | [`docs/assignments/Assignment4_Architecture.md`](docs/assignments/Assignment4_Architecture.md) |
| 7 | Business Rules, Validation, Transformation | [`docs/assignments/Assignment7_BusinessRules.md`](docs/assignments/Assignment7_BusinessRules.md) |
| — | Hosting & Deployment Strategy | [`docs/hosting/`](docs/hosting/) |
| — | Test Plan, Test Cases & Results | [`docs/testing/`](docs/testing/) |

---

## Team

**Los Amigos** — Software Engineering Lab, Semester 6

---
