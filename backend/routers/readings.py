from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.pydantic.common import Aggregate
from models.pydantic.reading import ReadingsResponse
from services.readings import get_list_of_readings, aggregate_readings
from services.timestamp import validate_timestamp_interval

router = APIRouter()


@router.get("/readings", response_model=ReadingsResponse)
def get_readings(
    from_: Optional[datetime] = Query(default=None, alias="from"),
    to: Optional[datetime] = None,
    aggregate: Aggregate = "none",
    db: Session = Depends(get_db),
):
    start, end = validate_timestamp_interval(from_, to, aggregate=aggregate)
    readings = aggregate_readings(get_list_of_readings(db, start, end), aggregate)

    return ReadingsResponse(from_=start, to=end, aggregate=aggregate, readings=readings)
