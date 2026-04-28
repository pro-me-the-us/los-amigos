#!/usr/bin/env bash

# setup.sh
# -----------------------------------------------
# Production-ready setup/bootstrap script.
#
# How to run:
#   chmod +x setup.sh
#   ./setup.sh
#
# Optional flags:
#   ./setup.sh --clean        # Remove old app/db containers, network, app image, pid/log files
#   ./setup.sh --db postgres  # Force postgres (default auto-detect)
#   ./setup.sh --db mongo     # Force mongodb
#   ./setup.sh --verify       # Run verification suite (tests + key CLI/API checks) and save reports
#
# Optional env overrides (.env supported):
#   PROJECT_NAME, APP_PORT, APP_CONTAINER_PORT,
#   DB_ENGINE, DB_NAME, DB_USER, DB_PASSWORD,
#   POSTGRES_PORT, MONGO_PORT,
#   APP_IMAGE_TAG, APP_CONTAINER_NAME, DB_CONTAINER_NAME, NETWORK_NAME
# -----------------------------------------------

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -------- Logging helpers --------
log()  { printf '[INFO] %s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*"; }
err()  { printf '[ERROR] %s\n' "$*" >&2; }
die()  { err "$*"; exit 1; }

trap 'err "Script failed at line $LINENO."' ERR

# -------- Defaults --------
PROJECT_NAME_DEFAULT="$(basename "$SCRIPT_DIR" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')"
PROJECT_NAME="${PROJECT_NAME:-$PROJECT_NAME_DEFAULT}"
APP_PORT="${APP_PORT:-5000}"
APP_CONTAINER_PORT="${APP_CONTAINER_PORT:-5000}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
MONGO_PORT="${MONGO_PORT:-27017}"

DB_ENGINE="${DB_ENGINE:-auto}"
DB_NAME="${DB_NAME:-argus_db}"
DB_USER="${DB_USER:-argus_user}"
DB_PASSWORD="${DB_PASSWORD:-argus_password}"

APP_IMAGE_TAG="${APP_IMAGE_TAG:-${PROJECT_NAME}:latest}"
NETWORK_NAME="${NETWORK_NAME:-${PROJECT_NAME}-net}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-${PROJECT_NAME}-db}"
APP_CONTAINER_NAME="${APP_CONTAINER_NAME:-${PROJECT_NAME}-app}"

# Runtime flags
DO_CLEAN=false
FORCED_DB_ENGINE=""
RUN_VERIFY=false

# -------- Helpers --------
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required tool not found: $1"
}

container_exists() {
  docker ps -a --format '{{.Names}}' | grep -Fxq "$1"
}

container_running() {
  docker ps --format '{{.Names}}' | grep -Fxq "$1"
}

load_env_file() {
  if [[ -f "$SCRIPT_DIR/.env" ]]; then
    log "Loading .env values"
    set -a
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.env"
    set +a
  else
    warn "No .env found at project root. Using defaults and runtime detection."
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --clean)
        DO_CLEAN=true
        shift
        ;;
      --db)
        [[ $# -lt 2 ]] && die "--db requires a value: postgres | mongo"
        FORCED_DB_ENGINE="$2"
        shift 2
        ;;
      --verify)
        RUN_VERIFY=true
        shift
        ;;
      -h|--help)
        sed -n '1,40p' "$0"
        exit 0
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done
}

wait_for_app() {
  log "Waiting for application readiness on port $APP_PORT"
  local retries=120
  local i
  for ((i=1; i<=retries; i++)); do
    if curl -fsS "http://localhost:${APP_PORT}/" >/dev/null 2>&1; then
      log "Application is ready"
      return 0
    fi

    # Fallback for slow startup on first run/migration-heavy boots.
    if [[ -f "$SCRIPT_DIR/logs/app.log" ]] && grep -q "Argus Server running at" "$SCRIPT_DIR/logs/app.log"; then
      log "Application startup confirmed via log output"
      return 0
    fi

    sleep 2
  done
  die "Application did not become ready in time."
}

