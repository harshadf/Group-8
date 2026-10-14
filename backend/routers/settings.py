from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from errors import APIError
from models.pydantic.plant_type import Ranges
from models.pydantic.settings import SettingsResponse
from services import plants as plant_service

router = APIRouter()


@router.get("/settings", response_model=SettingsResponse)
def get_settings(plant_id: Optional[int] = None, db: Session = Depends(get_db)):
    plant = (
        plant_service.get_plant_by_id(db, plant_id)
        if plant_id
        else plant_service.get_active_plant(db)
    )
    if not plant:
        raise APIError(404, "no_active_plant", "No plant is active")

    plant_type = plant.plant_type
    return SettingsResponse(
        plant_id=plant.id,
        plant_type=plant_type.name,
        watering_interval_hours=plant_type.watering_interval_hours,
        due_soon_hours=plant_type.due_soon_hours,
        ranges=Ranges.create_from_plant_type(plant_type),
    )
