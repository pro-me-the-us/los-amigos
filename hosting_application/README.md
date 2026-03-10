# Deployment Architecture & Strategy

## Host Site (Target Servers / Cloud)

- **Application Service (containerized app):**  
  Docker host VM on AWS EC2 (or Azure VM / GCP Compute), behind an Nginx reverse proxy.

- **Deployment Manager + Rollback Manager (backend service):**  
  Same VM as a control plane container set, or a separate VM for isolation.

- **Version Controller (metadata service):**  
  Same host as backend service (container), or managed service if available.

- **MongoDB (deployment logs + version history):**  
  Managed MongoDB Atlas (preferred) or a dedicated VM with persistent storage.

- **Container Registry:**  
  Docker Hub or a private registry (e.g., GitHub Container Registry / AWS ECR).

---

# Deployment Strategy (Step-by-Step)

## 1. Provision Servers
- Create VM(s) with Docker Engine and Docker Compose installed.
- Configure firewall rules and security groups.
- Assign static IP and configure DNS.

## 2. Configure Reverse Proxy
- Install and configure Nginx.
- Route API traffic to backend services.
- Enable HTTPS with SSL certificates.

## 3. Set Up Database
- Create MongoDB Atlas cluster  
  **OR**
- Install MongoDB on a dedicated VM with persistent storage volume.

## 4. Configure Registry Access
- Store container registry credentials as environment variables or secrets on the VM.

## 5. Deploy Backend Services
- Use Docker Compose to start:
  - Deployment Manager
  - Rollback Manager
  - Version Controller
  - Logging Service

## 6. Configure API Communication
- Use internal Docker network for backend service communication.
- Expose only required API ports externally.

## 7. Deploy Application Service
- Build Docker image.
- Push image to container registry.
- Deployment Manager pulls image and launches new container instance.

## 8. Health Checks
- Run automated health checks.
- If health check fails → trigger automatic rollback to last stable version.

## 9. Logging and Versioning
- Store deployment metadata and logs in MongoDB.
- Maintain rollback history.

## 10. Release Policy
- Use Blue/Green deployment or Rolling updates.
- Switch traffic only after successful health checks.

---

# Security Measures

## Network Security
- Allow only:
  - HTTPS (443)
  - SSH (22) from trusted IPs
- Database should NOT be publicly exposed.

## Transport Security
- Use TLS certificates (e.g., Let’s Encrypt) for API endpoints.

## Secret Management
- Store secrets using:
  - Environment variables
  - AWS Secrets Manager
  - HashiCorp Vault

## Registry Access
- Use private container registry.
- Access via tokens.
- Rotate credentials periodically.

## Container Hardening
- Run containers as non-root users.
- Use minimal base images (e.g., Alpine).
- Perform regular image vulnerability scanning.
