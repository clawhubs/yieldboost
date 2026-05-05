from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class NetworkConfig(BaseModel):
    key: Literal["testnet", "mainnet"]
    rpc_url: str | None = None
    storage_url: str | None = None
    private_key: str | None = None
    proof_registry_address: str | None = None
    explorer_base_url: str

    @property
    def storage_enabled(self) -> bool:
        return bool(self.storage_url)

    @property
    def chain_enabled(self) -> bool:
        return bool(self.rpc_url and self.private_key and self.proof_registry_address)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="YieldBoost AI Integrity API", alias="INTEGRITY_API_APP_NAME")
    app_version: str = Field(default="0.1.0", alias="INTEGRITY_API_APP_VERSION")
    debug: bool = Field(default=False, alias="INTEGRITY_API_DEBUG")
    request_timeout_seconds: int = Field(default=45, alias="INTEGRITY_API_REQUEST_TIMEOUT_SECONDS")
    judge_base_url: str = Field(default="https://yieldboostai.xyz/judge", alias="INTEGRITY_API_JUDGE_BASE_URL")
    max_payload_bytes: int = Field(default=4 * 1024 * 1024, alias="INTEGRITY_API_MAX_PAYLOAD_BYTES")
    default_network: Literal["testnet", "mainnet"] = Field(default="testnet", alias="INTEGRITY_API_NETWORK")
    require_auth_challenge: bool = Field(default=True, alias="INTEGRITY_API_REQUIRE_AUTH_CHALLENGE")
    auth_challenge_ttl_seconds: int = Field(default=300, alias="INTEGRITY_API_AUTH_CHALLENGE_TTL_SECONDS")

    api_keys_raw: str = Field(default="", alias="INTEGRITY_API_KEYS")
    master_key: str = Field(default="dev-master-key-change-me", alias="INTEGRITY_MASTER_KEY")
    local_store_path: str = Field(
        default=".artifacts/integrity-api-store.local.json",
        alias="INTEGRITY_API_LOCAL_STORE_PATH",
    )

    e2b_api_key: str | None = Field(default=None, alias="E2B_API_KEY")
    allow_local_tee_fallback: bool = Field(default=True, alias="INTEGRITY_API_ALLOW_LOCAL_TEE_FALLBACK")

    zg_mainnet_rpc_url: str | None = Field(default=None, alias="ZG_MAINNET_RPC_URL")
    zg_mainnet_storage_url: str | None = Field(default=None, alias="ZG_MAINNET_STORAGE_URL")
    zg_mainnet_private_key: str | None = Field(default=None, alias="ZG_MAINNET_PRIVATE_KEY")
    zg_mainnet_proof_registry_address: str | None = Field(
        default=None,
        alias="ZG_MAINNET_PROOF_REGISTRY_ADDRESS",
    )
    zg_mainnet_explorer_base_url: str = Field(
        default="https://chainscan.0g.ai",
        alias="NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL",
    )
    zg_testnet_rpc_url: str | None = Field(default="https://evmrpc-testnet.0g.ai", alias="ZG_TESTNET_RPC_URL")
    zg_testnet_storage_url: str | None = Field(default="https://indexer-storage-testnet-turbo.0g.ai", alias="ZG_TESTNET_STORAGE_URL")
    zg_testnet_private_key: str | None = Field(default=None, alias="ZG_TESTNET_PRIVATE_KEY")
    zg_testnet_proof_registry_address: str | None = Field(default=None, alias="ZG_TESTNET_PROOF_REGISTRY_ADDRESS")
    zg_testnet_explorer_base_url: str = Field(
        default="https://chainscan-galileo.0g.ai",
        alias="NEXT_PUBLIC_0G_TESTNET_EXPLORER_BASE_URL",
    )

    @property
    def api_keys(self) -> set[str]:
        return {item.strip() for item in self.api_keys_raw.split(",") if item.strip()}

    @property
    def store_path(self) -> Path:
        return Path(self.local_store_path)

    def network_config(self, network: Literal["testnet", "mainnet"] | str) -> NetworkConfig:
        key = "mainnet" if network == "mainnet" else "testnet"
        if key == "mainnet":
            return NetworkConfig(
                key="mainnet",
                rpc_url=self.zg_mainnet_rpc_url,
                storage_url=self.zg_mainnet_storage_url,
                private_key=self.zg_mainnet_private_key,
                proof_registry_address=self.zg_mainnet_proof_registry_address,
                explorer_base_url=self.zg_mainnet_explorer_base_url,
            )
        return NetworkConfig(
            key="testnet",
            rpc_url=self.zg_testnet_rpc_url,
            storage_url=self.zg_testnet_storage_url,
            private_key=self.zg_testnet_private_key,
            proof_registry_address=self.zg_testnet_proof_registry_address,
            explorer_base_url=self.zg_testnet_explorer_base_url,
        )

    @property
    def active_network_config(self) -> NetworkConfig:
        return self.network_config(self.default_network)


@lru_cache
def get_settings() -> Settings:
    return Settings()