run_verification_suite() {
  log "Starting verification suite"

  local ts
  ts="$(date +%Y%m%d_%H%M%S)"
  local report_dir="$SCRIPT_DIR/reports/verification_$ts"
  mkdir -p "$report_dir"

  local summary_file="$report_dir/summary.txt"
  local status_file="$report_dir/status.log"

  echo "Verification Report - $ts" > "$summary_file"
  echo "Project: $PROJECT_NAME" >> "$summary_file"
  echo "Backend: $BACKEND_TYPE" >> "$summary_file"
  echo "Database: $DB_ENGINE" >> "$summary_file"
  echo "App URL: http://localhost:${APP_PORT}" >> "$summary_file"
  echo "" >> "$summary_file"

  local total=0
  local passed=0

  run_step() {
    local step_name="$1"
    local out_file="$2"
    shift 2
    total=$((total + 1))

    log "[VERIFY] $step_name"

    set +e
    "$@" > "$out_file" 2>&1
    local rc=$?
    set -e

    if [[ $rc -eq 0 ]]; then
      passed=$((passed + 1))
      echo "PASS | $step_name | $out_file" | tee -a "$status_file" >> "$summary_file"
    else
      echo "FAIL | $step_name | $out_file" | tee -a "$status_file" >> "$summary_file"
    fi
  }

  run_step "API root" "$report_dir/api_root.txt" \
    curl -fsS "http://localhost:${APP_PORT}/"

  run_step "API business modules" "$report_dir/api_business_modules.json" \
    curl -fsS "http://localhost:${APP_PORT}/business-modules"

  run_step "API UI interactions" "$report_dir/api_ui_interactions.json" \
    curl -fsS "http://localhost:${APP_PORT}/ui-interactions"

  run_step "API versions" "$report_dir/api_versions.json" \
    curl -fsS "http://localhost:${APP_PORT}/versions"

  run_step "API recent logs" "$report_dir/api_logs.json" \
    curl -fsS "http://localhost:${APP_PORT}/logs?limit=20"

  if [[ "$BACKEND_TYPE" == "node" ]]; then
    pushd "$BACKEND_DIR" >/dev/null

    if [[ -f "tests/run-tests.js" ]]; then
      run_step "Node test suite" "$report_dir/npm_test.txt" npm test
    fi

    if [[ -f "CLI.js" ]]; then
      local dep_id="DEP-VERIFY-$ts"

      run_step "CLI show-interactions" "$report_dir/cli_show_interactions.txt" \
        node CLI.js show-interactions

      run_step "CLI health-check" "$report_dir/cli_health_check.txt" \
        node CLI.js health-check "$dep_id" https://jsonplaceholder.typicode.com/posts/1

      run_step "CLI deploy-app" "$report_dir/cli_deploy_app.txt" \
        node CLI.js deploy-app --image=nginx:latest --deploymentId="$dep_id" --url=https://jsonplaceholder.typicode.com/posts/1

      run_step "CLI list-versions" "$report_dir/cli_list_versions.txt" \
        node CLI.js list-versions

      run_step "CLI rollback" "$report_dir/cli_rollback.txt" \
        node CLI.js rollback --version=latest --image=nginx --deploymentId="$dep_id"

      run_step "CLI show-logs" "$report_dir/cli_show_logs.txt" \
        node CLI.js show-logs
    fi

    popd >/dev/null
  fi

  echo "" >> "$summary_file"
  echo "Result: $passed / $total steps passed" >> "$summary_file"
  log "Verification complete: $passed/$total passed"
  log "Verification artifacts saved in: $report_dir"
}

