import base64
import json

from fastapi import APIRouter, Header, Request
from pydantic import ValidationError
from starlette.datastructures import UploadFile as StarletteUploadFile

from ...core.api_keys import ensure_api_access
from ...core.exceptions import IntegrityError
from ...core.rate_limiter import enforce_wallet_rate_limit
from ...schemas.common import ErrorResponse
from ...schemas.vault import (
    DeleteRequest,
    DeleteResponse,
    SealRequest,
    SealResponse,
    UnsealRequest,
    UnsealResponse,
    VaultListResponse,
    VaultMetadataResponse,
)


legacy_router = APIRouter(prefix="/v1/vault", tags=["legacy-vault"])
router = APIRouter(prefix="/v1/integrity", tags=["integrity"])


def _metadata_from_raw(raw: object) -> dict:
    if raw is None or raw == "":
        return {}
    if isinstance(raw, dict):
        return raw
    if not isinstance(raw, str):
        raise IntegrityError("metadata must be a JSON object.", status_code=422)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise IntegrityError("metadata must be valid JSON.", status_code=422) from exc
    if not isinstance(parsed, dict):
        raise IntegrityError("metadata must be a JSON object.", status_code=422)
    return parsed


async def _parse_seal_request(request: Request) -> SealRequest:
    content_type = request.headers.get("content-type", "")
    try:
        if "multipart/form-data" not in content_type:
            return SealRequest.model_validate(await request.json())

        form = await request.form()
        file_value = form.get("file")
        file_content_base64 = None
        file_name = form.get("file_name")
        mime_type = str(form.get("mime_type") or "text/plain")

        if isinstance(file_value, StarletteUploadFile):
            file_bytes = await file_value.read()
            file_content_base64 = base64.b64encode(file_bytes).decode("ascii")
            file_name = file_value.filename or str(file_name or "sealed-file")
            mime_type = file_value.content_type or mime_type or "application/octet-stream"

        return SealRequest.model_validate(
            {
                "network": form.get("network"),
                "challenge_id": form.get("challenge_id"),
                "wallet_address": form.get("wallet_address"),
                "signature": form.get("signature"),
                "signature_kind": form.get("signature_kind") or "eip191",
                "message": form.get("message"),
                "typed_data": _metadata_from_raw(form.get("typed_data")),
                "plaintext": form.get("plaintext"),
                "file_name": file_name,
                "file_content_base64": file_content_base64,
                "mime_type": mime_type,
                "transaction_hash": form.get("transaction_hash"),
                "metadata": _metadata_from_raw(form.get("metadata")),
            }
        )
    except ValidationError as exc:
        raise IntegrityError(
            "Invalid seal payload.",
            status_code=422,
            layer="request",
            detail={"errors": exc.errors()},
        ) from exc
    except json.JSONDecodeError as exc:
        raise IntegrityError("Invalid JSON body.", status_code=400, layer="request") from exc


@legacy_router.post(
    "/seal",
    response_model=SealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}, 429: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    include_in_schema=False,
)
@router.post(
    "/seal",
    response_model=SealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}, 429: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Run the 10-layer integrity seal pipeline",
    description="Accepts plaintext or file input, verifies wallet ownership, executes the full 10-layer integrity stack, encrypts inside isolated compute, and returns proof-backed storage metadata.",
)
async def seal_vault(
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> SealResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["integrity:seal"])
    payload = await _parse_seal_request(request)
    await enforce_wallet_rate_limit(request, operation="seal", wallet_address=payload.wallet_address)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.seal(payload, request.state.request_id)


@legacy_router.get(
    "",
    response_model=VaultListResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    include_in_schema=False,
)
@router.get(
    "/records",
    response_model=VaultListResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="List integrity records owned by a wallet",
    description="Returns sanitized integrity records for a wallet without exposing plaintext or ciphertext.",
)
async def list_vaults(
    request: Request,
    wallet_address: str,
    network: str | None = None,
    x_api_key: str | None = Header(default=None),
) -> VaultListResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["integrity:read"])
    if network not in {None, "testnet", "mainnet"}:
        raise IntegrityError("network must be testnet or mainnet.", status_code=422, layer="request")
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.list_vaults(
        wallet_address=wallet_address,
        network=network,
        request_id=request.state.request_id,
    )


@legacy_router.post(
    "/unseal",
    response_model=UnsealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    include_in_schema=False,
)
@router.post(
    "/unseal",
    response_model=UnsealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Run the 10-layer integrity unseal pipeline",
    description="Re-verifies wallet ownership, re-enters isolated compute, enforces owner-only access, and returns raw data only to the authorized requester.",
)
async def unseal_vault(
    payload: UnsealRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> UnsealResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["integrity:unseal"])
    await enforce_wallet_rate_limit(request, operation="unseal", wallet_address=payload.wallet_address)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.unseal(payload, request.state.request_id)


@legacy_router.post(
    "/delete",
    response_model=DeleteResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    include_in_schema=False,
)
@router.post(
    "/delete",
    response_model=DeleteResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Delete an integrity record with wallet authorization",
    description="Requires a one-time auth challenge plus owner wallet signature before removing the vault record from the active index and dashboard surfaces.",
)
async def delete_vault(
    payload: DeleteRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> DeleteResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["integrity:delete"])
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.delete(payload, request.state.request_id)


@legacy_router.get(
    "/{storage_id}/metadata",
    response_model=VaultMetadataResponse,
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    include_in_schema=False,
)
@router.get(
    "/{storage_id}/metadata",
    response_model=VaultMetadataResponse,
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Read sanitized integrity metadata",
    description="Returns non-secret integrity metadata for an existing record. Plaintext and ciphertext never appear in this response.",
)
async def get_vault_metadata(
    storage_id: str,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> VaultMetadataResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["integrity:read"])
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.get_metadata(storage_id, request.state.request_id)
