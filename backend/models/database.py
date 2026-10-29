from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class PlantType(Base):
    __tablename__ = "plant_types"
    __table_args__ = {"sqlite_autoincrement": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    watering_interval_hours = Column(Float, nullable=False)
    due_soon_hours = Column(Float, nullable=False)
    min_temperature = Column(Float)
    max_temperature = Column(Float)
    min_humidity = Column(Float)
    max_humidity = Column(Float)


class Plant(Base):
    __tablename__ = "plants"
    __table_args__ = {"sqlite_autoincrement": True}

    id = Column(Integer, primary_key=True, index=True)
    plant_type_id = Column(Integer, ForeignKey("plant_types.id"), nullable=False)
    nickname = Column(String)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime)

    plant_type = relationship("PlantType")
    watering_events = relationship("WateringEvent", cascade="all, delete-orphan")


class Reading(Base):
    __tablename__ = "readings"
    __table_args__ = {"sqlite_autoincrement": True}

    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    pressure = Column(Float)
    created_at = Column(DateTime, nullable=False, index=True)


class WateringEvent(Base):
    __tablename__ = "watering_events"
    __table_args__ = {"sqlite_autoincrement": True}

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)
    source = Column(String, nullable=False)
    amount_ml = Column(Integer)
    soil_condition = Column(String)
    note = Column(String)
