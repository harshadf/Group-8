from pydantic import BaseModel
from typing import Optional, Literal

from models.pydantic.common import UTCDatetime


class HealthResponse(BaseModel):
    backend: Literal["ok", "error", "unknown"]
    database: Literal["ok", "error", "unknown"]
    sensor: Literal["ok", "stale", "error", "unknown"]
    last_reading_at: Optional[UTCDatetime]
