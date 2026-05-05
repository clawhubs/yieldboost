import base64
import json

from fastapi import APIRouter, Header, Request
from pydantic import ValidationError
from starlette.datastructures import UploadFile as StarletteUploadFile

from ...core.exceptions import IntegrityError
from ...schemas.common import ErrorResponse
from ...schemas.vault import (
    SealRequest,
    SealResponse,
    UnsealRequest,
    UnsealResponse,
    VaultListResponse,
    VaultMetadataResponse,
)


router = APIRouter(prefix="/v1/vault", tags=["vault"])


def _assert_api_key(request: Request, api_key: str | None) -> None:
    settings = request.app.state.integrity_pipeline.settings
    if not settings.api_keys:
        return
    if not api_key or api_key not in settings.api_keys:
        raise IntegrityError("Missing or invalid API key.", status_code=401)


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


@router.post(
    "/seal",
    response_model=SealResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}, 429: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Seal plaintext or file into the integrity vault",
    description="Verifies wallet ownership, runs the 9-layer pipeline, encrypts payload in an ephemeral sandbox, and persists metadata.",
)
async def seal_vault(
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> SealResponse:
    _assert_api_key(request, x_api_key)
    payload = await _parse_seal_request(request)
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.seal(payload, request.state.request_id)


@router.get(
    "",
    response_model=VaultListResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="List sealed vault blobs owned by a wallet",
    description="Returns sanitized vault records for the supplied wallet address.",
)
async def list_vaults(
    request: Request,
    wallet_address: str,
    network: str | None = None,
    x_api_key: str | None = Header(default=None),
) -> VaultListResponse:
    _assert_api_key(request, x_api_key)
    if network not in {None, "testnet", "mainnet"}:
        raise IntegrityError("network must be testnet or mainnet.", status_code=422, layer="request")
    pipeline = request.app.state.integrity_pipeline
    return await pipeline.list_vaults(
        wallet_address=wallet_address,
        network=network,
        request_id=request.state.request_id,
    )


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
