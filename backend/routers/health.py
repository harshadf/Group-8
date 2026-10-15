from fastapi import APIRouter
from models.pydantic.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        backend="unknown", database="unknown", sensor="unknown", last_reading_at=None
    )
