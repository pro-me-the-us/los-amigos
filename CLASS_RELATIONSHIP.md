# Class Relationships

This document outlines the structural connections between classes in the deployment system.

## UML Diagram Reference
![System UML Diagram](UML.png)

---

## 1. Core Associations & Dependencies

The following relationships define how classes interact and rely on one another to execute system logic.

* **DeploymentController**
    * **Uses** `AuthenticationService` (Dependency)
    * **Uses** `DeploymentService` (Dependency)
* **DeploymentService**
    * **Manages/Creates** `Deployment` (Association)
    * **Uses** `DeploymentPlatformClient` (Association)
    * **Uses** `VersionRepository` (Dependency)
    * **Uses** `LogService` (Dependency)
* **Deployment**
    * **Uses/Runs version** `ApplicationVersion` (Association)
* **RollbackService**
    * **Uses** `StableVersionRepository` (Dependency)
    * **Uses** `DeploymentPlatformClient` (Dependency)
* **AuthenticationService**
    * **Depends on** `User` (Dependency)

---

## 2. Service-to-Service Interaction

These connections define the flow of data and control between specialized service components.

* **HealthCheckService**
    * **Checks health of** `Deployment` (Association)
    * **Generates** `HealthReport` (Dependency)
* **FailureDetectionService**
    * **Depends on / Analyzes** `HealthReport` (Dependency)
* **AdminController**
    * **Uses** `LogService` (Dependency)
* **LogService**
    * **Uses** `LogRepository` (Dependency)

---

## 3. Data Ownership & Persistence

These relationships define the lifecycle and storage structure of system data.

* **LogRepository**
    * **Contains** `LogEntry` (Composition - *A LogRepository owns the lifecycle of its entries*)
* **StableVersionRepository**
    * **Retrieves stable version from** `ApplicationVersion` (Association)
* **DeploymentRepository**
    * **Stores or contains** `Deployment` (Aggregation)

---

## Summary Relationship Table

| Class A | Relationship Type | Class B |
| :--- | :--- | :--- |
| `DeploymentController` | Dependency | `AuthenticationService` |
| `DeploymentController` | Dependency | `DeploymentService` |
| `DeploymentService` | Association | `Deployment` |
| `Deployment` | Association | `ApplicationVersion` |
| `HealthCheckService` | Dependency | `HealthReport` |
| `LogRepository` | Composition | `LogEntry` |
| `FailureDetectionService` | Dependency | `HealthReport` |
| `RollbackService` | Dependency | `StableVersionRepository` |