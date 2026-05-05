import json
import os
import sys

import httpx
from eth_account import Account
from eth_account.messages import encode_typed_data


def _challenge(client: httpx.Client, wallet_address: str, storage_id: str) -> dict:
    response = client.post(
        "/v1/auth/challenge",
        json={
            "operation": "delete",
            "network": "testnet",
            "wallet_address": wallet_address,
            "storage_id": storage_id,
        },
    )
    response.raise_for_status()
    return response.json()


def _typed_data(challenge: dict, wallet_address: str, storage_id: str) -> dict:
    return {
        "domain": {
            "name": "YieldBoost Integrity API",
            "version": "1",
            "chainId": 16602,
        },
        "types": {
            "VaultDelete": [
                {"name": "challengeId", "type": "string"},
                {"name": "challenge", "type": "string"},
                {"name": "operation", "type": "string"},
                {"name": "network", "type": "string"},
                {"name": "wallet", "type": "address"},
                {"name": "storageId", "type": "string"},
            ]
        },
        "primaryType": "VaultDelete",
        "message": {
            "challengeId": challenge["challenge_id"],
            "challenge": challenge["message"],
            "operation": "delete",
            "network": "testnet",
            "wallet": wallet_address,
            "storageId": storage_id,
        },
    }


def main() -> int:
    api_base = os.environ.get("YIELDBOOST_API_BASE", "https://api.yieldboostai.xyz").rstrip("/")
    api_key = os.environ.get("YIELDBOOST_API_KEY")
    private_key = os.environ.get("YIELDBOOST_OWNER_PRIVATE_KEY")
    wallet_address = os.environ.get("YIELDBOOST_OWNER_WALLET")

    if not api_key or not private_key:
        print("YIELDBOOST_API_KEY and YIELDBOOST_OWNER_PRIVATE_KEY are required.", file=sys.stderr)
        return 1

    owner = Account.from_key(private_key)
    wallet_address = wallet_address or owner.address

    headers = {"X-API-Key": api_key}
    deleted: list[str] = []

    with httpx.Client(base_url=api_base, headers=headers, timeout=30.0) as client:
        listed = client.get(
            "/v1/integrity/records",
            params={"wallet_address": wallet_address, "network": "testnet"},
        )
        listed.raise_for_status()
        items = listed.json().get("items", [])
        for item in items:
            storage_id = item["storage_id"]
            challenge = _challenge(client, wallet_address, storage_id)
            typed_data = _typed_data(challenge, wallet_address, storage_id)
            signature = Account.sign_message(
                encode_typed_data(full_message=typed_data),
                owner.key,
            ).signature.hex()
            deleted_response = client.post(
                "/v1/integrity/delete",
                json={
                    "network": "testnet",
                    "challenge_id": challenge["challenge_id"],
                    "wallet_address": wallet_address,
                    "signature_kind": "eip712",
                    "message": challenge["message"],
                    "typed_data": typed_data,
                    "signature": signature,
                    "storage_id": storage_id,
                },
            )
            deleted_response.raise_for_status()
            deleted.append(storage_id)

    print(json.dumps({"wallet_address": wallet_address, "deleted_count": len(deleted), "storage_ids": deleted}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