detect_db_engine() {
  if [[ -n "$FORCED_DB_ENGINE" ]]; then
    DB_ENGINE="$FORCED_DB_ENGINE"
  fi

  if [[ "$DB_ENGINE" == "auto" ]]; then
    # Prefer postgres generally, but switch to mongo when project clearly uses Mongo.
    if grep -Rqs "MONGO_URI\|mongodb" "$SCRIPT_DIR/argus-src" "$SCRIPT_DIR" 2>/dev/null; then
      DB_ENGINE="mongo"
    else
      DB_ENGINE="postgres"
    fi
  fi

  case "$DB_ENGINE" in
    postgres|mongo) ;;
    *) die "Invalid DB engine: $DB_ENGINE (allowed: postgres | mongo | auto)" ;;
  esac

  log "Database engine: $DB_ENGINE"
}

detect_backend() {
  BACKEND_TYPE=""
  BACKEND_DIR="$SCRIPT_DIR"

  # Node backend (prefer argus-src if present)
  if [[ -f "$SCRIPT_DIR/argus-src/package.json" ]]; then
    BACKEND_TYPE="node"
    BACKEND_DIR="$SCRIPT_DIR/argus-src"
  elif [[ -f "$SCRIPT_DIR/package.json" ]]; then
    BACKEND_TYPE="node"
    BACKEND_DIR="$SCRIPT_DIR"
  elif [[ -f "$SCRIPT_DIR/server.py" ]]; then
    BACKEND_TYPE="python"
    BACKEND_DIR="$SCRIPT_DIR"
  fi

  [[ -z "$BACKEND_TYPE" ]] && die "Could not detect backend runtime (Node/Python)."

  log "Backend detected: $BACKEND_TYPE ($BACKEND_DIR)"
}

ensure_prereqs() {
  require_cmd docker
  if ! docker info >/dev/null 2>&1; then
    die "Docker daemon is not running. Start Docker Desktop/Engine and re-run."
  fi

  if [[ ! -f "$SCRIPT_DIR/Dockerfile" ]]; then
    warn "No Dockerfile found at project root. App will be started locally after DB container setup."
  else
    log "Dockerfile detected at project root. App will run in Docker."
  fi

  if [[ "$BACKEND_TYPE" == "node" ]]; then
    require_cmd npm
  fi

  if [[ "$BACKEND_TYPE" == "python" ]]; then
    require_cmd python3 || require_cmd python
    require_cmd pip3 || require_cmd pip
  fi
}

ensure_network() {
  if docker network ls --format '{{.Name}}' | grep -Fxq "$NETWORK_NAME"; then
    log "Docker network exists: $NETWORK_NAME"
  else
    log "Creating Docker network: $NETWORK_NAME"
    docker network create "$NETWORK_NAME" >/dev/null
  fi
}

clean_resources() {
  log "Running cleanup"

  if container_exists "$APP_CONTAINER_NAME"; then
    log "Removing app container: $APP_CONTAINER_NAME"
    docker rm -f "$APP_CONTAINER_NAME" >/dev/null || true
  fi

  if container_exists "$DB_CONTAINER_NAME"; then
    log "Removing DB container: $DB_CONTAINER_NAME"
    docker rm -f "$DB_CONTAINER_NAME" >/dev/null || true
  fi

  if docker image inspect "$APP_IMAGE_TAG" >/dev/null 2>&1; then
    log "Removing app image: $APP_IMAGE_TAG"
    docker rmi -f "$APP_IMAGE_TAG" >/dev/null || true
  fi

  if docker network ls --format '{{.Name}}' | grep -Fxq "$NETWORK_NAME"; then
    log "Removing Docker network: $NETWORK_NAME"
    docker network rm "$NETWORK_NAME" >/dev/null || true
  fi

  rm -f "$SCRIPT_DIR/.app.pid"
  rm -rf "$SCRIPT_DIR/logs"

  log "Cleanup done"
}

