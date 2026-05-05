import json
from pathlib import Path

from eth_account import Account
from eth_account.messages import encode_defunct, encode_typed_data
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


def _sign_message(private_key: bytes, message: str) -> str:
    return Account.sign_message(encode_defunct(text=message), private_key).signature.hex()


def _sign_typed_data(private_key: bytes, typed_data: dict) -> str:
    return Account.sign_message(
        encode_typed_data(full_message=typed_data),
        private_key,
    ).signature.hex()


def _build_unseal_typed_data(challenge: dict, wallet_address: str, storage_id: str) -> dict:
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


def _build_delete_typed_data(challenge: dict, wallet_address: str, storage_id: str) -> dict:
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


def _issue_challenge(client: TestClient, wallet_address: str, operation: str, storage_id: str | None = None):
    response = client.post(
        "/v1/auth/challenge",
        json={
            "operation": operation,
            "network": "testnet",
            "wallet_address": wallet_address,
            "storage_id": storage_id,
        },
    )
    assert response.status_code == 200
    return response.json()


def _issue_challenge_with_key(
    client: TestClient,
    api_key: str,
    wallet_address: str,
    operation: str,
    storage_id: str | None = None,
):
    response = client.post(
        "/v1/auth/challenge",
        headers={"X-API-Key": api_key},
        json={
            "operation": operation,
            "network": "testnet",
            "wallet_address": wallet_address,
            "storage_id": storage_id,
        },
    )
    assert response.status_code == 200
    return response.json()


