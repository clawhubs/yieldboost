import json
import logging
import os
import re
import sys
from pathlib import Path

from eth_account import Account
from eth_account.messages import encode_defunct, encode_typed_data
from fastapi.testclient import TestClient


REPO_ROOT = Path(__file__).resolve().parents[2]
API_ROOT = REPO_ROOT / "api"
PRIVATE_KEY_FILE = Path("/home/cucu/Coder/Private key wallet/private")
logging.getLogger("httpx").setLevel(logging.WARNING)

if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


def short_address(address: str) -> str:
    return f"{address[:6]}...{address[-4:]}"


def extract_private_keys(raw: str) -> list[str]:
    keys = re.findall(
        r"0x[a-fA-F0-9]{64}|(?<![a-fA-F0-9])[a-fA-F0-9]{64}(?![a-fA-F0-9])",
        raw,
    )
    normalized = []
    seen = set()
    for key in keys:
        value = key if key.startswith("0x") else f"0x{key}"
        address = Account.from_key(value).address.lower()
        if address in seen:
            continue
        seen.add(address)
        normalized.append(value)
    return normalized


def read_env_private_key() -> str | None:
    env_path = REPO_ROOT / ".env.local"
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.startswith(("ZG_TESTNET_PRIVATE_KEY=", "ZG_MAINNET_PRIVATE_KEY=")):
            value = line.split("=", 1)[1].strip()
            if re.fullmatch(r"0x[a-fA-F0-9]{64}", value):
                return value
    return None


def sign_message(private_key: str, message: str) -> str:
    return Account.sign_message(encode_defunct(text=message), private_key).signature.hex()


def sign_typed_data(private_key: str, typed_data: dict) -> str:
    return Account.sign_message(
        encode_typed_data(full_message=typed_data),
        private_key,
    ).signature.hex()


def build_unseal_typed_data(challenge: dict, wallet_address: str, storage_id: str) -> dict:
    return {
        "domain": {
            "name": "YieldBoost Integrity API",
            "version": "1",
            "chainId": 16602,
        },
        "types": {
            "VaultUnseal": [
                {"name": "challengeId", "type": "string"},
                {"name": "challenge", "type": "string"},
                {"name": "operation", "type": "string"},
                {"name": "network", "type": "string"},
                {"name": "wallet", "type": "address"},
                {"name": "storageId", "type": "string"},
            ]
        },
        "primaryType": "VaultUnseal",
        "message": {
            "challengeId": challenge["challenge_id"],
            "challenge": challenge["message"],
            "operation": "unseal",
            "network": "testnet",
            "wallet": wallet_address,
            "storageId": storage_id,
        },
    }


def issue_challenge(
    client: TestClient,
    wallet_address: str,
    operation: str,
    storage_id: str | None = None,
) -> dict:
    response = client.post(
        "/v1/auth/challenge",
        json={
            "operation": operation,
            "network": "testnet",
            "wallet_address": wallet_address,
            "storage_id": storage_id,
        },
    )
    response.raise_for_status()
    return response.json()


def prepare_client() -> TestClient:
    store_path = REPO_ROOT / ".artifacts" / "nine-wallet-vault-test.json"
    store_path.unlink(missing_ok=True)
    os.environ["INTEGRITY_API_REQUIRE_AUTH_CHALLENGE"] = "true"
    os.environ["INTEGRITY_API_NETWORK"] = "testnet"
    os.environ["INTEGRITY_API_ALLOW_LOCAL_TEE_FALLBACK"] = "true"
    os.environ["INTEGRITY_API_LOCAL_STORE_PATH"] = str(store_path)
    os.environ["ZG_TESTNET_PRIVATE_KEY"] = ""
    os.environ["ZG_TESTNET_PROOF_REGISTRY_ADDRESS"] = ""

    from app.core.config import get_settings
    from app.main import create_app

    get_settings.cache_clear()
    return TestClient(create_app())


def main() -> None:
    folder_keys = extract_private_keys(PRIVATE_KEY_FILE.read_text(encoding="utf-8"))
    env_key = read_env_private_key()
    all_keys = []
    if env_key:
        all_keys.append(env_key)
    all_keys.extend(folder_keys)

    unique_keys = []
    seen = set()
    for key in all_keys:
        address = Account.from_key(key).address.lower()
        if address in seen:
            continue
        seen.add(address)
        unique_keys.append(key)

    while len(unique_keys) < 9:
        unique_keys.append(Account.create().key.hex())

    test_keys = unique_keys[:9]
    owner_key = test_keys[0]
    attacker_keys = test_keys[1:]
    owner = Account.from_key(owner_key)
    client = prepare_client()

    challenge = issue_challenge(client, owner.address, "seal")
    seal = client.post(
        "/v1/vault/seal",
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": sign_message(owner_key, challenge["message"]),
            "plaintext": "YieldBoost vault owner payload",
            "mime_type": "text/plain",
            "transaction_hash": "0x" + "90" * 32,
            "metadata": {"test": "nine-wallet-unseal"},
        },
    )
    seal.raise_for_status()
    storage_id = seal.json()["storage_id"]

    blocked = []
    for index, attacker_key in enumerate(attacker_keys, 1):
        attacker = Account.from_key(attacker_key)
        attacker_challenge = issue_challenge(client, attacker.address, "unseal", storage_id)
        typed_data = build_unseal_typed_data(
            attacker_challenge,
            attacker.address,
            storage_id,
        )
        response = client.post(
            "/v1/vault/unseal",
            json={
                "network": "testnet",
                "challenge_id": attacker_challenge["challenge_id"],
                "wallet_address": attacker.address,
                "signature_kind": "eip712",
                "message": attacker_challenge["message"],
                "typed_data": typed_data,
                "signature": sign_typed_data(attacker_key, typed_data),
                "storage_id": storage_id,
            },
        )
        payload = response.json()
        blocked.append(
            {
                "index": index,
                "wallet": short_address(attacker.address),
                "status_code": response.status_code,
                "layer": payload.get("layer"),
                "blocked": response.status_code == 403,
            }
        )

    owner_challenge = issue_challenge(client, owner.address, "unseal", storage_id)
    owner_typed_data = build_unseal_typed_data(owner_challenge, owner.address, storage_id)
    owner_unseal = client.post(
        "/v1/vault/unseal",
        json={
            "network": "testnet",
            "challenge_id": owner_challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip712",
            "message": owner_challenge["message"],
            "typed_data": owner_typed_data,
            "signature": sign_typed_data(owner_key, owner_typed_data),
            "storage_id": storage_id,
        },
    )
    owner_unseal.raise_for_status()

    stats = client.get("/v1/admin/public-stats")
    stats.raise_for_status()

    print(
        json.dumps(
            {
                "accounts_tested": len(test_keys),
                "folder_keys_found": len(folder_keys),
                "owner": short_address(owner.address),
                "storage_id": storage_id,
                "blocked_attempts": sum(1 for item in blocked if item["blocked"]),
                "owner_unseal_status": owner_unseal.status_code,
                "total_deflected_attacks": stats.json()["total_deflected_attacks"],
                "attempts": blocked,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
