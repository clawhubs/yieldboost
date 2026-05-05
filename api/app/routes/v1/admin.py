from fastapi import APIRouter, Header, Request

from ...core.exceptions import IntegrityError
from ...schemas.common import ErrorResponse
from ...schemas.vault import AdminStatsResponse


router = APIRouter(prefix="/v1/admin", tags=["admin"])


def _assert_founder(request: Request, wallet_address: str | None, api_key: str | None) -> None:
    settings = request.app.state.integrity_pipeline.settings
    if settings.api_keys and (not api_key or api_key not in settings.api_keys):
        raise IntegrityError("Missing or invalid API key.", status_code=401)

    founder_wallet = settings.resolved_founder_wallet_address
    if not founder_wallet:
        raise IntegrityError("Founder wallet is not configured.", status_code=403)
    if not wallet_address or wallet_address.lower() != founder_wallet.lower():
        raise IntegrityError("Founder wallet required.", status_code=403)


@router.get(
    "/public-stats",
    summary="Read public vault challenge counters",
)
async def get_public_stats(request: Request) -> dict:
    pipeline = request.app.state.integrity_pipeline
    total = await pipeline.store.count_security_logs(status="Blocked")
    return {
        "success": True,
        "request_id": request.state.request_id,
        "total_deflected_attacks": total,
    }


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
    summary="Read founder-only vault attack statistics",
    description="Aggregates failed unseal attempts per wallet and returns recent security audit logs.",
)
async def get_admin_stats(
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
) -> AdminStatsResponse:
    _assert_founder(request, x_wallet_address, x_api_key)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.admin_stats(request.state.request_id)
