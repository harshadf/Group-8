from pydantic import BaseModel
from typing import Optional, List

from models.pydantic.common import UTCDatetime


class PlantCreate(BaseModel):
    plant_type: str


class PlantResponse(BaseModel):
    id: int
    plant_type: str
    started_at: UTCDatetime
    ended_at: Optional[UTCDatetime]
    active: bool


class PlantsResponse(BaseModel):
    plants: List[PlantResponse]
