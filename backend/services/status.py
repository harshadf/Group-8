from bisect import bisect_right
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models.database import Plant as DBPlant
from models.database import PlantType as DBPlantType
from models.pydantic.common import Aggregate
from models.pydantic.reading import Reading
from models.pydantic.status import Conditions, Watering, Status, StatusResponse
from services.plants import get_active_plant
from services.readings import (
    get_latest_reading,
    get_list_of_readings,
    aggregate_readings,
    bucket_end,
)
from services.timestamp import current_timestamp
from services.watering_events import get_last_watered, get_list_of_watering_times


def get_condition(
    value: Optional[float], min_value: Optional[float], max_value: Optional[float]
) -> str:
    if value is None:
        return "unknown"
    if min_value is not None and value < min_value:
        return "low"
    if max_value is not None and value > max_value:
        return "high"
    return "ok"


def get_plant_conditions(
    reading: Reading, plant_type: Optional[DBPlantType]
) -> Conditions:
    if plant_type is None:
        return Conditions(temperature="unknown", humidity="unknown")

    return Conditions(
        temperature=get_condition(
            reading.temperature, plant_type.min_temperature, plant_type.max_temperature
        ),
        humidity=get_condition(
            reading.humidity, plant_type.min_humidity, plant_type.max_humidity
        ),
    )


def get_watering(
    last_watered: Optional[datetime],
    current_time: datetime,
    plant_type: Optional[DBPlantType],
) -> Watering:
    if last_watered is None or plant_type is None:
        return Watering(state="unknown", last_watered=None, hours_since_watered=None)

    hours_since_watered = (current_time - last_watered).total_seconds() / 3600

    if hours_since_watered >= plant_type.watering_interval_hours:
        state = "due"
    elif (
        hours_since_watered
        >= plant_type.watering_interval_hours - plant_type.due_soon_hours
    ):
        state = "due_soon"
    else:
        state = "ok"

    return Watering(
        state=state,
        last_watered=last_watered,
        hours_since_watered=round(hours_since_watered, 1),
    )


def get_current_status(db: Session) -> StatusResponse:
    db_reading = get_latest_reading(db)
    plant = get_active_plant(db)
    last_watered = get_last_watered(db, plant.id) if plant else None

    if db_reading:
        reading = Reading.model_validate(db_reading)
    else:
        reading = Reading(humidity=None, temperature=None, pressure=None)

    plant_type = plant.plant_type if plant else None

    return StatusResponse(
        timestamp=db_reading.created_at if db_reading else None,
        plant_id=plant.id if plant else None,
        reading=reading,
        conditions=get_plant_conditions(reading, plant_type),
        watering=get_watering(last_watered, current_timestamp(), plant_type),
    )


def get_status_history(
    db: Session, plant: DBPlant, start: datetime, end: datetime, aggregate: Aggregate
) -> List[Status]:
    readings = get_list_of_readings(
        db, max(start, plant.started_at), end, before=plant.ended_at
    )
    period_end = min(end, plant.ended_at or current_timestamp())
    watering_times = get_list_of_watering_times(db, plant.id, until=period_end)

    def last_watered_at(at: datetime) -> Optional[datetime]:
        index = bisect_right(watering_times, at)
        return watering_times[index - 1] if index > 0 else None

    statuses = []
    for row in aggregate_readings(readings, aggregate):
        timestamp = row.timestamp.replace(tzinfo=None)
        end_of_bucket = (
            timestamp
            if aggregate == "none"
            else min(bucket_end(timestamp, aggregate), period_end)
        )
        reading = Reading.model_validate(row)
        statuses.append(
            Status(
                timestamp=timestamp,
                reading=reading,
                conditions=get_plant_conditions(reading, plant.plant_type),
                watering=get_watering(
                    last_watered_at(end_of_bucket), end_of_bucket, plant.plant_type
                ),
            )
        )
    return statuses
