from fastapi import APIRouter, Header, Request

from ...core.api_keys import ensure_api_access
from ...schemas.common import ErrorResponse
from ...schemas.platform import (
    AuditEvaluateRequest,
    AuditEvaluateResponse,
    BlacklistCheckRequest,
    BlacklistCheckResponse,
    GovernanceEvaluateRequest,
    GovernanceEvaluateResponse,
    HandshakeLogRequest,
    HandshakeLogResponse,
    LayerStatusResponse,
    ProofRunRequest,
    ProofRunResponse,
)


blacklist_router = APIRouter(prefix="/v1/blacklist", tags=["platform-blacklist"])
audit_router = APIRouter(prefix="/v1/audit", tags=["platform-audit"])
proof_router = APIRouter(prefix="/v1/proof", tags=["platform-proof"])
governance_router = APIRouter(prefix="/v1/governance", tags=["platform-governance"])
handshake_router = APIRouter(prefix="/v1/handshake", tags=["platform-handshake"])
status_router = APIRouter(prefix="/v1/status", tags=["platform-status"])


@blacklist_router.post(
    "/check",
    response_model=BlacklistCheckResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Run L1 blacklist screening",
    description="Screen arbitrary text against YieldBoost AI blacklist rules without invoking the full integrity seal pipeline.",
)
async def blacklist_check(
    payload: BlacklistCheckRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> BlacklistCheckResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["blacklist:check"])
    return await request.app.state.integrity_pipeline.blacklist_check(payload.text, request.state.request_id)


@audit_router.post(
    "/evaluate",
    response_model=AuditEvaluateResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Run L1 and L2 integrity audit",
    description="Evaluate payload safety and deterministic integrity constraints without sealing or anchoring the payload.",
)
async def audit_evaluate(
    payload: AuditEvaluateRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> AuditEvaluateResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["audit:run"])
    return await request.app.state.integrity_pipeline.audit_evaluate(payload, request.state.request_id)


@proof_router.post(
    "/run",
    response_model=ProofRunResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Run L6 proof envelope generation or verification",
    description="Generate the deterministic integrity proof envelope for a commitment payload and optionally verify an expected integrity hash.",
)
async def proof_run(
    payload: ProofRunRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> ProofRunResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["proof:run"])
    return await request.app.state.integrity_pipeline.proof_run(payload, request.state.request_id)


@governance_router.post(
    "/evaluate",
    response_model=GovernanceEvaluateResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    summary="Run L8 governance and throttling evaluation",
    description="Evaluate whether a request burst or policy profile should be allowed through the safety throttle layer.",
)
async def governance_evaluate(
    payload: GovernanceEvaluateRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> GovernanceEvaluateResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["governance:evaluate"])
    return await request.app.state.integrity_pipeline.governance_evaluate(payload, request.state.request_id)


@handshake_router.post(
    "/log",
    response_model=HandshakeLogResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Run L9 neural handshake logging",
    description="Write a structured handshake event into the cross-agent audit journal without performing a seal or unseal operation.",
)
async def handshake_log(
    payload: HandshakeLogRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> HandshakeLogResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["handshake:write"])
    return await request.app.state.integrity_pipeline.handshake_log(payload, request.state.request_id)


@status_router.get(
    "/layers",
    response_model=LayerStatusResponse,
    responses={401: {"model": ErrorResponse}},
    summary="Read detailed 10-layer status",
    description="Read readiness for each security layer and its supporting infrastructure. This is the platform-centric status view above raw health.",
)
async def status_layers(
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> LayerStatusResponse:
    await ensure_api_access(request, x_api_key, required_scopes=["status:read"])
    return await request.app.state.integrity_pipeline.layer_status(request.state.request_id)
