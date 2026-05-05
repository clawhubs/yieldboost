# YieldBoost AI 9-Layer Integrity API

FastAPI service untuk `api.yieldboostai.xyz` yang menjalankan 9-layer integrity pipeline secara async dan terpisah dari app Next.js utama.

Mode operasional yang disarankan saat ini: `testnet-first, mainnet-ready`.

## Public Endpoint Surface

- `POST /v1/integrity/seal`
- `POST /v1/integrity/unseal`
- `GET /v1/integrity/records?wallet_address=0x...&network=testnet`
- `GET /v1/integrity/{storage_id}/metadata`
- `POST /v1/blacklist/check`
- `POST /v1/audit/evaluate`
- `POST /v1/proof/run`
- `POST /v1/governance/evaluate`
- `POST /v1/handshake/log`
- `GET /v1/status/layers`
- `GET /v1/health`

## Internal / Compatibility Surface

- `POST /v1/auth/challenge`
- `POST /v1/vault/seal`
- `POST /v1/vault/unseal`
- `GET /v1/vault?wallet_address=0x...&network=testnet`
- `GET /v1/vault/{storage_id}/metadata`
- `GET /v1/admin/public-stats`
- `GET /v1/admin/stats`
- `GET /v1/admin/dashboard`
- `GET /v1/admin/api-keys`
- `POST /v1/admin/api-keys`
- `POST /v1/admin/api-keys/{key_id}/revoke`

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
- Auth production-beta masih memakai challenge satu kali pakai di belakang layar. Surface publik sekarang diarahkan ke `/v1/integrity/*`, sementara helper challenge dipertahankan sebagai mekanisme internal / low-level compatibility.
- Managed API keys sekarang bisa dibuat dan direvoke lewat admin surface. Praktik yang disarankan: satu API key per developer app, sementara end-user tetap memakai wallet signature sebagai sumber ownership.
- Managed API keys sekarang membawa scope platform. Default key baru bisa mengakses integrity, audit, blacklist, proof, governance, handshake, dan status surface.
- Developer portal UI disiapkan terpisah di Next.js route `/dev` agar nantinya mudah dipetakan ke `dev.yieldboostai.xyz` tanpa mencampur UI developer dengan app utama atau API machine surface.
- Raw managed API key hanya dikembalikan satu kali saat dibuat. Server menyimpan representasi hash saja, jadi jika partner kehilangan raw key maka recovery yang benar adalah revoke lalu mint key baru.
- SDK TypeScript resmi sekarang tersedia di `sdk/yieldboost-ai-sdk` sebagai source-ready package yang bisa dipublish atau langsung di-vendor ke app partner.

## Integrasi yang disarankan

Urutan untuk developer partner:

1. Login ke `dev.yieldboostai.xyz` dengan wallet.
2. Buat satu managed API key per app dari dashboard.
3. Simpan raw key di secret manager partner.
4. Saat user akhir memakai integrity flow, app atau SDK menyiapkan wallet authorization.
5. User sign authorization dengan wallet mereka.
6. App partner kirim request platform seperti `integrity/seal`, `audit/evaluate`, atau `proof/run` dengan `X-API-Key` yang sesuai scope.

Pembagian identity:

- API key = identitas app partner
- wallet login portal = identitas developer/operator
- wallet signature `seal/unseal` = identitas pemilik integrity record

## SDK dan contoh kode

Source SDK TypeScript ada di `sdk/yieldboost-ai-sdk`.

Contoh server Node:

```ts
import { YieldBoostClient, sealWithSigner } from "yieldboost-ai-sdk";
import { Wallet } from "ethers";

const client = new YieldBoostClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
  baseUrl: "https://api.yieldboostai.xyz",
});

const signer = new Wallet(process.env.TEST_WALLET_PRIVATE_KEY!);

const sealed = await sealWithSigner(client, signer, {
  network: "testnet",
  plaintext: "confidential payload",
  metadata: {
    tenant: "acme-app",
    purpose: "proof-archive",
  },
});
```

Contoh browser wallet:

```ts
import { YieldBoostClient, sealWithBrowserWallet } from "yieldboost-ai-sdk";

const client = new YieldBoostClient({
  apiKey: import.meta.env.VITE_YIELDBOOST_API_KEY,
});

const sealed = await sealWithBrowserWallet(client, {
  provider: window.ethereum,
  network: "testnet",
  plaintext: "wallet-owned secret",
});
```

## Kontrak API ringkas

### `POST /v1/integrity/seal`

```json
{
  "network": "testnet",
  "wallet_address": "0xabc...",
  "signature_kind": "eip191",
  "message": "Seal integrity request for app example",
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

### `POST /v1/integrity/unseal`

```json
{
  "wallet_address": "0xabc...",
  "signature_kind": "eip712",
  "message": "Unseal integrity request for app example",
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

### `GET /v1/integrity/{storage_id}/metadata`

```json
{
  "storage_id": "vault_...",
  "integrity_hash": "7d8c...",
  "storage_tx_hash": "0x...",
  "anchor_tx_hash": "0x..."
}
```

### `GET /v1/integrity/records`

List sanitized integrity records for a wallet:

`GET /v1/integrity/records?wallet_address=0x...&network=testnet`

### Internal helpers

- `POST /v1/auth/challenge` tetap ada untuk low-level auth flow
- `POST /v1/vault/*` tetap ada untuk compatibility transport
- `GET /v1/admin/*` tetap ada untuk founder/developer portal

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
