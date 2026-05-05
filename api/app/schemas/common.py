from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    layer: str | None = None
    request_id: str | None = None
    detail: dict[str, Any] | None = None


class RequestStatus(BaseModel):
    request_id: str = Field(description="Server-generated request correlation ID.")

