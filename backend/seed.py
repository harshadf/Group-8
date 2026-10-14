import math
import random
from datetime import timedelta

from database import SessionLocal, engine
from models.database import Base, Plant, PlantType, Reading, WateringEvent
from services.timestamp import current_timestamp

READING_DAYS = 30
READING_INTERVAL_MINUTES = 10

# name, watering interval h, due soon h, temperature range, humidity range
PLANT_TYPES = [
    ("Basil", 72, 12, (18.0, 27.0), (40.0, 70.0)),
    ("Monstera", 168, 24, (18.0, 27.0), (50.0, 80.0)),
    ("Snake Plant", 336, 48, (15.0, 30.0), (20.0, 60.0)),
]

# Plant history, oldest first. Only the last one is active.
# Plant name, nickname, amount of days ago it was added
PLANTS = [
    ("Basil", "Pesto", 30),
    ("Monstera", "Cool plant", 21),
    ("Snake Plant", "My favorite plant", 9),
]

NOTES = [
    None,
    None,
    None,
    "Leaves looked a bit withered",
    "I added some fertilizer",
    "I rotated the pot",
    "Soil was already moist",
    "Watered too much",
]


def seed_plant_types(db):
    plant_types = {}
    for name, interval, due_soon, temp, humidity in PLANT_TYPES:
        plant_type = PlantType(
            name=name,
            watering_interval_hours=interval,
            due_soon_hours=due_soon,
            min_temperature=temp[0],
            max_temperature=temp[1],
            min_humidity=humidity[0],
            max_humidity=humidity[1],
        )
        db.add(plant_type)
        plant_types[name] = plant_type
    db.flush()
    return plant_types


def seed_plants(db, plant_types, now):
    plants = []
    for index, (type_name, nickname, days_ago) in enumerate(PLANTS):
        is_last = index == len(PLANTS) - 1
        ended_at = None if is_last else now - timedelta(days=PLANTS[index + 1][2])
        plant = Plant(
            plant_type=plant_types[type_name],
            nickname=nickname,
            started_at=now - timedelta(days=days_ago),
            ended_at=ended_at,
        )
        db.add(plant)
        plants.append(plant)
    db.flush()
    return plants


def seed_readings(db, now):
    start = now - timedelta(days=READING_DAYS)
    step = timedelta(minutes=READING_INTERVAL_MINUTES)
    readings = []
    timestamp = start
    pressure = 1013.0
    while timestamp <= now:
        hour = timestamp.hour + timestamp.minute / 60
        day_cycle = math.cos((hour - 14) / 24 * 2 * math.pi)

        pressure = min(1035.0, max(990.0, pressure + random.gauss(0, 0.3)))
        readings.append(
            Reading(
                temperature=round(21.5 + 2.5 * day_cycle + random.gauss(0, 0.3), 1),
                humidity=round(55 - 8 * day_cycle + random.gauss(0, 1.5), 1),
                pressure=round(pressure, 1),
                created_at=timestamp,
            )
        )
        timestamp += step
    db.add_all(readings)
    return len(readings)


def seed_watering_events(db, plants, now):
    count = 0
    for plant in plants:
        interval = plant.plant_type.watering_interval_hours
        end = plant.ended_at or now
        timestamp = plant.started_at + timedelta(hours=random.uniform(1, 6))
        while timestamp < end:
            hours_since_due = random.gauss(0, interval * 0.15)
            soil_condition = random.choice(
                ["dry"] if hours_since_due > 0 else ["moist", "moist", "wet", None]
            )
            db.add(
                WateringEvent(
                    plant_id=plant.id,
                    created_at=timestamp,
                    source=random.choice(["device", "device", "web"]),
                    amount_ml=random.choice([None, 150, 200, 250, 300]),
                    soil_condition=soil_condition,
                    note=random.choice(NOTES),
                )
            )
            count += 1
            timestamp += timedelta(hours=interval + hours_since_due)
    return count


def main():
    random.seed(42)
    now = current_timestamp()

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    db = SessionLocal()
    try:
        plant_types = seed_plant_types(db)
        plants = seed_plants(db, plant_types, now)
        reading_count = seed_readings(db, now)
        event_count = seed_watering_events(db, plants, now)
        db.commit()
    finally:
        db.close()

    print(
        f"Seeded {len(plant_types)} plant types, {len(plants)} plants, "
        f"{reading_count} readings and {event_count} watering events"
    )


if __name__ == "__main__":
    main()
