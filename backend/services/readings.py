from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from models.database import Reading as DBReading
from models.pydantic.reading import ReadingWithTimestamp


def get_latest_reading(db: Session) -> Optional[DBReading]:
    return (
        db.query(DBReading)
        .order_by(DBReading.created_at.desc(), DBReading.id.desc())
        .first()
    )


def get_list_of_readings(
    db: Session, start: datetime, end: datetime, before: Optional[datetime] = None
) -> List[DBReading]:
    query = db.query(DBReading).filter(
        DBReading.created_at >= start, DBReading.created_at <= end
    )
    if before is not None:
        query = query.filter(DBReading.created_at < before)
    return query.order_by(DBReading.created_at.desc(), DBReading.id.desc()).all()


def bucket_start(timestamp: datetime, aggregate: str) -> datetime:
    if aggregate == "hour":
        return timestamp.replace(minute=0, second=0, microsecond=0)

    day = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
    if aggregate == "day":
        return day
    if aggregate == "week":
        return day - timedelta(days=day.weekday())
    return day.replace(day=1)


def bucket_end(start: datetime, aggregate: str) -> datetime:
    if aggregate == "hour":
        return start + timedelta(hours=1)
    if aggregate == "day":
        return start + timedelta(days=1)
    if aggregate == "week":
        return start + timedelta(weeks=1)
    if start.month == 12:
        return start.replace(year=start.year + 1, month=1)
    return start.replace(month=start.month + 1)


def average(values: list) -> Optional[float]:
    values = [value for value in values if value is not None]
    if not values:
        return None
    return round(sum(values) / len(values), 2)


def aggregate_readings(
    readings: List[DBReading], aggregate: str
) -> List[ReadingWithTimestamp]:
    if aggregate == "none":
        return [ReadingWithTimestamp.model_validate(reading) for reading in readings]

    buckets = {}
    for reading in readings:
        buckets.setdefault(bucket_start(reading.created_at, aggregate), []).append(
            reading
        )

    result = []
    for start, bucket in buckets.items():
        result.append(
            ReadingWithTimestamp(
                timestamp=start,
                humidity=average([reading.humidity for reading in bucket]),
                temperature=average([reading.temperature for reading in bucket]),
                pressure=average([reading.pressure for reading in bucket]),
            )
        )
    return result
