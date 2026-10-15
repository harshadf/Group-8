from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import Optional, List

from models.pydantic.common import UTCDatetime, Aggregate


class Reading(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    humidity: Optional[float]
    temperature: Optional[float]
    pressure: Optional[float]


class ReadingWithTimestamp(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: UTCDatetime = Field(
        validation_alias=AliasChoices("timestamp", "created_at")
    )
    humidity: Optional[float]
    temperature: Optional[float]
    pressure: Optional[float]


class ReadingsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: UTCDatetime = Field(alias="from")
    to: UTCDatetime
    aggregate: Aggregate
    readings: List[ReadingWithTimestamp]
