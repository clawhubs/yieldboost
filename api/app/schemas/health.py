from typing import Literal

from pydantic import BaseModel, Field


class ComponentHealth(BaseModel):
    status: Literal["ok", "degraded", "down"]
    detail: str


class HealthResponse(BaseModel):
    success: bool = True
    status: Literal["ok", "degraded", "down"]
    request_id: str | None = Field(default=None)
    active_network: Literal["testnet", "mainnet"]
    infrastructure: dict[str, ComponentHealth]
    layers: dict[str, ComponentHealth]