def _make_client(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("INTEGRITY_API_REQUIRE_AUTH_CHALLENGE", "true")
    monkeypatch.setenv("INTEGRITY_API_NETWORK", "testnet")
    monkeypatch.setenv("INTEGRITY_API_LOCAL_STORE_PATH", str(tmp_path / "api-store.json"))
    monkeypatch.setenv("INTEGRITY_API_ALLOW_LOCAL_TEE_FALLBACK", "true")
    get_settings.cache_clear()
    app = create_app()
    pipeline = app.state.integrity_pipeline
    remote_blobs: dict[str, dict] = {}

    async def fake_store_sealed_blob(*, storage_id: str, network: str, payload: dict):
        root_hash = f"0x{storage_id[-32:]:0>64}"[-66:]
        tx_hash = f"0x{storage_id[-16:]:0>64}"[-66:]
        remote_blobs[root_hash] = payload
        from app.clients.zero_g_storage import StorageReceipt

        return StorageReceipt(
            storage_id=storage_id,
            storage_mode=f"0g-{network}",
            storage_uri=f"https://example.invalid/v1/file/{root_hash}",
            root_hash=root_hash,
            tx_hash=tx_hash,
            block_number=1,
            explorer_url=f"https://example.invalid/tx/{tx_hash}",
        )

    async def fake_read_sealed_blob(*, network: str, root_hash: str):
        return remote_blobs[root_hash]

    async def fake_anchor_integrity_proof(*, network: str, cid: str, root_hash: str, storage_tx_hash: str, current_apy_bps: int = 0, optimized_apy_bps: int = 0):
        from app.clients.zero_g_chain import AnchorReceipt

        return AnchorReceipt(
            mode=f"0g-{network}",
            tx_hash="0x" + "ab" * 32,
            explorer_url="https://example.invalid/tx/anchor",
        )

    async def fake_storage_health(network: str):
        return ("ok", f"0G Storage upload path is configured for {network}.")

    async def fake_chain_health(network: str):
        return ("ok", f"0G {network} proof anchoring is configured.")

    pipeline.zero_g_storage.store_sealed_blob = fake_store_sealed_blob
    pipeline.zero_g_storage.read_sealed_blob = fake_read_sealed_blob
    pipeline.zero_g_storage.health = fake_storage_health
    pipeline.zero_g_chain.anchor_integrity_proof = fake_anchor_integrity_proof
    pipeline.zero_g_chain.health = fake_chain_health
    return TestClient(app), tmp_path / "api-store.json"


def test_seal_and_unseal_with_challenge(monkeypatch, tmp_path):
    client, store_path = _make_client(monkeypatch, tmp_path)
    account = Account.create()

    seal_challenge = _issue_challenge(client, account.address, "seal")
    seal_response = client.post(
        "/v1/vault/seal",
        json={
            "network": "testnet",
            "challenge_id": seal_challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": seal_challenge["message"],
            "signature": _sign_message(account.key, seal_challenge["message"]),
            "plaintext": "hello secure world",
            "mime_type": "text/plain",
        },
    )
    assert seal_response.status_code == 200
    seal_data = seal_response.json()
    assert seal_data["network"] == "testnet"
    assert seal_data["layer_statuses"]["L5"] == "0g-testnet"
    assert seal_data["layer_statuses"]["L7"] == "0g-testnet"
    assert seal_data["storage_root_hash"].startswith("0x")
    assert seal_data["storage_tx_hash"].startswith("0x")

    store = json.loads(store_path.read_text())
    store["vault_records"][seal_data["storage_id"]]["ciphertext_b64"] = "tampered-local-value"
    store_path.write_text(json.dumps(store, indent=2), encoding="utf-8")

    unseal_challenge = _issue_challenge(client, account.address, "unseal", seal_data["storage_id"])
    unseal_response = client.post(
        "/v1/vault/unseal",
        json={
            "network": "testnet",
            "challenge_id": unseal_challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": unseal_challenge["message"],
            "signature": _sign_message(account.key, unseal_challenge["message"]),
            "storage_id": seal_data["storage_id"],
        },
    )
    assert unseal_response.status_code == 200
    unseal_data = unseal_response.json()
    assert unseal_data["plaintext"] == "hello secure world"
    assert unseal_data["layer_statuses"]["L5"] == "0g-testnet"


def test_multipart_seal_accepts_browser_line_endings(monkeypatch, tmp_path):
    client, _ = _make_client(monkeypatch, tmp_path)
    account = Account.create()

    challenge = _issue_challenge(client, account.address, "seal")
    signature = _sign_message(account.key, challenge["message"])
    multipart_message = challenge["message"].replace("\n", "\r\n")

    response = client.post(
        "/v1/integrity/seal",
        data={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": multipart_message,
            "signature": signature,
            "transaction_hash": "0x" + "44" * 32,
            "metadata": json.dumps({"test": "multipart-browser-line-endings"}),
        },
        files={
            "file": (
                "product.txt",
                b"browser multipart payload with private key backup text",
                "text/plain",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["network"] == "testnet"
    assert data["storage_id"].startswith("vault_")


def test_vault_seal_allows_secret_payload_but_wrong_wallet_stays_blocked(monkeypatch, tmp_path):
    client, _ = _make_client(monkeypatch, tmp_path)
    owner = Account.create()
    attacker = Account.create()

    challenge = _issue_challenge(client, owner.address, "seal")
    seal = client.post(
        "/v1/integrity/seal",
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": _sign_message(owner.key, challenge["message"]),
            "plaintext": "private key backup for sealed vault storage",
            "mime_type": "text/plain",
            "transaction_hash": "0x" + "45" * 32,
            "metadata": {"test": "secret-payload"},
        },
    )
    assert seal.status_code == 200
    storage_id = seal.json()["storage_id"]

    attacker_challenge = _issue_challenge(client, attacker.address, "unseal", storage_id)
    blocked = client.post(
        "/v1/integrity/unseal",
        json={
            "network": "testnet",
            "challenge_id": attacker_challenge["challenge_id"],
            "wallet_address": attacker.address,
            "signature_kind": "eip191",
            "message": attacker_challenge["message"],
            "signature": _sign_message(attacker.key, attacker_challenge["message"]),
            "storage_id": storage_id,
        },
    )

    assert blocked.status_code == 403
    assert blocked.json()["layer"] == "ownership"


def test_challenge_endpoint_is_rate_limited(monkeypatch, tmp_path):
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_AUTH_CHALLENGE_WALLET", "1")
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_AUTH_CHALLENGE_IP", "100")
    client, _ = _make_client(monkeypatch, tmp_path)
    account = Account.create()
    payload = {
        "operation": "seal",
        "network": "testnet",
        "wallet_address": account.address,
    }

    first = client.post("/v1/auth/challenge", json=payload)
    second = client.post("/v1/auth/challenge", json=payload)

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["layer"] == "L8"


def test_seal_and_unseal_endpoints_are_rate_limited(monkeypatch, tmp_path):
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_AUTH_CHALLENGE_IP", "100")
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_AUTH_CHALLENGE_WALLET", "100")
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_SEAL_IP", "100")
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_SEAL_WALLET", "1")
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_UNSEAL_IP", "100")
    monkeypatch.setenv("INTEGRITY_API_RATE_LIMIT_UNSEAL_WALLET", "1")
    client, _ = _make_client(monkeypatch, tmp_path)
    account = Account.create()

    first_challenge = _issue_challenge(client, account.address, "seal")
    first_seal = client.post(
        "/v1/integrity/seal",
        json={
            "network": "testnet",
            "challenge_id": first_challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": first_challenge["message"],
            "signature": _sign_message(account.key, first_challenge["message"]),
            "plaintext": "first payload",
            "mime_type": "text/plain",
        },
    )
    assert first_seal.status_code == 200
    storage_id = first_seal.json()["storage_id"]

    second_challenge = _issue_challenge(client, account.address, "seal")
    second_seal = client.post(
        "/v1/integrity/seal",
        json={
            "network": "testnet",
            "challenge_id": second_challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": second_challenge["message"],
            "signature": _sign_message(account.key, second_challenge["message"]),
            "plaintext": "second payload",
            "mime_type": "text/plain",
        },
    )
    assert second_seal.status_code == 429
    assert second_seal.json()["layer"] == "L8"

    first_unseal_challenge = _issue_challenge(client, account.address, "unseal", storage_id)
    first_unseal = client.post(
        "/v1/integrity/unseal",
        json={
            "network": "testnet",
            "challenge_id": first_unseal_challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": first_unseal_challenge["message"],
            "signature": _sign_message(account.key, first_unseal_challenge["message"]),
            "storage_id": storage_id,
        },
    )
    assert first_unseal.status_code == 200

    second_unseal_challenge = _issue_challenge(client, account.address, "unseal", storage_id)
    second_unseal = client.post(
        "/v1/integrity/unseal",
        json={
            "network": "testnet",
            "challenge_id": second_unseal_challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": second_unseal_challenge["message"],
            "signature": _sign_message(account.key, second_unseal_challenge["message"]),
            "storage_id": storage_id,
        },
    )
    assert second_unseal.status_code == 429
    assert second_unseal.json()["layer"] == "L8"


def test_challenge_replay_is_rejected(monkeypatch, tmp_path):
    client, _ = _make_client(monkeypatch, tmp_path)
    account = Account.create()

    challenge = _issue_challenge(client, account.address, "seal")
    payload = {
        "network": "testnet",
        "challenge_id": challenge["challenge_id"],
        "wallet_address": account.address,
        "signature_kind": "eip191",
        "message": challenge["message"],
        "signature": _sign_message(account.key, challenge["message"]),
        "plaintext": "first",
        "mime_type": "text/plain",
    }
    first = client.post("/v1/vault/seal", json=payload)
    assert first.status_code == 200

    second = client.post("/v1/vault/seal", json=payload)
    assert second.status_code == 409
    assert second.json()["error"] == "Auth challenge has already been used."


def test_wrong_wallet_cannot_unseal(monkeypatch, tmp_path):
    client, _ = _make_client(monkeypatch, tmp_path)
    owner = Account.create()
    attacker = Account.create()

    challenge = _issue_challenge(client, owner.address, "seal")
    seal = client.post(
        "/v1/vault/seal",
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": _sign_message(owner.key, challenge["message"]),
            "plaintext": "owner-only",
            "mime_type": "text/plain",
        },
    )
    storage_id = seal.json()["storage_id"]

    unseal_challenge = _issue_challenge(client, attacker.address, "unseal", storage_id)
    forbidden = client.post(
        "/v1/vault/unseal",
        json={
            "network": "testnet",
            "challenge_id": unseal_challenge["challenge_id"],
            "wallet_address": attacker.address,
            "signature_kind": "eip191",
            "message": unseal_challenge["message"],
            "signature": _sign_message(attacker.key, unseal_challenge["message"]),
            "storage_id": storage_id,
        },
    )
    assert forbidden.status_code == 403
    assert forbidden.json()["layer"] == "ownership"


def test_network_mismatch_is_rejected(monkeypatch, tmp_path):
    client, _ = _make_client(monkeypatch, tmp_path)
    account = Account.create()

    challenge = _issue_challenge(client, account.address, "seal")
    seal = client.post(
        "/v1/vault/seal",
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": _sign_message(account.key, challenge["message"]),
            "plaintext": "network-bound",
            "mime_type": "text/plain",
        },
    )
    storage_id = seal.json()["storage_id"]

    unseal_challenge = client.post(
        "/v1/auth/challenge",
        json={
            "operation": "unseal",
            "network": "mainnet",
            "wallet_address": account.address,
            "storage_id": storage_id,
        },
    )
    assert unseal_challenge.status_code == 200
    challenge_data = unseal_challenge.json()
    response = client.post(
        "/v1/vault/unseal",
        json={
            "network": "mainnet",
            "challenge_id": challenge_data["challenge_id"],
            "wallet_address": account.address,
            "signature_kind": "eip191",
            "message": challenge_data["message"],
            "signature": _sign_message(account.key, challenge_data["message"]),
            "storage_id": storage_id,
        },
    )
    assert response.status_code == 409
    assert response.json()["error"] == "Requested network does not match the vault record network."


def test_eip712_unseal_list_and_security_logs(monkeypatch, tmp_path):
    founder = Account.create()
    monkeypatch.setenv("FOUNDER_WALLET_ADDRESS", founder.address)
    client, _ = _make_client(monkeypatch, tmp_path)
    owner = Account.create()
    attacker = Account.create()

    challenge = _issue_challenge(client, owner.address, "seal")
    seal = client.post(
        "/v1/vault/seal",
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": _sign_message(owner.key, challenge["message"]),
            "plaintext": "download me",
            "mime_type": "text/plain",
            "transaction_hash": "0x" + "12" * 32,
        },
    )
    assert seal.status_code == 200
    storage_id = seal.json()["storage_id"]

    listed = client.get(f"/v1/vault?wallet_address={owner.address}&network=testnet")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["storage_id"] == storage_id

    attacker_challenge = _issue_challenge(client, attacker.address, "unseal", storage_id)
    attacker_typed_data = _build_unseal_typed_data(
        attacker_challenge,
        attacker.address,
        storage_id,
    )
    blocked = client.post(
        "/v1/vault/unseal",
        json={
            "network": "testnet",
            "challenge_id": attacker_challenge["challenge_id"],
            "wallet_address": attacker.address,
            "signature_kind": "eip712",
            "message": attacker_challenge["message"],
            "typed_data": attacker_typed_data,
            "signature": _sign_typed_data(attacker.key, attacker_typed_data),
            "storage_id": storage_id,
        },
    )
    assert blocked.status_code == 403

    owner_challenge = _issue_challenge(client, owner.address, "unseal", storage_id)
    owner_typed_data = _build_unseal_typed_data(owner_challenge, owner.address, storage_id)
    unseal = client.post(
        "/v1/vault/unseal",
        json={
            "network": "testnet",
            "challenge_id": owner_challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip712",
            "message": owner_challenge["message"],
            "typed_data": owner_typed_data,
            "signature": _sign_typed_data(owner.key, owner_typed_data),
            "storage_id": storage_id,
        },
    )
    assert unseal.status_code == 200
    assert unseal.json()["plaintext"] == "download me"

    public_stats = client.get("/v1/admin/public-stats")
    assert public_stats.status_code == 200
    assert public_stats.json()["total_deflected_attacks"] == 1

    admin_stats = client.get(
        "/v1/admin/stats",
        headers={"x-wallet-address": founder.address},
    )
    assert admin_stats.status_code == 200
    data = admin_stats.json()
    assert data["failed_unseal_attempts"][0]["wallet_address"].lower() == attacker.address.lower()
    assert data["recent_logs"][0]["action_type"] in {"Seal", "Unseal"}


