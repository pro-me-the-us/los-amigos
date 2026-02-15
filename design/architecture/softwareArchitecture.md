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