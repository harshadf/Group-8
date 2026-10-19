import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException

mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from errors import register_error_handlers
from routers import status, readings, plants, settings, watering_events, health

app = FastAPI(title="Plant monitor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

for module in (status, readings, plants, settings, watering_events, health):
    app.include_router(module.router, prefix="/api")

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
ASSETS = DIST / "assets"
if ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS), name="assets")


@app.get("/")
def read_root():
    index = DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"message": datetime.now(timezone.utc).isoformat()}


@app.get("/{full_path:path}")
def serve_frontend_file(full_path: str):
    target = (DIST / full_path).resolve()
    if DIST.exists() and target.is_file() and DIST.resolve() in target.parents:
        return FileResponse(target)
    raise HTTPException(status_code=404, detail="Not found")