def test_owner_can_delete_with_eip712_and_wrong_wallet_is_blocked(monkeypatch, tmp_path):
    client, _ = _make_client(monkeypatch, tmp_path)
    owner = Account.create()
    attacker = Account.create()

    challenge = _issue_challenge(client, owner.address, "seal")
    seal = client.post(
        "/v1/integrity/seal",
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": _sign_message(owner.key, challenge["message"]),
            "plaintext": "delete me",
            "mime_type": "text/plain",
        },
    )
    assert seal.status_code == 200
    storage_id = seal.json()["storage_id"]

    attacker_challenge = _issue_challenge(client, attacker.address, "delete", storage_id)
    attacker_typed_data = _build_delete_typed_data(attacker_challenge, attacker.address, storage_id)
    blocked = client.post(
        "/v1/integrity/delete",
        json={
            "network": "testnet",
            "challenge_id": attacker_challenge["challenge_id"],
            "wallet_address": attacker.address,
            "signature_kind": "eip712",
            "message": attacker_challenge["message"],
            "typed_data": attacker_typed_data,
            "signature": _sign_typed_data(attacker.key, attacker_typed_data),
            "storage_id": storage_id,
        },
    )
    assert blocked.status_code == 403
    assert blocked.json()["layer"] == "ownership"

    owner_challenge = _issue_challenge(client, owner.address, "delete", storage_id)
    owner_typed_data = _build_delete_typed_data(owner_challenge, owner.address, storage_id)
    deleted = client.post(
        "/v1/integrity/delete",
        json={
            "network": "testnet",
            "challenge_id": owner_challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip712",
            "message": owner_challenge["message"],
            "typed_data": owner_typed_data,
            "signature": _sign_typed_data(owner.key, owner_typed_data),
            "storage_id": storage_id,
        },
    )
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
    assert deleted.json()["layer_statuses"]["L5"] == "record-index-removed"

    listed = client.get(f"/v1/integrity/records?wallet_address={owner.address}&network=testnet")
    assert listed.status_code == 200
    assert listed.json()["total"] == 0

    missing = client.get(f"/v1/integrity/{storage_id}/metadata")
    assert missing.status_code == 404


