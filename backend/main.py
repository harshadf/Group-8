from datetime import datetime, timezone

from fastapi import FastAPI

from errors import register_error_handlers
from routers import status, readings, plants, settings, watering_events, health

app = FastAPI(title="Plant monitor")

register_error_handlers(app)

for module in (status, readings, plants, settings, watering_events, health):
    app.include_router(module.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": datetime.now(timezone.utc).isoformat()}
