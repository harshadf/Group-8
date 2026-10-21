import sqlite3
import time
import logging
import argparse

from datetime import datetime, timezone
from sense_hat import SenseHat

SAVE_READINGS_INTERVAL_SECONDS = 30

TEMPERATURE_OFFSET = -20
HUMIDITY_OFFSET = 0
PRESSURE_OFFSET = 0

connection = sqlite3.connect("plant_monitor.db")
cursor = connection.cursor()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)

logger = logging.getLogger(__name__)

sense = SenseHat()


def save_readings_to_database(
    temperature: float, humidity: float, pressure: float, created_at: datetime
):

    data = [temperature, humidity, pressure, created_at.isoformat(sep=" ")]

    cursor.execute(
        "INSERT INTO readings (temperature, humidity, pressure, created_at) VALUES (?, ?, ?, ?)",
        data,
    )
    connection.commit()


def read_and_save_sensor_data() -> None:
    raw_temperature = sense.get_temperature()
    temperature = raw_temperature + TEMPERATURE_OFFSET

    raw_humidity = sense.get_humidity()
    humidity = raw_humidity + HUMIDITY_OFFSET

    raw_pressure = sense.get_pressure()
    pressure = raw_pressure + PRESSURE_OFFSET

    created_at = datetime.now(timezone.utc).replace(tzinfo=None)

    save_readings_to_database(
        temperature=temperature,
        humidity=humidity,
        pressure=pressure,
        created_at=created_at,
    )

    logger.info(
        "Saved reading: temperature=%.2f°C, humidity=%.2f%%, pressure=%.2f hPa, created_at=%s",
        temperature,
        humidity,
        pressure,
        created_at,
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--reading-interval-seconds",
        type=float,
        default=SAVE_READINGS_INTERVAL_SECONDS,
        help="Interval between readings in seconds (default: 30)",
    )

    args = parser.parse_args()
    reading_interval_seconds = args.reading_interval_seconds

    if reading_interval_seconds <= 0:
        parser.error("--reading-interval-seconds must be greater than 0")

    logger.info(
        "Sensor recording worker started (interval=%s seconds)",
        reading_interval_seconds,
    )

    while True:
        start_time = time.monotonic()

        try:
            read_and_save_sensor_data()
        except Exception:
            logger.exception("Failed to read sensors or save readings")

        time_elapsed = time.monotonic() - start_time
        time.sleep(max(0, SAVE_READINGS_INTERVAL_SECONDS - time_elapsed))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Sensor recording worker stopped")
