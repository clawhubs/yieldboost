# YieldBoost AI

Autonomous AI-powered DeFi yield optimization dashboard built with `Next.js 15`, `React 19`, `Tailwind v4`, `Recharts`, `framer-motion`, and 0G-oriented proof flows.

## Overview

YieldBoost AI is a yield optimization platform that combines AI-driven recommendations with verifiable proof storage on 0G Network. Each optimization can be stored as a proof on 0G Storage, optionally anchored on-chain via ProofRegistry, and minted as a tradable Agent NFT with encrypted metadata.

### Key Features

- **AI-Powered Optimization**: Multi-provider inference with 0G Compute (TEE-verified), Alibaba Qwen, and OpenAI fallbacks
- **Verifiable Proofs**: All optimization results stored on 0G Storage with on-chain anchoring via ProofRegistry
- **TEE Verification**: Hardware-enforced privacy and attestation for trusted inference when using 0G Compute
- **Strategy as INFT**: Mint yield strategies as tradable Agent NFTs with encrypted metadata and authorization
- **Multi-Network Support**: Testnet and mainnet support for 0G Network with wallet connection
- **Judge Mode**: `/judge` provides a no-wallet review path with live runtime status, proof metadata, env readiness, and mainnet cutover notes
- **Transparent Fallbacks**: Graceful degradation when providers are unavailable

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Agent Page  │  │ Agent Gallery│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ /api/agent/      │  │ /api/0g/         │  │ /api/agent/  │ │
│  │   optimize       │  │   store          │  │   mint/list  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┘ │
└───────────┼──────────────────┼─────────────────────────────────┘
            │                  │
            ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      0G Network Integration                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ 0G Compute       │  │ 0G Storage       │  │ ProofRegistry│ │
│  │ (TEE-verified)   │  │ (Encrypted)      │  │ (On-chain)   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 0G Components

- **0G Compute Network**: TEE-verified inference for trusted AI recommendations
- **0G Storage**: Decentralized storage for encrypted strategy metadata and proof records
- **ProofRegistry**: Optional on-chain anchoring for proof verification and indexing
- **YieldStrategyINFT**: ERC-721 compliant contract for minting strategies as Agent NFTs

### Inference Provider Priority

1. **0G Compute (TEE)**: Highest priority, hardware-enforced privacy with attestation
2. **Alibaba Qwen**: OpenAI-compatible inference via DashScope
3. **OpenAI gpt-4o-mini**: Fallback narrative generation
4. **Deterministic**: Built-in templates when all providers unavailable

## Environment

Create `.env.local` for local development, then mirror the same categories into Vercel.

### Required for judge + testnet demo

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_WALLET_ADDRESS=0x...

NEXT_PUBLIC_0G_TESTNET_CHAIN_ID=16602
NEXT_PUBLIC_0G_TESTNET_CHAIN_NAME=0G Galileo Testnet
NEXT_PUBLIC_0G_EXPLORER_BASE_URL=https://chainscan-galileo.0g.ai
NEXT_PUBLIC_ZG_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_ZG_STORAGE=https://indexer-storage-testnet-turbo.0g.ai

ZG_NETWORK_KEY=testnet
ZG_RPC_URL=https://evmrpc-testnet.0g.ai
ZG_STORAGE_URL=https://indexer-storage-testnet-turbo.0g.ai
ZG_PRIVATE_KEY=<testnet_storage_signer>
ZG_PROOF_REGISTRY_ADDRESS=<optional_testnet_registry>
```

### Optional but recommended

```env
ZG_COMPUTE_PROVIDER_ADDRESS=0x...
ZG_LEDGER_PRIVATE_KEY=<compute_or_contract_signer>
YIELD_STRATEGY_INFT_ADDRESS=<agent_nft_contract>
KV_REST_API_URL=<vercel_kv_url>
KV_REST_API_TOKEN=<vercel_kv_token>
UPSTASH_REDIS_REST_URL=<upstash_url>
UPSTASH_REDIS_REST_TOKEN=<upstash_token>
ALIBABA_API_KEY=<dashscope_api_key>
OPENAI_API_KEY=<openai_api_key>
E2B_API_KEY=<e2b_api_key>
```

### Mainnet cutover envs

```env
NEXT_PUBLIC_0G_MAINNET_CHAIN_ID=<mainnet_chain_id>
NEXT_PUBLIC_0G_MAINNET_CHAIN_NAME=0G Mainnet
NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL=https://chainscan.0g.ai
NEXT_PUBLIC_0G_MAINNET_RPC=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_MAINNET_STORAGE=<mainnet_storage_endpoint>

ZG_NETWORK_KEY=mainnet
ZG_MAINNET_RPC_URL=https://evmrpc.0g.ai
ZG_MAINNET_STORAGE_URL=<mainnet_storage_endpoint>
ZG_MAINNET_PRIVATE_KEY=<mainnet_storage_signer>
ZG_MAINNET_PROOF_REGISTRY_ADDRESS=<mainnet_registry_contract>
```

### Fallback behavior

- If 0G Compute is missing or underfunded, optimization narration falls back to the deterministic/local path and the UI keeps running.
- If 0G Storage or the indexer fails, the optimization result is still shown, but the app surfaces the proof-sync blocker honestly instead of pretending a proof was written.
- If `YIELD_STRATEGY_INFT_ADDRESS` is missing, `/agents` falls back to proof-backed runtime history.
- If Vercel KV is missing, runtime proof history falls back to `.artifacts/runtime-store.json`.

## Mainnet Checklist

1. Set the public mainnet chain/env values so wallet switching and explorer labels are correct.
2. Set `ZG_MAINNET_STORAGE_URL` and `ZG_MAINNET_PRIVATE_KEY` for mainnet proof writes.
3. Deploy or confirm the mainnet ProofRegistry, then set `ZG_MAINNET_PROOF_REGISTRY_ADDRESS`.
4. Point `ZG_NETWORK_KEY=mainnet` only after the previous steps are complete.
5. Set the final `YIELD_STRATEGY_INFT_ADDRESS` in the mainnet deployment environment if agent contract mode is required.

## Local Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
npx playwright test tests/dashboard.spec.ts tests/audit.spec.ts tests/docs.spec.ts
npx playwright test tests/live-smoke.spec.ts
```

## Documentation

Comprehensive documentation is available in the app at `/docs`:
- **Overview**: Product pitch and target users
- **Getting Started**: Quick start guide
- **How 1-Click Works**: Optimization flow explanation
- **0G Integration**: Detailed 0G Network usage
- **Strategy as INFT**: Agent NFT and minting guide
- **Judge Mode**: Review path for judges and wallet-free demos
- **Architecture**: Technical implementation details

## Smart Contracts

Smart contracts are located in `/contracts`:
- `YieldStrategyINFT.sol`: ERC-721 compliant Strategy NFT contract
- `MockOracle.sol`: Mock oracle for TEE verification testing

For deployment instructions, see `/contracts/README.md`.

## Notes

- The original plan requested incremental PPR, but `Next.js 15.2.x` stable does not allow `experimental.ppr`; the app stays on stable Next 15 as requested and uses Suspense-based loading instead.
- Build can emit a harmless warning from the `@e2b/code-interpreter` package during bundling.
- TEE verification requires OG tokens from faucet for provider acknowledgment on 0G Compute Network.

## License

MIT
