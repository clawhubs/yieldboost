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

Create `.env.local` and add the values you have:

```env
# 0G Compute Network (TEE)
ZG_COMPUTE_PROVIDER_ADDRESS=0x69Eb5a0BD7d0f4bF39eD5CE9Bd3376c61863aE08
ZG_LEDGER_PRIVATE_KEY=<your_private_key>

# 0G Storage & RPC
ZG_STORAGE_URL=https://indexer-storage-testnet-standard.0g.ai
ZG_RPC_URL=https://evmrpc-testnet.0g.ai
ZG_PRIVATE_KEY=<your_private_key>

# ProofRegistry (optional)
ZG_PROOF_REGISTRY_ADDRESS=<contract_address>

# Strategy INFT (after deployment)
YIELD_STRATEGY_INFT_ADDRESS=<contract_address>
MOCK_ORACLE_ADDRESS=<contract_address>

# Alternative Inference (fallbacks)
ALIBABA_API_KEY=<dashscope_api_key>
OPENAI_API_KEY=<openai_api_key>

# E2B Sandbox (optional, for compute)
E2B_API_KEY=<e2b_api_key>

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL=<upstash_url>
UPSTASH_REDIS_REST_TOKEN=<upstash_token>

# Public URLs
NEXT_PUBLIC_0G_EXPLORER_BASE_URL=https://chainscan-galileo.0g.ai
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required for Full Functionality

- `ZG_COMPUTE_PROVIDER_ADDRESS` + `ZG_LEDGER_PRIVATE_KEY`: TEE-verified inference
- `ZG_STORAGE_URL` + `ZG_RPC_URL` + `ZG_PRIVATE_KEY`: Proof storage
- `YIELD_STRATEGY_INFT_ADDRESS`: Agent NFT minting

### Fallback Behavior

If 0G Compute credentials are missing, the app automatically falls back to Alibaba → OpenAI → deterministic narrative generation, ensuring the UI remains functional.

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
npm run test:ui  # Playwright tests
```

## Documentation

Comprehensive documentation is available in the app at `/docs`:
- **Overview**: Product pitch and target users
- **Getting Started**: Quick start guide
- **How 1-Click Works**: Optimization flow explanation
- **0G Integration**: Detailed 0G Network usage
- **Strategy as INFT**: Agent NFT and minting guide
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

