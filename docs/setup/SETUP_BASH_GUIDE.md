# setup.sh Run Guide

This guide explains how to run `setup.sh`, what it does, and which commands to use.

## File location
- Script path: `setup.sh` (project root)
- Project root: `C:\Users\HI\Desktop\software_lab\los-amigos`

## What `setup.sh` does
When you run `setup.sh`, it automates the full project bootstrap:

1. Loads `.env` (if present)
- Uses environment variables from root `.env` file.
- If no `.env` exists, it uses safe defaults.

2. Detects backend and DB
- Detects backend runtime (Node/Python).
- Detects DB engine (`mongo` or `postgres`) automatically.
- For this repo, it typically chooses MongoDB.

3. Checks required tools
- Verifies Docker is installed and daemon is running.
- Verifies runtime package manager (`npm`/python tooling).

4. Initializes Docker network
- Creates or reuses a project network.

5. Starts database container
- Starts MongoDB/Postgres container with required env vars.
- Waits until DB is actually ready.
- Runs DB init script if found (`schema.sql`, `init.sql`, `mongo-init.js`, etc.).

6. Starts application
- If a root `Dockerfile` exists: builds app image and runs app in Docker.
- If no root `Dockerfile`: installs deps and starts app locally.

7. Waits for app readiness
- Checks app health on `http://localhost:5000/`.
- Also checks startup log signal for slow boots.

8. Prints summary
- Shows mode, URL, DB engine, and ports.

9. Optional verification mode (`--verify`)
- Runs API checks, CLI checks, and tests.
- Saves evidence under `reports/verification_<timestamp>/`.

## Prerequisites
- Docker Desktop/Engine installed and running.
- Bash available:
  - Git Bash, WSL, or any bash shell.
- For local app mode (no root Dockerfile):
  - Node.js + npm installed.

## Recommended command sequence (Windows PowerShell)
From project root:

```powershell
Set-Location C:\Users\HI\Desktop\software_lab\los-amigos
```

### 1) Fresh start (recommended)
```powershell
bash ./setup.sh --clean
bash ./setup.sh
```

### 2) Full verification for submission evidence
```powershell
bash ./setup.sh --clean --verify
```

### 3) Force DB engine manually (optional)
```powershell
bash ./setup.sh --db mongo
bash ./setup.sh --db postgres
```

## Important usage notes
- Do **not** run `npm start` manually before/during setup.
- `setup.sh` already starts DB and app for you.
- After setup completes, use another terminal for CLI/API testing.

## Post-setup test commands
Open a new terminal:

```powershell
Set-Location C:\Users\HI\Desktop\software_lab\los-amigos\argus-src
node CLI.js show-interactions
node CLI.js health-check DEP-DEMO-1 https://jsonplaceholder.typicode.com/posts/1
node CLI.js show-logs
node CLI.js list-versions
```

Create a guaranteed new error log and verify:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/detect-failure" -ContentType "application/json" -Body "{\"healthReport\":{\"deploymentId\":\"DEP-DEMO-1\",\"status\":\"Unhealthy\",\"error\":\"forced\"}}"
Invoke-RestMethod "http://localhost:5000/logs?deploymentId=DEP-DEMO-1&limit=20" | ConvertTo-Json -Depth 8
```

## MongoDB Compass check
Connect Compass to the same MongoDB instance and check:
- `logs`
- `deployments`
- `application_versions`
- `stable_versions`

Use filter example:

```json
{ "deploymentId": "DEP-DEMO-1" }
```

## Troubleshooting

### App readiness timeout
- Re-run with clean:
```powershell
bash ./setup.sh --clean
bash ./setup.sh
```
- Check app logs:
```powershell
Get-Content .\logs\app.log -Tail 200
```

### Port 5000 already in use
- Stop old process and retry `setup.sh`:
```powershell
$line = (netstat -ano | Select-String ':5000' | Select-Object -First 1)
if ($line) { $pidValue = (($line.ToString() -split '\s+')[-1]); Stop-Process -Id $pidValue -Force }
bash ./setup.sh --clean
bash ./setup.sh
```

### `bash` not found
- Use Git Bash or WSL, then run:
```bash
cd /mnt/c/Users/HI/Desktop/software_lab/los-amigos
./setup.sh --clean
./setup.sh
```

## Quick command reference
```powershell
Set-Location C:\Users\HI\Desktop\software_lab\los-amigos
bash ./setup.sh
bash ./setup.sh --clean
bash ./setup.sh --verify
bash ./setup.sh --clean --verify
bash ./setup.sh --db mongo
bash ./setup.sh --db postgres
```
