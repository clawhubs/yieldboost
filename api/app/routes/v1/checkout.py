from fastapi import APIRouter, Header, Request

from ...core.api_keys import ensure_admin_access
from ...schemas.common import ErrorResponse
from ...schemas.platform import YaCheckoutVerifyRequest, YaCheckoutVerifyResponse


router = APIRouter(prefix="/v1/checkout", tags=["platform-checkout"])


@router.post(
    "/verify",
    response_model=YaCheckoutVerifyResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Verify a native 0G checkout through the 9-layer integrity stack",
    description=(
        "Validates a native 0G mainnet payment receipt, binds it to the developer wallet, and records "
        "a 9-layer integrity envelope before API access is issued."
    ),
)
async def verify_ya_checkout(
    payload: YaCheckoutVerifyRequest,
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_master_key: str | None = Header(default=None),
) -> YaCheckoutVerifyResponse:
    ensure_admin_access(
        request,
        wallet_address=x_wallet_address,
        api_key=x_api_key,
        master_key=x_master_key,
    )
    return await request.app.state.integrity_pipeline.ya_checkout_verify(payload, request.state.request_id)
