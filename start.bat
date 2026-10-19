@echo off
cd /d "%~dp0backend"

where py >nul 2>nul
if errorlevel 1 (
  python -m pip install -r requirements.txt
  if not exist plant_monitor.db python seed.py
  echo.
  echo Happy Plants is starting. Open http://127.0.0.1:8000 in your browser.
  echo.
  python -m uvicorn main:app --host 127.0.0.1 --port 8000
) else (
  py -3.11 -m pip install -r requirements.txt
  if not exist plant_monitor.db py -3.11 seed.py
  echo.
  echo Happy Plants is starting. Open http://127.0.0.1:8000 in your browser.
  echo.
  py -3.11 -m uvicorn main:app --host 127.0.0.1 --port 8000
)
