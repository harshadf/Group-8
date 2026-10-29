#!/bin/bash

set -m

sense_emu_gui &
EMU_PID=$!

sleep 2

(cd backend && exec python3 sensor_worker.py) &
WORKER_PID=$!

(cd backend && exec python3 -m uvicorn main:app --reload) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
    trap - INT TERM EXIT

    kill "$EMU_PID" "$WORKER_PID" "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null

    pkill -TERM -P "$FRONTEND_PID" 2>/dev/null

    wait 2>/dev/null
}

trap cleanup INT TERM EXIT

wait
