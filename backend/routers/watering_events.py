from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from database import get_db
from models.pydantic.watering_event import (
    WateringEventCreate,
    WateringEventResponse,
    WateringEventsResponse,
)
from services import watering_events as watering_service
from services.plants import get_plant_by_id, get_active_plant
from services.timestamp import validate_timestamp_interval

router = APIRouter()


@router.get("/watering-events", response_model=WateringEventsResponse)
def get_watering_events(
    plant_id: Optional[int] = None,
    from_: Optional[datetime] = Query(default=None, alias="from"),
    to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    start, end = validate_timestamp_interval(from_, to, timedelta(days=30))
    plant = get_plant_by_id(db, plant_id) if plant_id else get_active_plant(db)
    events = (
        watering_service.get_list_of_watering_events(db, plant.id, start, end)
        if plant
        else []
    )

    return WateringEventsResponse(
        events=[WateringEventResponse.model_validate(event) for event in events]
    )


@router.post("/watering-events", response_model=WateringEventResponse, status_code=201)
def create_watering_event(
    event: Optional[WateringEventCreate] = None, db: Session = Depends(get_db)
):
    new_event = watering_service.create_watering_event(
        db, event or WateringEventCreate()
    )
    return WateringEventResponse.model_validate(new_event)


@router.delete("/watering-events/{event_id}", status_code=204)
def delete_watering_event(event_id: int, db: Session = Depends(get_db)):
    watering_service.delete_watering_event(db, event_id)
    return Response(status_code=204)
