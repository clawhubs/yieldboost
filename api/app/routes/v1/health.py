from fastapi import APIRouter, Request

from ...schemas.common import ErrorResponse
from ...schemas.health import HealthResponse


router = APIRouter(prefix="/v1", tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={500: {"model": ErrorResponse}},
    summary="Check integrity API health",
    description="Returns infrastructure and 9-layer pipeline readiness.",
)
async def get_health(request: Request) -> HealthResponse:
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.health(request.state.request_id)
