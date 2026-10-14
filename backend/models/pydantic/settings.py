from pydantic import BaseModel

from models.pydantic.plant_type import Ranges


class SettingsResponse(BaseModel):
    plant_id: int
    plant_type: str
    watering_interval_hours: float
    due_soon_hours: float
    ranges: Ranges
