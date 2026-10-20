import time
import logging
import requests

from datetime import datetime, timezone
from sense_hat import SenseHat

TEMPERATURE_OFFSET = -20
HUMIDITY_OFFSET = 0
PRESSURE_OFFSET = 0

SAVE_READINGS_INTERVAL_SECONDS = 30
API_URL = "http://172.20.10.9:8000/api/readings"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)

logger = logging.getLogger(__name__)

sense = SenseHat()


def read_sensor_data() -> dict:
    raw_temperature = sense.get_temperature()
    temperature = raw_temperature + TEMPERATURE_OFFSET

    raw_humidity = sense.get_humidity()
    humidity = raw_humidity + HUMIDITY_OFFSET

    raw_pressure = sense.get_pressure()
    pressure = raw_pressure + PRESSURE_OFFSET

    return {
        "temperature": temperature,
        "humidity": humidity,
        "pressure": pressure,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def send_reading_to_api(reading: dict) -> None:
    response = requests.post(
        API_URL,
        json=reading,
        timeout=5,
    )
    response.raise_for_status()

    logger.info(
        "Reading sent: temp=%.2f°C, humidity=%.2f%%, " "pressure=%.2f hPa",
        reading["temperature"],
        reading["humidity"],
        reading["pressure"],
    )


def main():
    logger.info("Sensor recording worker started")

    with requests.Session() as session:
        while True:
            start_time = time.monotonic()

            try:
                data = read_sensor_data()

                response = session.post(
                    API_URL,
                    json=data,
                    timeout=5,
                )
                response.raise_for_status()

                logger.info("Reading successfully sent to API")

            except requests.RequestException:
                logger.exception("Failed to send reading to API")

            except Exception:
                logger.exception("Failed to read sensors")

            elapsed = time.monotonic() - start_time
            time.sleep(max(0, SAVE_READINGS_INTERVAL_SECONDS - elapsed))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Sensor recording worker stopped")