start_database() {
  if container_exists "$DB_CONTAINER_NAME"; then
    log "Replacing existing DB container: $DB_CONTAINER_NAME"
    docker rm -f "$DB_CONTAINER_NAME" >/dev/null || true
  fi

  if [[ "$DB_ENGINE" == "postgres" ]]; then
    log "Starting PostgreSQL container"
    docker run -d \
      --name "$DB_CONTAINER_NAME" \
      --network "$NETWORK_NAME" \
      -p "${POSTGRES_PORT}:5432" \
      -e POSTGRES_DB="$DB_NAME" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      postgres:16-alpine >/dev/null
  else
    log "Starting MongoDB container"
    docker run -d \
      --name "$DB_CONTAINER_NAME" \
      --network "$NETWORK_NAME" \
      -p "${MONGO_PORT}:27017" \
      -e MONGO_INITDB_DATABASE="$DB_NAME" \
      mongo:7 >/dev/null
  fi
}

wait_for_database() {
  log "Waiting for DB readiness"

  local retries=60
  local i
  for ((i=1; i<=retries; i++)); do
    if [[ "$DB_ENGINE" == "postgres" ]]; then
      if docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log "PostgreSQL is ready"
        return 0
      fi
    else
      if docker exec "$DB_CONTAINER_NAME" mongosh --quiet --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1; then
        log "MongoDB is ready"
        return 0
      fi
    fi
    sleep 2
  done

  die "Database did not become ready in time."
}

init_database() {
  if [[ "$DB_ENGINE" == "postgres" ]]; then
    local schema_file=""
    for f in \
      "$SCRIPT_DIR/schema.sql" \
      "$SCRIPT_DIR/init.sql" \
      "$SCRIPT_DIR/db/schema.sql" \
      "$SCRIPT_DIR/db/init.sql" \
      "$SCRIPT_DIR/migrations/schema.sql"; do
      if [[ -f "$f" ]]; then
        schema_file="$f"
        break
      fi
    done

    if [[ -n "$schema_file" ]]; then
      log "Applying PostgreSQL schema: $schema_file"
      docker exec -i "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$schema_file"
    else
      log "No PostgreSQL schema file found. Skipping schema init."
    fi
  else
    local mongo_init=""
    for f in \
      "$SCRIPT_DIR/mongo-init.js" \
      "$SCRIPT_DIR/db/mongo-init.js" \
      "$SCRIPT_DIR/migrations/mongo-init.js"; do
      if [[ -f "$f" ]]; then
        mongo_init="$f"
        break
      fi
    done

    if [[ -n "$mongo_init" ]]; then
      log "Applying Mongo init script: $mongo_init"
      docker exec -i "$DB_CONTAINER_NAME" mongosh "$DB_NAME" < "$mongo_init"
    else
      log "No Mongo init script found. Skipping explicit schema init."
    fi
  fi
}

build_app_image_if_possible() {
  if [[ ! -f "$SCRIPT_DIR/Dockerfile" ]]; then
    return 0
  fi

  if container_exists "$APP_CONTAINER_NAME"; then
    log "Removing existing app container"
    docker rm -f "$APP_CONTAINER_NAME" >/dev/null || true
  fi

  log "Building app image: $APP_IMAGE_TAG"
  docker build -t "$APP_IMAGE_TAG" "$SCRIPT_DIR"
}

run_app_in_docker() {
  [[ -f "$SCRIPT_DIR/Dockerfile" ]] || return 1

  local env_args=()
  if [[ "$DB_ENGINE" == "postgres" ]]; then
    local database_url="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_CONTAINER_NAME}:5432/${DB_NAME}"
    env_args+=( -e DATABASE_URL="$database_url" )
    env_args+=( -e DB_NAME="$DB_NAME" -e DB_USER="$DB_USER" -e DB_PASSWORD="$DB_PASSWORD" )
  else
    local mongo_uri="mongodb://${DB_CONTAINER_NAME}:27017"
    env_args+=( -e MONGO_URI="$mongo_uri" -e DB_NAME="$DB_NAME" )
  fi

  log "Starting app container: $APP_CONTAINER_NAME"
  docker run -d \
    --name "$APP_CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    -p "${APP_PORT}:${APP_CONTAINER_PORT}" \
    "${env_args[@]}" \
    "$APP_IMAGE_TAG" >/dev/null

  log "App started in Docker on port $APP_PORT"
  return 0
}

