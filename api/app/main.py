from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .core.config import get_settings
from .core.exceptions import register_exception_handlers
from .core.logging import configure_logging
from .core.request_context import request_id_var
from .routes.v1.auth import router as auth_router
from .routes.v1.health import router as health_router
from .routes.v1.vault import router as vault_router
from .services.pipeline import IntegrityPipeline


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.debug)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        description=(
            "Integrity-as-a-Service API for sealing and unsealing sensitive payloads "
            "through an async 9-layer pipeline backed by wallet signatures, ephemeral sandboxes, "
            "and proof-oriented metadata."
        ),
    )
    app.state.integrity_pipeline = IntegrityPipeline(settings)
    register_exception_handlers(app)

    @app.middleware("http")
    async def attach_request_context(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or f"req_{uuid4().hex}"
        request_id_var.set(request_id)
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
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

    app.include_router(vault_router)
    app.include_router(auth_router)
    app.include_router(health_router)
    return app


app = create_app()
