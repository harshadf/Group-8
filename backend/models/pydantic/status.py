from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal, List

from models.pydantic.common import UTCDatetime, Aggregate
from models.pydantic.reading import Reading


class Conditions(BaseModel):
    temperature: Literal["low", "ok", "high", "unknown"]
    humidity: Literal["low", "ok", "high", "unknown"]


class Watering(BaseModel):
    state: Literal["ok", "due_soon", "due", "unknown"]
    last_watered: Optional[UTCDatetime]
    hours_since_watered: Optional[float]


class StatusResponse(BaseModel):
    timestamp: Optional[UTCDatetime]
    plant_id: Optional[int]
    reading: Reading
    conditions: Conditions
    watering: Watering


class Status(BaseModel):
    timestamp: UTCDatetime
    reading: Reading
    conditions: Conditions
    watering: Watering


class StatusesResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    plant_id: Optional[int]
    from_: UTCDatetime = Field(alias="from")
    to: UTCDatetime
    aggregate: Aggregate
    statuses: List[Status]
