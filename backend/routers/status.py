from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.pydantic.common import Aggregate
from models.pydantic.status import StatusResponse, StatusesResponse
from services.plants import get_plant_by_id, get_active_plant
from services.status import get_current_status, get_status_history
from services.timestamp import validate_timestamp_interval

router = APIRouter()


@router.get("/status", response_model=StatusResponse)
def get_status(db: Session = Depends(get_db)):
    return get_current_status(db)


@router.get("/statuses", response_model=StatusesResponse)
def get_statuses(
    plant_id: Optional[int] = None,
    from_: Optional[datetime] = Query(default=None, alias="from"),
    to: Optional[datetime] = None,
    aggregate: Aggregate = "none",
    db: Session = Depends(get_db),
):
    start, end = validate_timestamp_interval(
        from_, to, timedelta(hours=24), timedelta(days=7), aggregate
    )
    plant = get_plant_by_id(db, plant_id) if plant_id else get_active_plant(db)
    statuses = get_status_history(db, plant, start, end, aggregate) if plant else []

    return StatusesResponse(
        plant_id=plant.id if plant else None,
        from_=start,
        to=end,
        aggregate=aggregate,
        statuses=statuses,
    )
