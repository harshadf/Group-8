import sqlite3
import time
import logging

from datetime import datetime, timezone

SAVE_READINGS_INTERVAL_SECONDS = 30

connection = sqlite3.connect("plant_monitor.db")
cursor = connection.cursor()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)

logger = logging.getLogger(__name__)


def save_readings_to_database(
    temperature: float, humidity: float, pressure: float, created_at: datetime
):

    data = [temperature, humidity, pressure, created_at]

    cursor.execute(
        "INSERT INTO readings (temperature, humidity, pressure, created_at) VALUES (?, ?, ?, ?)",
        data,
    )
    connection.commit()


def read_and_save_sensor_data() -> None:
    temperature = 0.0
    humidity = 0.0
    pressure = 0.0
    created_at = datetime.now(timezone.utc).replace(tzinfo=None)

    save_readings_to_database(
        temperature=temperature,
        humidity=humidity,
        pressure=pressure,
        created_at=created_at,
    )

    logger.info(
        "Saved reading: temp=%.2fÂ°C, humidity=%.2f%%, pressure=%.2f hPa, created_at=%s",
        temperature,
        humidity,
        pressure,
        created_at,
    )


def main():
    logger.info("Sensor recording worker started")

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