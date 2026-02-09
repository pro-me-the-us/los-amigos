# Software Requirements Specification  
## Container Deployment and Rollback Automation System

---

## 1. Introduction

This document describes the software requirements for the *Container Deployment and Rollback Automation System*.  
The system is intended to automate the deployment of applications using containers and provide a rollback mechanism when a deployment fails.

The purpose of this document is to clearly state the functional and non-functional requirements of the system in simple and unambiguous English. This document is prepared as part of **Software Engineering Lab 1**.

---

## 2. Scope of the System

The system shall support container-based deployment of applications.  
It shall monitor deployments and automatically restore the last stable version if a failure occurs.

The system is intended for academic and learning purposes and is not designed for large-scale production environments.

---

## 3. Definitions and Abbreviations

- **Container**: A lightweight environment used to package and run an application.
- **Deployment**: The process of launching a new version of an application.
- **Rollback**: The process of restoring a previously stable version of an application.
- **Stable Version**: A version of the application that has passed all health checks.

---

## 4. Overall Description

### 4.1 Product Perspective

The system operates as an automation layer on top of container technology.  
It manages application versions, deployment status, and rollback operations without manual intervention.

---

### 4.2 Product Functions

The system shall:
- Deploy applications using containers
- Maintain a record of deployment versions
- Perform health checks after deployment
- Roll back to a stable version if a failure is detected
- Store deployment and rollback logs

---

### 4.3 User Classes and Characteristics

- **Developer**: Initiates deployments and monitors system status.
- **System Administrator**: Maintains the deployment environment and configuration.

Both users are expected to have basic knowledge of containers and command-line tools.

---

### 4.4 Operating Environment

- Operating System: Linux-based environment  
- Container Platform: Docker  
- Database: MongoDB  
- Programming Environment: Node.js or Python  

---

### 4.5 Design Constraints

- The system shall rely on container technology for deployment.
- The system shall operate using command-line interfaces.
- The system shall be implemented using open-source tools.

---

## 5. Functional Requirements

### FR-1 Deployment Automation  
The system shall deploy an application using a container image provided by the user.

---

### FR-2 Version Tracking  
The system shall store information about each deployment, including version identifier and deployment time.

---

### FR-3 Health Check  
The system shall perform a health check after each deployment to determine whether the deployment is successful.

---

### FR-4 Failure Detection  
The system shall detect a deployment failure if the health check does not pass within a defined time limit.

---

### FR-5 Rollback Operation  
The system shall automatically roll back to the most recent stable version when a deployment failure is detected.

---

### FR-6 Logging  
The system shall log all deployment and rollback events for later review.

---

## 6. Non-Functional Requirements

### NFR-1 Reliability  
The system shall ensure that a stable version of the application is always available.

---

### NFR-2 Performance  
The rollback operation shall complete within a reasonable time after a failure is detected.

---

### NFR-3 Usability  
The system shall provide clear and readable log messages for users.

---

### NFR-4 Maintainability  
The system shall be modular so that new features can be added with minimal changes.

---

### NFR-5 Security  
The system shall restrict access to deployment operations to authorized users.

---

## 7. Assumptions and Dependencies

- The container platform is correctly installed and configured.
- The application provided by the user is containerized.
- Network connectivity is available during deployment.

---

## 8. Future Enhancements

Future versions of the system may include:
- A graphical user interface
- Integration with continuous integration pipelines
- Support for container orchestration platforms

---

## 9. Conclusion

This document provides a clear and structured description of the requirements for the Container Deployment and Rollback Automation System.  
The requirements defined in this document serve as a foundation for system design and implementation.
