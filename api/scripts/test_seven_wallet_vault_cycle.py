import base64
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
    normalized: list[str] = []
    seen: set[str] = set()
    for key in keys:
        value = key if key.startswith("0x") else f"0x{key}"
        address = Account.from_key(value).address.lower()
        if address in seen:
            continue
        seen.add(address)
        normalized.append(value)
    return normalized


def sign_message(private_key: str, message: str) -> str:
    return Account.sign_message(encode_defunct(text=message), private_key).signature.hex()


def sign_typed_data(private_key: str, typed_data: dict) -> str:
    return Account.sign_message(
        encode_typed_data(full_message=typed_data),
        private_key,
    ).signature.hex()


def build_typed_data(challenge: dict, wallet_address: str, storage_id: str, operation: str) -> dict:
    primary_type = "VaultDelete" if operation == "delete" else "VaultUnseal"
    return {
        "domain": {
            "name": "YieldBoost Integrity API",
            "version": "1",
            "chainId": 16602,
        },
        "types": {
            primary_type: [
                {"name": "challengeId", "type": "string"},
                {"name": "challenge", "type": "string"},
                {"name": "operation", "type": "string"},
                {"name": "network", "type": "string"},
                {"name": "wallet", "type": "address"},
                {"name": "storageId", "type": "string"},
            ]
        },
        "primaryType": primary_type,
        "message": {
            "challengeId": challenge["challenge_id"],
            "challenge": challenge["message"],
            "operation": operation,
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
    store_path = REPO_ROOT / ".artifacts" / "seven-wallet-vault-cycle.json"
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
    all_keys = extract_private_keys(PRIVATE_KEY_FILE.read_text(encoding="utf-8"))
    if len(all_keys) < 7:
      raise RuntimeError("Need at least 7 unique wallet private keys in /home/cucu/Coder/Private key wallet/private")

    test_keys = all_keys[:7]
    client = prepare_client()
    records: list[dict] = []

    for index, private_key in enumerate(test_keys, 1):
        wallet = Account.from_key(private_key)
        wallet_address = wallet.address
        use_file_payload = index % 2 == 0
        plaintext = f"YieldBoost vault payload for wallet {index}"
        file_bytes = f"YieldBoost file payload for wallet {index}".encode("utf-8")

        seal_challenge = issue_challenge(client, wallet_address, "seal")
        seal_payload = {
            "network": "testnet",
            "challenge_id": seal_challenge["challenge_id"],
            "wallet_address": wallet_address,
            "signature_kind": "eip191",
            "message": seal_challenge["message"],
            "signature": sign_message(private_key, seal_challenge["message"]),
            "transaction_hash": f"0x{index:064x}",
            "metadata": {"test": "seven-wallet-cycle", "wallet_index": index},
            "mime_type": "application/octet-stream" if use_file_payload else "text/plain",
            "file_name": f"wallet-{index}.bin" if use_file_payload else f"wallet-{index}.txt",
        }
        if use_file_payload:
            seal_payload["file_content_base64"] = base64.b64encode(file_bytes).decode("ascii")
        else:
            seal_payload["plaintext"] = plaintext

        seal_response = client.post("/v1/integrity/seal", json=seal_payload)
        seal_response.raise_for_status()
        seal_data = seal_response.json()
        storage_id = seal_data["storage_id"]

        list_response = client.get(
            "/v1/integrity/records",
            params={"wallet_address": wallet_address, "network": "testnet"},
        )
        list_response.raise_for_status()
        listed_ids = [item["storage_id"] for item in list_response.json()["items"]]
        assert storage_id in listed_ids

        records.append(
            {
                "index": index,
                "private_key": private_key,
                "wallet_address": wallet_address,
                "storage_id": storage_id,
                "payload_kind": "file" if use_file_payload else "text",
                "plaintext": plaintext if not use_file_payload else None,
                "file_b64": base64.b64encode(file_bytes).decode("ascii") if use_file_payload else None,
                "seal_status": seal_response.status_code,
            }
        )

    foreign_results: dict[str, dict | None] = {}
    for idx, record in enumerate(records):
        blocked_foreign_unseal = None
        if idx > 0:
            attacker = record
            target = records[idx - 1]
            foreign_unseal_challenge = issue_challenge(client, attacker["wallet_address"], "unseal", target["storage_id"])
            foreign_unseal_typed = build_typed_data(
                foreign_unseal_challenge,
                attacker["wallet_address"],
                target["storage_id"],
                "unseal",
            )
            foreign_unseal_response = client.post(
                "/v1/integrity/unseal",
                json={
                    "network": "testnet",
                    "challenge_id": foreign_unseal_challenge["challenge_id"],
                    "wallet_address": attacker["wallet_address"],
                    "signature_kind": "eip712",
                    "message": foreign_unseal_challenge["message"],
                    "typed_data": foreign_unseal_typed,
                    "signature": sign_typed_data(attacker["private_key"], foreign_unseal_typed),
                    "storage_id": target["storage_id"],
                },
            )
            blocked_foreign_unseal = {
                "against": short_address(target["wallet_address"]),
                "status_code": foreign_unseal_response.status_code,
                "blocked": foreign_unseal_response.status_code == 403,
            }
        foreign_results[record["storage_id"]] = blocked_foreign_unseal

    results = []
    for record in records:
        private_key = record["private_key"]
        wallet_address = record["wallet_address"]
        storage_id = record["storage_id"]
        unseal_challenge = issue_challenge(client, wallet_address, "unseal", storage_id)
        unseal_typed = build_typed_data(unseal_challenge, wallet_address, storage_id, "unseal")
        unseal_response = client.post(
            "/v1/integrity/unseal",
            json={
                "network": "testnet",
                "challenge_id": unseal_challenge["challenge_id"],
                "wallet_address": wallet_address,
                "signature_kind": "eip712",
                "message": unseal_challenge["message"],
                "typed_data": unseal_typed,
                "signature": sign_typed_data(private_key, unseal_typed),
                "storage_id": storage_id,
            },
        )
        unseal_response.raise_for_status()
        unseal_data = unseal_response.json()
        if record["payload_kind"] == "file":
            assert unseal_data["file_content_base64"] == record["file_b64"]
        else:
            assert unseal_data["plaintext"] == record["plaintext"]

        delete_challenge = issue_challenge(client, wallet_address, "delete", storage_id)
        delete_typed = build_typed_data(delete_challenge, wallet_address, storage_id, "delete")
        delete_response = client.post(
            "/v1/integrity/delete",
            json={
                "network": "testnet",
                "challenge_id": delete_challenge["challenge_id"],
                "wallet_address": wallet_address,
                "signature_kind": "eip712",
                "message": delete_challenge["message"],
                "typed_data": delete_typed,
                "signature": sign_typed_data(private_key, delete_typed),
                "storage_id": storage_id,
            },
        )
        delete_response.raise_for_status()

        post_delete_list = client.get(
            "/v1/integrity/records",
            params={"wallet_address": wallet_address, "network": "testnet"},
        )
        post_delete_list.raise_for_status()
        remaining_ids = [item["storage_id"] for item in post_delete_list.json()["items"]]
        assert storage_id not in remaining_ids

        results.append(
            {
                "wallet": short_address(wallet_address),
                "storage_id": storage_id,
                "payload_kind": record["payload_kind"],
                "seal_status": record["seal_status"],
                "unseal_status": unseal_response.status_code,
                "delete_status": delete_response.status_code,
                "foreign_unseal": foreign_results[storage_id],
            }
        )

    print(
        json.dumps(
            {
                "wallets_tested": len(test_keys),
                "operations": ["seal/upload", "list", "unseal/download", "delete"],
                "results": results,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
