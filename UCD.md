## Use Case Diagram

```mermaid
usecaseDiagram
actor "Developer / CI-CD System" as Dev
actor "Deployment Operator" as Ops

rectangle "Container Deployment & Rollback Automation System" {

  Dev --> (Trigger Deployment)
  Dev --> (Provide New Version / Image)

  (Trigger Deployment) --> (Build Container Image)
  (Build Container Image) --> (Deploy Container)

  (Deploy Container) --> (Perform Health Check)

  (Perform Health Check) --> (Mark Deployment Stable)
  (Perform Health Check) --> (Detect Deployment Failure)

  (Detect Deployment Failure) --> (Automatic Rollback)

  Ops --> (View Deployment Status)
  Ops --> (View Deployment History)
  Ops --> (View Logs)

  Ops --> (Manual Rollback)
}
