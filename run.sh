#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}"
API_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"
LOG_DIR="${ROOT_DIR}/logs"

export VITE_API_URL="${VITE_API_URL:-$API_URL}"
export QA_FRONTEND_URL="${QA_FRONTEND_URL:-$FRONTEND_URL}"
export QA_API_URL="${QA_API_URL:-$API_URL}"
export QA_HEADLESS="${QA_HEADLESS:-0}"
export QA_PAUSE_MS="${QA_PAUSE_MS:-4000}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$ROOT_DIR/.cache/ms-playwright}"

mkdir -p "$LOG_DIR" "$ROOT_DIR/qa/artifacts" "$ROOT_DIR/qa/.profiles"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "$frontend_pid" ]]; then
    kill "$frontend_pid" >/dev/null 2>&1 || true
  fi
  if [[ -n "$backend_pid" ]]; then
    kill "$backend_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "✓ $label is ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "✗ Timed out waiting for $label at $url" >&2
  return 1
}

echo "== GetMyBee multi-agent QA =="
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $API_URL"

if [[ ! -d node_modules/@playwright/test ]]; then
  echo "== Installing JS dependencies =="
  bun install
fi

echo "== Installing Playwright Chromium =="
bunx playwright install chromium

if [[ "${QA_APPLY_MIGRATIONS:-1}" == "1" ]]; then
  echo "== Applying InsForge migrations =="
  npx @insforge/cli db migrations up --all
fi

if ! curl -fsS "${API_URL}/health" >/dev/null 2>&1; then
  if [[ ! -x backend/.venv/bin/uvicorn ]]; then
    echo "backend/.venv/bin/uvicorn is missing. Create the backend venv first:"
    echo "  cd backend && uv venv --python 3.12 .venv && uv pip install -r requirements.txt"
    exit 1
  fi
  echo "== Starting FastAPI backend =="
  (
    cd backend
    ./.venv/bin/uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
  ) >"$LOG_DIR/backend-qa.log" 2>&1 &
  backend_pid="$!"
fi
wait_for_url "${API_URL}/health" "backend"

if ! curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
  echo "== Starting Vite frontend =="
  VITE_API_URL="$VITE_API_URL" bun run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" \
    >"$LOG_DIR/frontend-qa.log" 2>&1 &
  frontend_pid="$!"
fi
wait_for_url "$FRONTEND_URL" "frontend"

if [[ "$QA_HEADLESS" == "1" ]]; then
  qa_mode="headless"
else
  qa_mode="headed"
fi
echo "== Running ${qa_mode} Chromium QA =="
echo "Tip: set QA_HEADLESS=1 for headless mode, QA_PAUSE_MS=0 to close immediately."
bunx playwright test qa/multi-agent-network.spec.ts --project=chromium "$@"
