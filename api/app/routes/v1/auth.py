from fastapi import APIRouter, Header, Request

from ...core.exceptions import IntegrityError
from ...schemas.auth import ChallengeRequest, ChallengeResponse
from ...schemas.common import ErrorResponse


router = APIRouter(prefix="/v1/auth", tags=["auth"])


def _assert_api_key(request: Request, api_key: str | None) -> None:
    settings = request.app.state.integrity_pipeline.settings
    if not settings.api_keys:
        return
    if not api_key or api_key not in settings.api_keys:
        raise IntegrityError("Missing or invalid API key.", status_code=401)


@router.post(
    "/challenge",
    response_model=ChallengeResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
    summary="Create a one-time auth challenge",
    description="Returns the exact message that must be signed by the wallet before calling seal or unseal.",
)
async def create_challenge(
    payload: ChallengeRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> ChallengeResponse:
    _assert_api_key(request, x_api_key)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.create_auth_challenge(payload, request.state.request_id)
