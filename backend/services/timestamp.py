from datetime import datetime, timedelta, timezone
from typing import Optional
from errors import APIError


def current_timestamp() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def validate_timestamp(timestamp: datetime, name: str) -> datetime:
    if timestamp.tzinfo is None:
        raise APIError(
            400,
            "invalid_parameter",
            f"'{name}' must include a timezone, e.g. 'Z' or '+02:00'",
        )

    return timestamp.astimezone(timezone.utc).replace(tzinfo=None)


def validate_timestamp_interval(
    from_: Optional[datetime],
    to: Optional[datetime],
    default_from_length: timedelta = timedelta(days=1),
    max_none_aggregate_range: timedelta = timedelta(days=7),
    aggregate: Optional[str] = None,
) -> tuple[datetime, datetime]:

    end_timestamp = validate_timestamp(to, "to") if to else current_timestamp()
    start_timestamp = (
        validate_timestamp(from_, "from")
        if from_
        else end_timestamp - default_from_length
    )

    if start_timestamp > end_timestamp:
        raise APIError(400, "invalid_parameter", "'from' must be before 'to'")
    if (
        aggregate == "none"
        and end_timestamp - start_timestamp > max_none_aggregate_range
    ):
        raise APIError(
            400,
            "invalid_parameter",
            "Ranges longer than 7 days require 'aggregate' to be 'hour', 'day', 'week' or 'month'",
        )
    return start_timestamp, end_timestamp
