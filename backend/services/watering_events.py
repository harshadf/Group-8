from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from errors import APIError
from models.database import WateringEvent as DBWateringEvent
from models.pydantic.watering_event import WateringEventCreate
from services.plants import get_active_plant
from services.timestamp import current_timestamp


def get_last_watered(db: Session, plant_id: int) -> Optional[datetime]:
    event = (
        db.query(DBWateringEvent)
        .filter(DBWateringEvent.plant_id == plant_id)
        .order_by(DBWateringEvent.created_at.desc())
        .first()
    )
    return event.created_at if event else None


def get_list_of_watering_times(
    db: Session, plant_id: int, until: datetime
) -> List[datetime]:
    rows = (
        db.query(DBWateringEvent.created_at)
        .filter(
            DBWateringEvent.plant_id == plant_id, DBWateringEvent.created_at <= until
        )
        .order_by(DBWateringEvent.created_at)
        .all()
    )
    return [created_at for (created_at,) in rows]


def get_list_of_watering_events(
    db: Session, plant_id: int, start: datetime, end: datetime
) -> List[DBWateringEvent]:
    return (
        db.query(DBWateringEvent)
        .filter(
            DBWateringEvent.plant_id == plant_id,
            DBWateringEvent.created_at >= start,
            DBWateringEvent.created_at <= end,
        )
        .order_by(DBWateringEvent.created_at.desc(), DBWateringEvent.id.desc())
        .all()
    )


def create_watering_event(db: Session, data: WateringEventCreate) -> DBWateringEvent:
    plant = get_active_plant(db)
    if not plant:
        raise APIError(
            422, "no_active_plant", "A plant must be active to log a watering"
        )

    event = DBWateringEvent(
        plant_id=plant.id,
        created_at=current_timestamp(),
        source="web",
        **data.model_dump(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def delete_watering_event(db: Session, event_id: int):
    event = db.get(DBWateringEvent, event_id)
    if not event:
        raise APIError(404, "not_found", f"Watering event {event_id} does not exist")

    db.delete(event)
    db.commit()
