#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi

  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

cd "${ROOT_DIR}"

VENV_PYTHON="${VENV_PYTHON:-${ROOT_DIR}/backend/.venv/bin/python}"
if [[ ! -x "${VENV_PYTHON}" ]]; then
  echo "Missing virtual environment Python at ${VENV_PYTHON}." >&2
  echo "Run 'make install' (or 'make venv && make install-backend-deps') first." >&2
  exit 1
fi

echo "Starting backend services..."
"${VENV_PYTHON}" backend/dev.py &
BACKEND_PID=$!

sleep 2

echo "Starting frontend..."
(cd "${ROOT_DIR}/frontend" && npm run dev) &
FRONTEND_PID=$!

echo
echo "SuperHero AI IDE is starting locally."
echo "Frontend PID: ${FRONTEND_PID}"
echo "Backend PID:  ${BACKEND_PID}"
echo "Frontend: http://localhost:3000"
echo "Gateway:  http://localhost:8000"
echo
echo "Press Ctrl+C to stop both processes."

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
