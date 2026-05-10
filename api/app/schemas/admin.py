from typing import Literal

from pydantic import BaseModel, Field

from .vault import SecurityLogItem


class ApiKeyCreateRequest(BaseModel):
    app_name: str = Field(min_length=2, max_length=80)
    owner_label: str | None = Field(default=None, max_length=120)
    owner_wallet_address: str | None = Field(default=None, pattern=r"^0x[a-fA-F0-9]{40}$")
    environment: Literal["testnet", "mainnet", "multi"] = "testnet"
    notes: str | None = Field(default=None, max_length=240)
    scopes: list[str] = Field(default_factory=list)
    plan_id: str | None = Field(default=None, max_length=32)
    plan_name: str | None = Field(default=None, max_length=80)
    plan_price_ya: int | None = Field(default=None, ge=0)
    plan_price_og: str | None = Field(default=None, max_length=32)
    plan_max_keys: int | None = Field(default=None, ge=1)
    plan_quota_monthly: int | None = Field(default=None, ge=1)
    plan_expires_at: str | None = None
    checkout_tx_hash: str | None = Field(default=None, pattern=r"^0x[a-fA-F0-9]{64}$")
    checkout_integrity_hash: str | None = Field(default=None, max_length=80)


class ApiKeyListItem(BaseModel):
    key_id: str
    app_name: str
    owner_label: str | None = None
    owner_wallet_address: str | None = None
    environment: Literal["testnet", "mainnet", "multi"]
    notes: str | None = None
    scopes: list[str] = Field(default_factory=list)
    plan_id: str | None = None
    plan_name: str | None = None
    plan_price_ya: int | None = None
    plan_price_og: str | None = None
    plan_max_keys: int | None = None
    plan_quota_monthly: int | None = None
    plan_expires_at: str | None = None
    checkout_tx_hash: str | None = None
    checkout_integrity_hash: str | None = None
    monthly_usage: dict[str, int] = Field(default_factory=dict)
    key_preview: str
    status: Literal["active", "revoked"]
    created_at: str
    last_used_at: str | None = None
    revoked_at: str | None = None
    total_requests: int = 0
    success_requests: int = 0
    blocked_requests: int = 0


class ApiKeyCreateResponse(BaseModel):
    success: bool = True
    request_id: str
    api_key: str
    item: ApiKeyListItem


class ApiKeyListResponse(BaseModel):
    success: bool = True
    request_id: str
    items: list[ApiKeyListItem]
    total: int


class ApiKeyUsageItem(BaseModel):
    request_id: str
    path: str
    method: str
    status_code: int
    category: Literal["auth", "integrity", "audit", "blacklist", "proof", "governance", "handshake", "status", "admin", "health", "other"]
    app_name: str
    key_id: str | None = None
    network: str | None = None
    wallet_address: str | None = None
    latency_ms: int
    timestamp: str


class UsageSummaryItem(BaseModel):
    key_id: str | None = None
    app_name: str
    total_requests: int
    success_requests: int
    blocked_requests: int
    last_used_at: str | None = None


class DeveloperDashboardResponse(BaseModel):
    success: bool = True
    request_id: str
    total_api_keys: int
    active_api_keys: int
    revoked_api_keys: int
    total_requests: int
    success_requests: int
    blocked_requests: int
    total_deflected_attacks: int
    top_apps: list[UsageSummaryItem]
    recent_usage: list[ApiKeyUsageItem]
    recent_logs: list[SecurityLogItem]
