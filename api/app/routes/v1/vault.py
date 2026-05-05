from fastapi import APIRouter, Header, Request

from ...core.exceptions import IntegrityError
from ...schemas.common import ErrorResponse
from ...schemas.vault import (
    SealRequest,
    SealResponse,
    UnsealRequest,
    UnsealResponse,
    VaultMetadataResponse,
)


router = APIRouter(prefix="/v1/vault", tags=["vault"])


def _assert_api_key(request: Request, api_key: str | None) -> None:
    settings = request.app.state.integrity_pipeline.settings
    if not settings.api_keys:
        return
    if not api_key or api_key not in settings.api_keys:
        raise IntegrityError("Missing or invalid API key.", status_code=401)


@router.post(
    "/seal",
    response_model=SealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}, 429: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Seal plaintext or file into the integrity vault",
    description="Verifies wallet ownership, runs the 9-layer pipeline, encrypts payload in an ephemeral sandbox, and persists metadata.",
)
async def seal_vault(
    payload: SealRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> SealResponse:
    _assert_api_key(request, x_api_key)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.seal(payload, request.state.request_id)


@router.post(
    "/unseal",
    response_model=UnsealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Unseal vault contents for the original wallet owner",
    description="Re-verifies the wallet signature, enforces owner-only access, decrypts inside a fresh sandbox, and returns the raw payload only to the requester.",
)
async def unseal_vault(
    payload: UnsealRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> UnsealResponse:
    _assert_api_key(request, x_api_key)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.unseal(payload, request.state.request_id)


@router.get(
    "/{storage_id}/metadata",
    response_model=VaultMetadataResponse,
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Read sanitized vault metadata",
    description="Returns non-secret metadata for an existing vault record. Ciphertext and plaintext are never returned here.",
)
async def get_vault_metadata(
    storage_id: str,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> VaultMetadataResponse:
    _assert_api_key(request, x_api_key)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.get_metadata(storage_id, request.state.request_id)