def test_managed_api_keys_and_dashboard(monkeypatch, tmp_path):
    monkeypatch.setenv("INTEGRITY_MASTER_KEY", "test-master-key")
    client, _ = _make_client(monkeypatch, tmp_path)

    created = client.post(
        "/v1/admin/api-keys",
        headers={"X-Master-Key": "test-master-key"},
        json={
            "app_name": "Acme Dev SDK",
            "owner_label": "Acme Labs",
            "environment": "testnet",
            "notes": "Beta tenant",
        },
    )
    assert created.status_code == 200
    created_payload = created.json()
    raw_key = created_payload["api_key"]
    key_id = created_payload["item"]["key_id"]

    owner = Account.create()
    challenge = _issue_challenge_with_key(client, raw_key, owner.address, "seal")
    sealed = client.post(
        "/v1/vault/seal",
        headers={"X-API-Key": raw_key},
        json={
            "network": "testnet",
            "challenge_id": challenge["challenge_id"],
            "wallet_address": owner.address,
            "signature_kind": "eip191",
            "message": challenge["message"],
            "signature": _sign_message(owner.key, challenge["message"]),
            "plaintext": "tenant-bound payload",
            "mime_type": "text/plain",
        },
    )
    assert sealed.status_code == 200

    dashboard = client.get(
        "/v1/admin/dashboard",
        headers={"X-Master-Key": "test-master-key"},
    )
    assert dashboard.status_code == 200
    dashboard_payload = dashboard.json()
    assert dashboard_payload["total_api_keys"] == 1
    assert dashboard_payload["total_requests"] >= 2
    assert dashboard_payload["top_apps"][0]["app_name"] == "Acme Dev SDK"

    listed = client.get(
        "/v1/admin/api-keys",
        headers={"X-Master-Key": "test-master-key"},
    )
    assert listed.status_code == 200
    assert listed.json()["items"][0]["total_requests"] >= 2

    revoked = client.post(
        f"/v1/admin/api-keys/{key_id}/revoke",
        headers={"X-Master-Key": "test-master-key"},
    )
    assert revoked.status_code == 200

    rejected = client.post(
        "/v1/auth/challenge",
        headers={"X-API-Key": raw_key},
        json={
            "operation": "seal",
            "network": "testnet",
            "wallet_address": owner.address,
        },
    )
    assert rejected.status_code == 401
