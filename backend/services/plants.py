from typing import List, Optional

from sqlalchemy.orm import Session

from errors import APIError
from models.database import Plant as DBPlant
from models.database import PlantType as DBPlantType

from services.timestamp import current_timestamp


def get_list_of_plant_types(db: Session) -> List[DBPlantType]:
    return db.query(DBPlantType).order_by(DBPlantType.name).all()


def get_list_of_plants(db: Session) -> List[DBPlant]:
    return (
        db.query(DBPlant).order_by(DBPlant.started_at.desc(), DBPlant.id.desc()).all()
    )


def get_active_plant(db: Session) -> Optional[DBPlant]:
    return db.query(DBPlant).filter(DBPlant.ended_at.is_(None)).first()


def get_plant_by_id(db: Session, plant_id: Optional[int]) -> Optional[DBPlant]:
    plant = db.get(DBPlant, plant_id)
    if not plant:
        raise APIError(404, "not_found", f"Plant {plant_id} does not exist")
    return plant


def create_plant(db: Session, plant_type_name: str) -> DBPlant:
    plant_type = (
        db.query(DBPlantType).filter(DBPlantType.name == plant_type_name).first()
    )
    if not plant_type:
        raise APIError(
            422, "invalid_plant_type", "'plant_type' must be a valid plant type"
        )

    current_time = current_timestamp()
    active_plant = get_active_plant(db)
    if active_plant:
        active_plant.ended_at = current_time

    plant = DBPlant(plant_type_id=plant_type.id, started_at=current_time)
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant
