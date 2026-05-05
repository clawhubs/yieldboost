from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .request_context import request_id_var


class IntegrityError(Exception):
    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        layer: str | None = None,
        detail: dict | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.layer = layer
        self.detail = detail


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(IntegrityError)
    async def handle_integrity_error(
        _request: Request,
        exc: IntegrityError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.message,
                "layer": exc.layer,
                "request_id": request_id_var.get(),
                "detail": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        _request: Request,
        _exc: Exception,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Unexpected internal error.",
                "layer": None,
                "request_id": request_id_var.get(),
                "detail": None,
            },
        )
