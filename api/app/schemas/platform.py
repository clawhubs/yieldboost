from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

from .health import ComponentHealth


class BlacklistCheckRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)


class BlacklistCheckResponse(BaseModel):
    success: bool = True
    request_id: str
    allowed: bool
    layer_statuses: dict[str, str]


class AuditEvaluateRequest(BaseModel):
    plaintext: str | None = None
    file_content_base64: str | None = None
    mime_type: str = "text/plain"
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_payload(self) -> "AuditEvaluateRequest":
        if not self.plaintext and not self.file_content_base64:
            raise ValueError("plaintext or file_content_base64 is required")
        return self


class AuditEvaluateResponse(BaseModel):
    success: bool = True
    request_id: str
    payload_sha256: str
    payload_size_bytes: int
    mime_type: str
    layer_statuses: dict[str, str]


class ProofRunRequest(BaseModel):
    commitment: dict[str, Any] = Field(default_factory=dict)
    integrity_hash: str | None = None


class ProofRunResponse(BaseModel):
    success: bool = True
    request_id: str
    integrity_hash: str
    verified: bool
    proof_type: str
    envelope: dict[str, Any]
    layer_statuses: dict[str, str]


class GovernanceEvaluateRequest(BaseModel):
    wallet_address: str | None = Field(default=None, pattern=r"^0x[a-fA-F0-9]{40}$")
    recent_request_count: int = Field(default=0, ge=0)


class GovernanceEvaluateResponse(BaseModel):
    success: bool = True
    request_id: str
    allowed: bool
    risk_score: int
    status: str
    layer_statuses: dict[str, str]


class HandshakeLogRequest(BaseModel):
    subject_id: str = Field(min_length=1, max_length=120)
    wallet_address: str | None = Field(default=None, pattern=r"^0x[a-fA-F0-9]{40}$")
    operation: str = Field(min_length=1, max_length=80)
    metadata: dict[str, Any] = Field(default_factory=dict)


class HandshakeLogResponse(BaseModel):
    success: bool = True
    request_id: str
    subject_id: str
    operation: str
    status: str
    timestamp: str
    layer_statuses: dict[str, str]


class LayerStatusResponse(BaseModel):
    success: bool = True
    request_id: str
    active_network: Literal["testnet", "mainnet"]
    layers: dict[str, ComponentHealth]
    infrastructure: dict[str, ComponentHealth]


class YaCheckoutVerifyRequest(BaseModel):
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$")
    plan_id: str = Field(min_length=1, max_length=32)
    amount_og: Decimal = Field(ge=0)
    tx_hash: str | None = Field(default=None, pattern=r"^0x[a-fA-F0-9]{64}$")
    recent_request_count: int = Field(default=0, ge=0)


class YaCheckoutVerifyResponse(BaseModel):
    success: bool = True
    request_id: str
    verified: bool
    plan_id: str
    wallet_address: str
    amount_og: str
    tx_hash: str | None
    asset_symbol: str
    network: Literal["mainnet", "testnet"]
    treasury_address: str
    proof_type: str
    integrity_hash: str
    explorer_url: str | None = None
    layer_statuses: dict[str, str]
