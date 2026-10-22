from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from database import get_db
from models.database import Plant as DBPlant
from models.pydantic.plant import PlantCreate, PlantResponse, PlantsResponse
from models.pydantic.plant_type import Ranges, PlantTypeResponse, PlantTypesResponse
from services import plants as plant_service

router = APIRouter()


def to_plant_response(plant: DBPlant) -> PlantResponse:
    return PlantResponse(
        id=plant.id,
        plant_type=plant.plant_type.name,
        nickname=plant.nickname or plant.plant_type.name,
        started_at=plant.started_at,
        ended_at=plant.ended_at,
        active=plant.ended_at is None,
    )


@router.get("/plant-types", response_model=PlantTypesResponse)
def get_plant_types(db: Session = Depends(get_db)):
    return PlantTypesResponse(
        plant_types=[
            PlantTypeResponse(
                name=plant_type.name,
                watering_interval_hours=plant_type.watering_interval_hours,
                due_soon_hours=plant_type.due_soon_hours,
                ranges=Ranges.create_from_plant_type(plant_type),
            )
            for plant_type in plant_service.get_list_of_plant_types(db)
        ]
    )


@router.get("/plants", response_model=PlantsResponse)
def get_plants(db: Session = Depends(get_db)):
    return PlantsResponse(
        plants=[
            to_plant_response(plant) for plant in plant_service.get_list_of_plants(db)
        ]
    )


@router.post("/plants", response_model=PlantResponse, status_code=201)
def create_plant(plant: PlantCreate, db: Session = Depends(get_db)):
    return to_plant_response(
        plant_service.create_plant(db, plant.plant_type, plant.nickname)
    )


@router.delete("/plants/{plant_id}", status_code=204)
def delete_plant(plant_id: int, db: Session = Depends(get_db)):
    plant_service.delete_plant(db=db, plant_id=plant_id)
    return Response(status_code=204)
