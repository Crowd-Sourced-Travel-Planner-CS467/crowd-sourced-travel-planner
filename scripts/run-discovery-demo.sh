#!/usr/bin/env bash
# Starts the Crowd-Sourced Travel Planner's database-backed discovery demo.
# Uses the existing backend/.env; never logs or uploads credentials.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_URL="http://127.0.0.1:3000"
FRONTEND_URL="http://127.0.0.1:5173"
backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "$frontend_pid" ]]; then kill "$frontend_pid" 2>/dev/null || true; fi
  if [[ -n "$backend_pid" ]]; then kill "$backend_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT
trap 'exit 0' INT TERM

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install Node.js 24 from https://nodejs.org/" >&2
  exit 1
fi
if ! node -e 'const [major,minor]=process.versions.node.split(".").map(Number);process.exit(major>22||(major===22&&minor>=12)?0:1)'; then
  echo "Node.js 22.12+ is required; Node.js 24 is recommended. Current: $(node -v)" >&2
  exit 1
fi
if [[ ! -f "$ROOT/backend/.env" ]]; then
  echo "Missing backend/.env. Copy your EXISTING Supabase configuration to backend/.env." >&2
  echo "Do not paste credentials into GitHub or the video recording." >&2
  exit 1
fi
if ! grep -q '^DATABASE_URL=' "$ROOT/backend/.env"; then
  echo "backend/.env has no DATABASE_URL line. Check your existing Supabase configuration." >&2
  exit 1
fi
for port in 3000 5173; do
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use. Stop the old server in its terminal (Ctrl+C), then retry." >&2
    exit 1
  fi
done

if [[ ! -d "$ROOT/backend/node_modules" ]]; then
  echo "Installing backend dependencies from package-lock.json..."
  (cd "$ROOT/backend" && npm ci --no-audit --no-fund)
fi
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies from package-lock.json..."
  (cd "$ROOT/frontend" && npm ci --no-audit --no-fund)
fi

echo "Starting backend on port 3000..."
(cd "$ROOT/backend" && exec env PORT=3000 node server.js) &
backend_pid=$!
backend_ready=0
for ((i=0;i<40;i++)); do
  if curl -fsS --max-time 2 "$BACKEND_URL/api/health" >/dev/null 2>&1; then
    backend_ready=1
    break
  fi
  if ! kill -0 "$backend_pid" 2>/dev/null; then break; fi
  sleep 0.5
done
if [[ "$backend_ready" -ne 1 ]]; then
  echo "Backend did not start. Check DATABASE_URL and terminal errors above." >&2
  exit 1
fi

echo "Checking live PostgreSQL/Supabase connection..."
if ! curl -fsS --max-time 15 "$BACKEND_URL/api/db-test" >/dev/null; then
  echo "Database connection check failed. Verify backend/.env and Supabase access." >&2
  exit 1
fi

echo "Starting frontend on port 5173..."
(cd "$ROOT/frontend" && exec ./node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort) &
frontend_pid=$!
frontend_ready=0
for ((i=0;i<40;i++)); do
  if curl -fsS --max-time 2 "$FRONTEND_URL/experiences" >/dev/null 2>&1; then
    frontend_ready=1
    break
  fi
  if ! kill -0 "$frontend_pid" 2>/dev/null; then break; fi
  sleep 0.5
done
if [[ "$frontend_ready" -ne 1 ]]; then
  echo "Frontend did not start. Check Vite errors above." >&2
  exit 1
fi

echo ""
echo "----- LIVE DISCOVERY DATA CHECK -----"
node "$ROOT/scripts/check-discovery-demo.mjs"
echo "-------------------------------------"
echo "Your feature: $FRONTEND_URL/experiences"
if [[ "${DEMO_NO_OPEN:-0}" != "1" ]] && command -v open >/dev/null 2>&1; then
  open "$FRONTEND_URL/experiences"
fi
echo "Keep this terminal open while recording; press Ctrl+C to stop both servers."

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done
echo "A demo server stopped unexpectedly; check output above." >&2
exit 1
