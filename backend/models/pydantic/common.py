from pydantic import BaseModel, AfterValidator
from typing import Annotated, Literal
from datetime import datetime, timezone


def date_to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).replace(microsecond=0)


UTCDatetime = Annotated[datetime, AfterValidator(date_to_utc)]

Aggregate = Literal["none", "hour", "day", "week", "month"]


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
