from pydantic import BaseModel
from typing import Optional, List


class Range(BaseModel):
    min: Optional[float]
    max: Optional[float]


class Ranges(BaseModel):
    temperature: Range
    humidity: Range

    @staticmethod
    def create_from_plant_type(plant_type):
        return Ranges(
            temperature=Range(
                min=plant_type.min_temperature,
                max=plant_type.max_temperature,
            ),
            humidity=Range(
                min=plant_type.min_humidity,
                max=plant_type.max_humidity,
            ),
        )


class PlantTypeResponse(BaseModel):
    name: str
    watering_interval_hours: float
    due_soon_hours: float
    ranges: Ranges


class PlantTypesResponse(BaseModel):
    plant_types: List[PlantTypeResponse]
