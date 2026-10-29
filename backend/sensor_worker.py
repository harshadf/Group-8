import sqlite3
import time
import logging
import argparse

from datetime import datetime, timezone

#When using the emulator use
#from sense_emu import SenseHat

from sense_hat import SenseHat

SAVE_READINGS_INTERVAL_SECONDS = 30

TEMPERATURE_OFFSET = 0
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


def read_and_save_sensor_data(
    temperature_offset: float, humidity_offset: float, pressure_offset: float
) -> None:
    raw_temperature = sense.get_temperature()
    temperature = raw_temperature + temperature_offset

    raw_humidity = sense.get_humidity()
    humidity = raw_humidity + humidity_offset

    raw_pressure = sense.get_pressure()
    pressure = raw_pressure + pressure_offset

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
        help="Interval between readings in seconds (default: %(default)s)",
    )

    parser.add_argument(
        "--temperature-offset",
        type=float,
        default=TEMPERATURE_OFFSET,
        help="Offset added to the temperature reading (default: %(default)s)",
    )

    parser.add_argument(
        "--humidity-offset",
        type=float,
        default=HUMIDITY_OFFSET,
        help="Offset added to the humidity reading (default: %(default)s)",
    )

    parser.add_argument(
        "--pressure-offset",
        type=float,
        default=PRESSURE_OFFSET,
        help="Offset added to the pressure reading (default: %(default)s)",
    )

    args = parser.parse_args()
    reading_interval_seconds = args.reading_interval_seconds

    if reading_interval_seconds <= 0:
        parser.error("--reading-interval-seconds must be greater than 0")

    logger.info(
        "Sensor recording worker started (interval=%s seconds, "
        "temperature_offset=%s, humidity_offset=%s, pressure_offset=%s)",
        reading_interval_seconds,
        args.temperature_offset,
        args.humidity_offset,
        args.pressure_offset,
    )

    while True:
        start_time = time.monotonic()

        try:
            read_and_save_sensor_data(
                temperature_offset=args.temperature_offset,
                humidity_offset=args.humidity_offset,
                pressure_offset=args.pressure_offset,
            )
        except Exception:
            logger.exception("Failed to read sensors or save readings")

        time_elapsed = time.monotonic() - start_time
        time.sleep(max(0, reading_interval_seconds - time_elapsed))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Sensor recording worker stopped")
