from typing import Literal

from pydantic import BaseModel, Field


class ChallengeRequest(BaseModel):
    operation: Literal["seal", "unseal"]
    network: Literal["testnet", "mainnet"] | None = None
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$")
    storage_id: str | None = None


class ChallengeResponse(BaseModel):
    success: bool = True
    request_id: str
    challenge_id: str
    operation: Literal["seal", "unseal"]
    network: Literal["testnet", "mainnet"]
    wallet_address: str
    storage_id: str | None = None
    message: str
    issued_at: str
    expires_at: str
