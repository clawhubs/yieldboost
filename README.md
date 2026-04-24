# YieldBoost AI

Autonomous AI-powered DeFi yield optimization dashboard built with `Next.js 15`, `React 19`, `Tailwind v4`, `Recharts`, `framer-motion`, and 0G-oriented proof flows.

## What is inside

- Dashboard with KPI cards, live optimization banner, chart, proof modal, and AI decision log.
- AI Agent page with streaming optimization flow, progress tracker, and result card.
- Server routes for optimization and mock-safe 0G storage receipts.
- Middleware rate limiting for all `/api/*` routes.
- Responsive sidebar and placeholder pages for the rest of the workspace sections.

## Environment

Create `.env.local` and add the values you have:

```env
E2B_API_KEY=
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ZG_PRIVATE_KEY=
NEXT_PUBLIC_ZG_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_ZG_STORAGE=https://indexer-storage-testnet-standard.0g.ai
NEXT_PUBLIC_0G_TESTNET_CHAIN_ID=16602
NEXT_PUBLIC_0G_TESTNET_CHAIN_NAME="0G Galileo Testnet"
NEXT_PUBLIC_0G_MAINNET_CHAIN_ID=
NEXT_PUBLIC_0G_MAINNET_CHAIN_NAME="0G Mainnet"
NEXT_PUBLIC_0G_MAINNET_RPC=
NEXT_PUBLIC_0G_MAINNET_STORAGE=
NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL=
ZG_MAINNET_RPC_URL=
ZG_MAINNET_STORAGE_URL=
ZG_MAINNET_PRIVATE_KEY=
ZG_MAINNET_PROOF_REGISTRY_ADDRESS=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_APP_URL=http://localhost:3020
```

If `E2B_API_KEY` or `OPENAI_API_KEY` is missing, the app falls back to a deterministic mock optimization so the UI still works locally.

Wallet login now supports common injected wallets such as MetaMask, Rabby, Coinbase Wallet, Trust Wallet, and OKX Wallet. The sidebar network switch uses the configured testnet/mainnet RPC settings above.

## Local run

```bash
npm install
PORT=3020 npm run dev
```

Then open `http://localhost:3020`.

## Verification

- `npm run lint`
- `npm run build`

## Notes

- The original plan requested incremental PPR, but `Next.js 15.2.x` stable does not allow `experimental.ppr`; the app stays on stable Next 15 as requested and uses Suspense-based loading instead.
- Build can emit a harmless warning from the `@e2b/code-interpreter` package during bundling.
