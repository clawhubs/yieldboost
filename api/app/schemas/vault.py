from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

class SealRequest(BaseModel):
    network: Literal["testnet", "mainnet"] | None = Field(default=None, description="Target 0G network. Defaults to the API's configured default network.")
    challenge_id: str | None = Field(default=None, description="Server-issued auth challenge identifier.")
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$", description="Wallet that authorizes the seal operation.")
    signature: str = Field(description="EIP-191 or EIP-712 signature proving wallet ownership.")
    signature_kind: Literal["eip191", "eip712"] = "eip191"
    message: str | None = Field(default=None, description="Original message signed for EIP-191.")
    typed_data: dict[str, Any] | None = Field(default=None, description="Structured typed data for EIP-712.")
    plaintext: str | None = Field(default=None, description="Plaintext payload to seal.")
    file_name: str | None = Field(default=None, description="Optional source filename.")
    file_content_base64: str | None = Field(default=None, description="Base64 file payload when sealing binary data.")
    mime_type: str = "text/plain"
    transaction_hash: str | None = Field(default=None, description="0G gas payment transaction hash supplied by the client.")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Tenant/app metadata persisted alongside the sealed record.")

    @model_validator(mode="after")
    def validate_payload(self) -> "SealRequest":
        if not self.plaintext and not self.file_content_base64:
            raise ValueError("plaintext or file_content_base64 is required")
        if self.signature_kind == "eip191" and not self.message:
            raise ValueError("message is required for eip191 signatures")
        if self.signature_kind == "eip712" and not self.typed_data:
            raise ValueError("typed_data is required for eip712 signatures")
        return self


class UnsealRequest(BaseModel):
    network: Literal["testnet", "mainnet"] | None = Field(default=None, description="Expected network for the vault record. Defaults to the API's configured default network.")
    challenge_id: str | None = Field(default=None, description="Server-issued auth challenge identifier.")
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$", description="Wallet requesting unseal.")
    signature: str = Field(description="Wallet signature proving requester ownership.")
    signature_kind: Literal["eip191", "eip712"] = "eip191"
    message: str | None = None
    typed_data: dict[str, Any] | None = None
    storage_id: str = Field(description="Vault storage identifier returned by /seal.")

    @model_validator(mode="after")
    def validate_signature(self) -> "UnsealRequest":
        if self.signature_kind == "eip191" and not self.message:
            raise ValueError("message is required for eip191 signatures")
        if self.signature_kind == "eip712" and not self.typed_data:
            raise ValueError("typed_data is required for eip712 signatures")
        return self


class DeleteRequest(BaseModel):
    network: Literal["testnet", "mainnet"] | None = Field(default=None, description="Expected network for the vault record. Defaults to the API's configured default network.")
    challenge_id: str | None = Field(default=None, description="Server-issued auth challenge identifier.")
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$", description="Wallet requesting delete.")
    signature: str = Field(description="Wallet signature proving requester ownership.")
    signature_kind: Literal["eip191", "eip712"] = "eip191"
    message: str | None = None
    typed_data: dict[str, Any] | None = None
    storage_id: str = Field(description="Vault storage identifier returned by /seal.")

    @model_validator(mode="after")
    def validate_signature(self) -> "DeleteRequest":
        if self.signature_kind == "eip191" and not self.message:
            raise ValueError("message is required for eip191 signatures")
        if self.signature_kind == "eip712" and not self.typed_data:
            raise ValueError("typed_data is required for eip712 signatures")
        return self


class SealResponse(BaseModel):
    success: bool = True
    request_id: str
    network: Literal["testnet", "mainnet"]
    storage_id: str
    storage_root_hash: str | None = None
    storage_tx_hash: str | None = None
    storage_explorer_url: str | None = None
    integrity_hash: str
    judge_url: str
    anchor_tx_hash: str | None = None
    anchor_explorer_url: str | None = None
    transaction_hash: str | None = None
    layer_statuses: dict[str, str]


class UnsealResponse(BaseModel):
    success: bool = True
    request_id: str
    network: Literal["testnet", "mainnet"]
    storage_id: str
    integrity_hash: str
    plaintext: str | None = None
    file_name: str | None = None
    file_content_base64: str | None = None
    mime_type: str
    layer_statuses: dict[str, str]


class DeleteResponse(BaseModel):
    success: bool = True
    request_id: str
    network: Literal["testnet", "mainnet"]
    storage_id: str
    deleted: bool = True
    storage_mode: str | None = None
    anchor_mode: str | None = None
    layer_statuses: dict[str, str]


class VaultMetadataResponse(BaseModel):
    success: bool = True
    request_id: str
    network: Literal["testnet", "mainnet"]
    storage_id: str
    storage_root_hash: str | None = None
    storage_tx_hash: str | None = None
    storage_explorer_url: str | None = None
    wallet_address: str
    integrity_hash: str
    payload_sha256: str
    mime_type: str
    file_name: str | None = None
    storage_uri: str | None = None
    storage_mode: str | None = None
    anchor_tx_hash: str | None = None
    anchor_explorer_url: str | None = None
    anchor_mode: str | None = None
    transaction_hash: str | None = None
    created_at: str
    metadata: dict[str, Any]
    last_unsealed_at: str | None = None


class VaultListItem(BaseModel):
    storage_id: str
    network: Literal["testnet", "mainnet"]
    wallet_address: str
    integrity_hash: str
    payload_sha256: str
    mime_type: str
    file_name: str | None = None
    storage_root_hash: str | None = None
    storage_tx_hash: str | None = None
    storage_explorer_url: str | None = None
    anchor_tx_hash: str | None = None
    anchor_explorer_url: str | None = None
    transaction_hash: str | None = None
    created_at: str
    last_unsealed_at: str | None = None
    layer_statuses: dict[str, str] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class VaultListResponse(BaseModel):
    success: bool = True
    request_id: str
    network: Literal["testnet", "mainnet"] | None = None
    wallet_address: str
    items: list[VaultListItem]
    total: int


class SecurityLogItem(BaseModel):
    wallet_address: str
    action_type: Literal["Seal", "Unseal", "Delete"]
    status: Literal["Success", "Blocked"]
    layer_failed: str | None = None
    payload_metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: str


class AdminStatsWallet(BaseModel):
    wallet_address: str
    blocked_unseal_attempts: int
    last_seen_at: str | None = None


class AdminStatsResponse(BaseModel):
    success: bool = True
    request_id: str
    total_deflected_attacks: int
    failed_unseal_attempts: list[AdminStatsWallet]
    recent_logs: list[SecurityLogItem]
