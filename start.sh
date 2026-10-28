#!/bin/bash

sense_emu_gui &
EMU_PID=$!

sleep 2

(cd backend && python3 sensor_worker.py) &
WORKER_PID=$!

(cd backend && python3 -m uvicorn main:app --reload) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $EMU_PID $WORKER_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait