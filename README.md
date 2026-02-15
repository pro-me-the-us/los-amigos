# Argus : Container Deployment and Rollback Automation System

![argus icon](design/argus.png)

## Overview
This project is developed as part of the **Software Engineering Lab (Semester 6)**.  
The objective of this system is to automate **container-based application deployment** and provide a reliable **rollback mechanism** in case a deployment fails.

In modern software systems, frequent deployments are common. However, failed deployments can lead to downtime and system instability. This project focuses on reducing manual effort and improving reliability by automating deployment and rollback using containers.

---

## Objectives
- Automate container-based application deployment  
- Maintain deployment version history  
- Detect failed deployments  
- Roll back automatically to the last stable version  
- Minimize downtime and manual intervention  

---

## Problem Statement
Manual deployment processes are often error-prone and time-consuming.  
In case of a failed deployment, restoring the previous stable version manually increases downtime and risk.

This project addresses the problem by providing a container-based deployment system that:
- Deploys applications in isolated environments
- Tracks deployment versions
- Automatically rolls back when failures are detected

---

## System Architecture
The system follows a modular architecture consisting of the following components:

- **Application Service** – The containerized application to be deployed  
- **Deployment Manager** – Handles building and deploying containers  
- **Version Controller** – Maintains metadata of previous deployments  
- **Rollback Manager** – Restores the last stable container when a failure occurs  

---

## Tech Stack
- **Docker** – Containerization  
- **Docker Compose** – Managing multi-container setups  
- **Node.js / Python** – Backend logic for deployment and rollback  
- **Shell Scripts** – Automation tasks  
- **MongoDB** – Storage for deployment logs and version history  
- **Git** – Version control  

---

## Features
- Automated container deployment  
- Deployment version tracking  
- Health checks after deployment  
- Automatic rollback on failure  
- Deployment logs stored in the database  
- Simple and modular design  

---

## Deployment Workflow
1. Developer pushes new code  
2. Docker image is built  
3. A new container is deployed  
4. Health checks are performed  
5. If successful, the deployment is marked as stable  
6. If failed, the system rolls back to the previous stable version  

---

## Rollback Mechanism
The system continuously monitors the health of deployed containers.  
If a deployment failure is detected:
- The current container is stopped  
- The last stable container image is redeployed  
- The rollback event is logged for reference  

This approach ensures system stability and reduced downtime.
