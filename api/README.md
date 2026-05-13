# YieldBoost AI Integrity API

FastAPI service for `api.yieldboostai.xyz`.

This service exposes the **public product surface** behind YieldBoost AI Protocol and TITAN X: the 10-layer integrity stack, the standalone security modules, and the health/status routes used by external integrators.

Internal helpers, compatibility transports, and founder-only admin routes are intentionally left out of this document because the public API should describe **what is sold and integrated**, not every internal path that exists behind the platform.

## Public API surface

- `POST /v1/integrity/seal`
- `POST /v1/integrity/unseal`
- `GET /v1/integrity/records?wallet_address=0x...&network=mainnet`
- `GET /v1/integrity/{storage_id}/metadata`
- `POST /v1/blacklist/check`
- `POST /v1/audit/evaluate`
- `POST /v1/proof/run`
- `POST /v1/governance/evaluate`
- `POST /v1/handshake/log`
- `GET /v1/status/layers`
- `GET /v1/health`

## What this service represents

- **Integrity endpoints**: the full 10-layer TITAN X path for sealing, unsealing, and reading sanitized proof metadata.
- **Standalone modules**: blacklist, audit, proof, governance, and handshake exposed as productized security services.
- **Platform status**: health and layer-readiness views for integrators who need live infrastructure visibility.

## Run locally

```bash
uv run --project api python -m uvicorn api.app.main:app --host 0.0.0.0 --port 8010 --reload
```

Environment scaffolding lives in [`api/.env.example`](./.env.example).

## Integration order

1. Create or obtain a managed API key from the developer store.
2. Store the raw key in a secret manager.
3. Call the public API surface with `X-API-Key`.
4. Use wallet authorization where the integrity flow requires end-user ownership proof.

## Notes

- The service is **public-surface first**. Internal helper routes may still exist in code for compatibility or operations, but they are not the product story.
- The default API base is `https://api.yieldboostai.xyz`.
- The flagship web product remains `https://yieldboostai.xyz`.
- The commercial store remains `https://dev.yieldboostai.xyz`.
