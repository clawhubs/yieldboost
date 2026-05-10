from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import get_settings
from .core.exceptions import register_exception_handlers
from .core.logging import configure_logging
from .core.rate_limiter import RateLimiter, enforce_ip_rate_limit
from .core.request_context import request_id_var
from .routes.v1.admin import router as admin_router
from .routes.v1.auth import router as auth_router
from .routes.v1.checkout import router as checkout_router
from .routes.v1.health import router as health_router
from .routes.v1.platform import (
    audit_router,
    blacklist_router,
    governance_router,
    handshake_router,
    proof_router,
    status_router,
)
from .routes.v1.vault import legacy_router as legacy_vault_router
from .routes.v1.vault import router as integrity_router
from .services.pipeline import IntegrityPipeline


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.debug)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        description=(
            "YieldBoost AI 9-Layer Integrity API on 0G. Use the developer portal to create "
            "an API key, then send it on every protected request as the `X-API-Key` header. "
            "Public routes expose the integrity pipeline itself: seal/unseal, layer checks, "
            "proof envelopes, governance evaluation, handshake logging, and status."
        ),
        openapi_tags=[
            {
                "name": "integrity",
                "description": "Public 9-layer integrity surface for seal, unseal, and proof-backed metadata.",
            },
            {
                "name": "health",
                "description": "Infrastructure and layer readiness checks for the integrity stack.",
            },
            {
                "name": "platform-blacklist",
                "description": "L1 blacklist-as-a-service endpoints.",
            },
            {
                "name": "platform-audit",
                "description": "L1-L2 integrity audit endpoints.",
            },
            {
                "name": "platform-proof",
                "description": "L6 proof generation and verification endpoints.",
            },
            {
                "name": "platform-governance",
                "description": "L8 governance and safety throttle endpoints.",
            },
            {
                "name": "platform-handshake",
                "description": "L9 handshake logging endpoints.",
            },
            {
                "name": "platform-status",
                "description": "Platform-centric status views for the 9-layer stack.",
            },
        ],
    )
    app.state.settings = settings
    app.state.integrity_pipeline = IntegrityPipeline(settings)
    app.state.rate_limiter = RateLimiter()
    register_exception_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def attach_request_context(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or f"req_{uuid4().hex}"
        request_id_var.set(request_id)
        request.state.request_id = request_id
        request.state.request_started_at = datetime.now(timezone.utc)
        retry_after = await enforce_ip_rate_limit(request)
        if retry_after is not None:
            response = JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Too many requests. Please wait before trying again.",
                    "layer": "L8",
                    "request_id": request_id,
                    "detail": {"retry_after_seconds": retry_after, "scope": "ip"},
                },
                headers={"Retry-After": str(retry_after)},
            )
            response.headers["X-Request-ID"] = request_id
            return response
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        if request.url.path.startswith("/v1/"):
            client = getattr(request.state, "api_client", None)
            if client:
                request_ts = getattr(request.state, "request_started_at", datetime.now(timezone.utc))
                latency_ms = max(0, int((datetime.now(timezone.utc) - request_ts).total_seconds() * 1000))
                category = "other"
                if request.url.path.startswith("/v1/auth"):
                    category = "auth"
                elif request.url.path.startswith("/v1/vault") or request.url.path.startswith("/v1/integrity"):
                    category = "integrity"
                elif request.url.path.startswith("/v1/audit"):
                    category = "audit"
                elif request.url.path.startswith("/v1/blacklist"):
                    category = "blacklist"
                elif request.url.path.startswith("/v1/proof"):
                    category = "proof"
                elif request.url.path.startswith("/v1/governance"):
                    category = "governance"
                elif request.url.path.startswith("/v1/handshake"):
                    category = "handshake"
                elif request.url.path.startswith("/v1/status"):
                    category = "status"
                elif request.url.path.startswith("/v1/checkout"):
                    category = "governance"
                elif request.url.path.startswith("/v1/admin"):
                    category = "admin"
                elif request.url.path.startswith("/v1/health"):
                    category = "health"

                network = request.query_params.get("network")
                wallet = request.query_params.get("wallet_address")
                await app.state.integrity_pipeline.store.append_api_usage(
                    {
                        "request_id": request_id,
                        "path": request.url.path,
                        "method": request.method,
                        "status_code": response.status_code,
                        "category": category,
                        "app_name": client.get("app_name", "Unknown App"),
                        "key_id": client.get("key_id"),
                        "network": network,
                        "wallet_address": wallet,
                        "latency_ms": latency_ms,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                )
        return response

    @app.get("/", tags=["meta"])
    async def root(request: Request) -> JSONResponse:
        return JSONResponse(
            {
                "name": settings.app_name,
                "version": settings.app_version,
                "docs": "/docs",
                "openapi": "/openapi.json",
                "health": "/v1/health",
                "request_id": request.state.request_id,
            }
        )

    app.include_router(legacy_vault_router)
    app.include_router(integrity_router)
    app.include_router(auth_router)
    app.include_router(blacklist_router)
    app.include_router(audit_router)
    app.include_router(proof_router)
    app.include_router(governance_router)
    app.include_router(handshake_router)
    app.include_router(status_router)
    app.include_router(checkout_router)
    app.include_router(admin_router)
    app.include_router(health_router)
    return app


app = create_app()
