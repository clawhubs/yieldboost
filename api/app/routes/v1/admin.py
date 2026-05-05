from fastapi import APIRouter, Header, Request

from ...core.api_keys import build_api_key_record, ensure_admin_access
from ...core.exceptions import IntegrityError
from ...schemas.admin import ApiKeyCreateRequest, ApiKeyCreateResponse, ApiKeyListItem, ApiKeyListResponse, DeveloperDashboardResponse
from ...schemas.common import ErrorResponse, RequestStatus
from ...schemas.vault import AdminStatsResponse


router = APIRouter(prefix="/v1/admin", tags=["admin"])


def _authorize(
    request: Request,
    *,
    wallet_address: str | None,
    api_key: str | None,
    master_key: str | None,
) -> None:
    ensure_admin_access(
        request,
        wallet_address=wallet_address,
        api_key=api_key,
        master_key=master_key,
    )


@router.get(
    "/public-stats",
    summary="Read public vault challenge counters",
    include_in_schema=False,
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
    include_in_schema=False,
)
async def get_admin_stats(
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_master_key: str | None = Header(default=None),
) -> AdminStatsResponse:
    _authorize(
        request,
        wallet_address=x_wallet_address,
        api_key=x_api_key,
        master_key=x_master_key,
    )
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.admin_stats(request.state.request_id)


@router.get(
    "/dashboard",
    response_model=DeveloperDashboardResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
    summary="Read developer dashboard overview",
    include_in_schema=False,
)
async def get_dashboard(
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_master_key: str | None = Header(default=None),
) -> DeveloperDashboardResponse:
    _authorize(
        request,
        wallet_address=x_wallet_address,
        api_key=x_api_key,
        master_key=x_master_key,
    )
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.developer_dashboard(request.state.request_id)


@router.get(
    "/api-keys",
    response_model=ApiKeyListResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
    summary="List managed API keys",
    include_in_schema=False,
)
async def list_api_keys(
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_master_key: str | None = Header(default=None),
) -> ApiKeyListResponse:
    _authorize(
        request,
        wallet_address=x_wallet_address,
        api_key=x_api_key,
        master_key=x_master_key,
    )
    items = await request.app.state.integrity_pipeline.store.list_api_keys(include_revoked=True)
    normalized = [
        ApiKeyListItem(
            key_id=item["key_id"],
            app_name=item["app_name"],
            owner_label=item.get("owner_label"),
            owner_wallet_address=item.get("owner_wallet_address"),
            environment=item.get("environment", "testnet"),
            notes=item.get("notes"),
            scopes=item.get("scopes") or [],
            key_preview=item["key_preview"],
            status=item.get("status", "active"),
            created_at=item["created_at"],
            last_used_at=item.get("last_used_at"),
            revoked_at=item.get("revoked_at"),
            total_requests=int(item.get("total_requests") or 0),
            success_requests=int(item.get("success_requests") or 0),
            blocked_requests=int(item.get("blocked_requests") or 0),
        )
        for item in sorted(items, key=lambda row: row.get("created_at", ""), reverse=True)
    ]
    return ApiKeyListResponse(
        request_id=request.state.request_id,
        items=normalized,
        total=len(normalized),
    )


@router.post(
    "/api-keys",
    response_model=ApiKeyCreateResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Create a managed API key",
    include_in_schema=False,
)
async def create_api_key(
    payload: ApiKeyCreateRequest,
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_master_key: str | None = Header(default=None),
) -> ApiKeyCreateResponse:
    _authorize(
        request,
        wallet_address=x_wallet_address,
        api_key=x_api_key,
        master_key=x_master_key,
    )
    raw_key, record = build_api_key_record(
        master_key=request.app.state.integrity_pipeline.settings.master_key,
        app_name=payload.app_name,
        owner_label=payload.owner_label,
        owner_wallet_address=payload.owner_wallet_address,
        environment=payload.environment,
        notes=payload.notes,
        scopes=payload.scopes,
    )
    await request.app.state.integrity_pipeline.store.save_api_key(record)
    item = ApiKeyListItem(
        key_id=record["key_id"],
        app_name=record["app_name"],
        owner_label=record.get("owner_label"),
        owner_wallet_address=record.get("owner_wallet_address"),
        environment=record.get("environment", "testnet"),
        notes=record.get("notes"),
        scopes=record.get("scopes") or [],
        key_preview=record["key_preview"],
        status=record["status"],
        created_at=record["created_at"],
        last_used_at=record.get("last_used_at"),
        revoked_at=record.get("revoked_at"),
        total_requests=int(record.get("total_requests") or 0),
        success_requests=int(record.get("success_requests") or 0),
        blocked_requests=int(record.get("blocked_requests") or 0),
    )
    return ApiKeyCreateResponse(
        request_id=request.state.request_id,
        api_key=raw_key,
        item=item,
    )


@router.post(
    "/api-keys/{key_id}/revoke",
    response_model=RequestStatus,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Revoke a managed API key",
    include_in_schema=False,
)
async def revoke_api_key(
    key_id: str,
    request: Request,
    x_wallet_address: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    x_master_key: str | None = Header(default=None),
) -> RequestStatus:
    _authorize(
        request,
        wallet_address=x_wallet_address,
        api_key=x_api_key,
        master_key=x_master_key,
    )
    revoked = await request.app.state.integrity_pipeline.store.revoke_api_key(
        key_id,
        request.app.state.integrity_pipeline.now_iso(),
    )
    if not revoked:
        raise IntegrityError("API key was not found.", status_code=404, layer="admin")
    return RequestStatus(request_id=request.state.request_id)
