from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, Literal, List

from models.pydantic.common import UTCDatetime

SoilCondition = Literal["dry", "moist", "wet"]


class WateringEventCreate(BaseModel):
    amount_ml: Optional[int] = Field(default=None, ge=0)
    soil_condition: Optional[SoilCondition] = None
    note: Optional[str] = None


class WateringEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plant_id: int
    timestamp: UTCDatetime = Field(
        validation_alias=AliasChoices("timestamp", "created_at")
    )
    source: Literal["device", "web"]
    amount_ml: Optional[int]
    soil_condition: Optional[SoilCondition]
    note: Optional[str]


class WateringEventsResponse(BaseModel):
    events: List[WateringEventResponse]
