from fastapi import APIRouter, Header, Request

from ...core.api_keys import ensure_api_access
from ...schemas.auth import ChallengeRequest, ChallengeResponse
from ...schemas.common import ErrorResponse


router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post(
    "/challenge",
    response_model=ChallengeResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
    summary="Create a one-time auth challenge",
    description="Returns the exact message that must be signed by the wallet before calling seal or unseal.",
    include_in_schema=False,
)
async def create_challenge(
    payload: ChallengeRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> ChallengeResponse:
    required_scope = {
        "seal": "integrity:seal",
        "unseal": "integrity:unseal",
        "delete": "integrity:delete",
    }[payload.operation]
    await ensure_api_access(request, x_api_key, required_scopes=[required_scope])
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.create_auth_challenge(payload, request.state.request_id)