start_app_locally() {
  log "Starting app locally (fallback mode)"

  mkdir -p "$SCRIPT_DIR/logs"

  if [[ "$BACKEND_TYPE" == "node" ]]; then
    pushd "$BACKEND_DIR" >/dev/null

    if [[ -f package-lock.json ]]; then
      log "Installing Node dependencies with npm ci"
      npm ci
    else
      log "Installing Node dependencies with npm install"
      npm install
    fi

    local mongo_uri="mongodb://localhost:${MONGO_PORT}"
    local database_url="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${POSTGRES_PORT}/${DB_NAME}"

    log "Launching Node server"
    if [[ "$DB_ENGINE" == "mongo" ]]; then
      MONGO_URI="$mongo_uri" DB_NAME="$DB_NAME" nohup npm start > "$SCRIPT_DIR/logs/app.log" 2>&1 &
    else
      DATABASE_URL="$database_url" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" nohup npm start > "$SCRIPT_DIR/logs/app.log" 2>&1 &
    fi

    echo $! > "$SCRIPT_DIR/.app.pid"
    popd >/dev/null
  else
    pushd "$BACKEND_DIR" >/dev/null

    local py_cmd="python3"
    command -v python3 >/dev/null 2>&1 || py_cmd="python"

    if [[ -f requirements.txt ]]; then
      log "Installing Python dependencies"
      "$py_cmd" -m pip install -r requirements.txt
    fi

    local server_py=""
    [[ -f server.py ]] && server_py="server.py"
    [[ -z "$server_py" && -f app.py ]] && server_py="app.py"
    [[ -z "$server_py" ]] && die "Could not find Python server entrypoint (server.py/app.py)."

    log "Launching Python server: $server_py"
    nohup "$py_cmd" "$server_py" > "$SCRIPT_DIR/logs/app.log" 2>&1 &
    echo $! > "$SCRIPT_DIR/.app.pid"

    popd >/dev/null
  fi

  log "Local app started. PID: $(cat "$SCRIPT_DIR/.app.pid")"
  log "Log file: $SCRIPT_DIR/logs/app.log"
}

show_summary() {
  log "-----------------------------------------------"
  log "Setup complete"
  log "Project      : $PROJECT_NAME"
  log "DB engine    : $DB_ENGINE"
  log "DB container : $DB_CONTAINER_NAME"
  if [[ -f "$SCRIPT_DIR/Dockerfile" ]]; then
    log "App mode     : Docker container ($APP_CONTAINER_NAME)"
  else
    log "App mode     : Local process"
  fi
  log "App URL      : http://localhost:${APP_PORT}"
  if [[ "$DB_ENGINE" == "postgres" ]]; then
    log "Postgres     : localhost:${POSTGRES_PORT} (db=$DB_NAME user=$DB_USER)"
  else
    log "MongoDB      : localhost:${MONGO_PORT} (db=$DB_NAME)"
  fi
  log "-----------------------------------------------"
}

main() {
  parse_args "$@"
  load_env_file
  detect_backend
  detect_db_engine
  ensure_prereqs

  if [[ "$DO_CLEAN" == true ]]; then
    clean_resources
  fi

  ensure_network
  start_database
  wait_for_database
  init_database

  build_app_image_if_possible

  if [[ -f "$SCRIPT_DIR/Dockerfile" ]]; then
    run_app_in_docker || die "Failed to start app in Docker."
  else
    start_app_locally
  fi

  wait_for_app

  show_summary

  if [[ "$RUN_VERIFY" == true ]]; then
    run_verification_suite
  fi
}

main "$@"
