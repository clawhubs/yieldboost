# YieldBoost Integrity API

FastAPI service untuk `api.yieldboostai.xyz` yang menjalankan 9-layer integrity pipeline secara async dan terpisah dari app Next.js utama.

Mode operasional yang disarankan saat ini: `testnet-first, mainnet-ready`.

## Endpoint

- `POST /v1/auth/challenge`
- `POST /v1/vault/seal`
- `POST /v1/vault/unseal`
- `GET /v1/vault?wallet_address=0x...&network=testnet`
- `GET /v1/vault/{storage_id}/metadata`
- `GET /v1/admin/public-stats`
- `GET /v1/admin/stats`
- `GET /v1/health`

## Jalankan lokal

```bash
uv run --project api python -m uvicorn api.app.main:app --host 0.0.0.0 --port 8010 --reload
```

Template env simetris untuk `testnet` dan `mainnet` tersedia di [`api/.env.example`](./.env.example).

## Catatan

- Sandbox E2B dibuat per request dan selalu di-kill di blok `finally`.
- Jika E2B atau 0G belum dikonfigurasi penuh, service tetap hidup dengan status health `degraded` dan fallback lokal yang jujur.
- Local fallback store ditulis ke `.artifacts/integrity-api-store.local.json`.
- Semua percobaan seal/unseal ditulis ke `security_logs`; jika `SECURITY_LOGS_DATABASE_URL` atau `DATABASE_URL` terisi, API juga membuat/mengisi tabel PostgreSQL/Supabase dari `api/migrations/001_security_logs.sql`.
- Default network dikontrol oleh `INTEGRITY_API_NETWORK`. Gunakan `testnet` dulu untuk integrasi, lalu aktifkan `mainnet` saat flow sudah stabil.
- Auth production-beta memakai challenge satu kali pakai. Klien harus meminta challenge dulu, lalu menandatangani message untuk `seal`; `unseal` mendukung EIP-712 typed data yang mengikat `challenge_id`, wallet, network, dan `storage_id`.

## Kontrak API ringkas

### `POST /v1/auth/challenge`

```json
{
  "operation": "seal",
  "network": "testnet",
  "wallet_address": "0xabc..."
}
```

Respons mengandung `challenge_id`, `message`, `issued_at`, dan `expires_at`. Message itu yang wajib ditandatangani wallet.

### `POST /v1/vault/seal`

```json
{
  "challenge_id": "chl_...",
  "wallet_address": "0xabc...",
  "signature_kind": "eip191",
  "message": "Seal vault request for app example",
  "signature": "0x...",
  "plaintext": "secret payload",
  "mime_type": "text/plain",
  "transaction_hash": "0x...",
  "metadata": {
    "tenant": "demo-app",
    "purpose": "backup"
  }
}
```

Respons:

```json
{
  "success": true,
  "request_id": "req_...",
  "network": "testnet",
  "storage_id": "vault_...",
  "storage_root_hash": "0x...",
  "storage_tx_hash": "0x...",
  "storage_explorer_url": "https://chainscan-galileo.0g.ai/tx/0x...",
  "integrity_hash": "7d8c...",
  "judge_url": "https://yieldboostai.xyz/judge?storage_id=vault_...",
  "anchor_tx_hash": "0x...",
  "anchor_explorer_url": "https://chainscan-galileo.0g.ai/tx/0x...",
  "layer_statuses": {
    "L1": "passed",
    "L2": "passed",
    "L3": "sealed:local-fallback",
    "L5": "0g-testnet",
    "L7": "0g-testnet"
  }
}
```

### `POST /v1/vault/unseal`

```json
{
  "challenge_id": "chl_...",
  "wallet_address": "0xabc...",
  "signature_kind": "eip712",
  "message": "Unseal vault request for app example",
  "typed_data": {
    "domain": {
      "name": "YieldBoost Integrity API",
      "version": "1",
      "chainId": 16602
    },
    "types": {
      "VaultUnseal": [
        {"name": "challengeId", "type": "string"},
        {"name": "challenge", "type": "string"},
        {"name": "operation", "type": "string"},
        {"name": "network", "type": "string"},
        {"name": "wallet", "type": "address"},
        {"name": "storageId", "type": "string"}
      ]
    },
    "primaryType": "VaultUnseal",
    "message": {
      "challengeId": "chl_...",
      "challenge": "YieldBoost Integrity API Challenge...",
      "operation": "unseal",
      "network": "testnet",
      "wallet": "0xabc...",
      "storageId": "vault_..."
    }
  },
  "signature": "0x...",
  "storage_id": "vault_..."
}
```

### `GET /v1/admin/stats`

Founder-only endpoint. Kirim header `x-wallet-address: 0xFounder...`; jika `INTEGRITY_API_KEYS` aktif, sertakan `x-api-key` juga. Respons berisi `total_deflected_attacks`, agregasi failed unseal per wallet, dan `recent_logs`.

### `GET /v1/vault/{storage_id}/metadata`

Mengembalikan metadata aman seperti `wallet_address`, `payload_sha256`, `storage_root_hash`, `storage_tx_hash`, `integrity_hash`, `storage_mode`, `anchor_tx_hash`, dan `last_unsealed_at` tanpa membocorkan plaintext atau ciphertext.

### `GET /v1/health`

Mengembalikan status infrastruktur dan masing-masing layer `L1-L9`, plus `request_id` untuk korelasi log.

## Testing

```bash
cd api
uv run pytest tests -q
```

Nine-wallet unseal challenge smoke:

```bash
uv run --project api python api/scripts/test_nine_wallet_unseal.py
```
