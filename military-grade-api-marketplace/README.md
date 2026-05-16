# Military-Grade API Marketplace

This directory contains the product manifests, first-party package wrappers,
partner wrappers, and lightweight delivery examples for the YieldBoost AI
Protocol store.

It should mirror the marketplace story shown in the app:

- first-party YieldBoost packages sold in the store
- split layer endpoints sold as modular surfaces
- partner SDK wrappers sold beside the YieldBoost-native core

## Purpose

The marketplace exposes YieldBoost products in three forms:

- the complete **TITAN X 10-layer API**
- split first-party security packages such as **AWS Nitro Fortress** and
  **Anti-Sybil + ZK + Alibaba Fingerprinting**
- partner SDK wrappers such as **VeilSolver Secure Proxy**

This keeps the core YieldBoost security architecture independent while still
allowing external developer products to plug into the same trust model.

## Directory Map

- [`products/`](./products) — marketplace product manifests that mirror the
  cards shown in the live store
- [`products/index.json`](./products/index.json) — quick catalog for full
  packages, split layers, and partner wrappers
- [`sdk/`](./sdk) — lightweight wrappers for first-party packages, split
  layers, and partner wrappers
- [`../lib/military-grade-api-marketplace.ts`](../lib/military-grade-api-marketplace.ts) —
  app-level source of truth for the live marketplace UI

If you want the full public TypeScript SDK instead of these store-oriented
wrappers, use [`../sdk/yieldboost-ai-sdk`](../sdk/yieldboost-ai-sdk).

## YieldBoost 10-Layer Core

The flagship YieldBoost-native product is **TITAN X**, which packages these ten
layers into one live trust path:

1. Hallucination Blacklist
2. Integrity Auditor
3. Secure Compute / TEE
4. Sovereign Memory
5. 0G Storage Proof Layer
6. Zero-Knowledge Proof Layer
7. ProofRegistry Anchor
8. Programmable Governance
9. Cross-Agent Neural Handshake
10. AWS Nitro Enclaves

The marketplace can expose that core in two ways:

- one full TITAN X endpoint
- split package or single-layer endpoints for modular adoption

## First-Party Packages In This Directory

This directory now reflects the same first-party products shown in the live
store:

- **TITAN X 10-Layer API** — full core package
- **AWS Nitro Fortress SDK** — Layer 10 continuity sold as its own module
- **Anti-Sybil + ZK + Alibaba Fingerprinting** — abuse-resistance package sold
  beside TITAN X

Their lightweight client wrappers live in [`sdk/`](./sdk), while the official
broader SDK source lives in [`../sdk/yieldboost-ai-sdk`](../sdk/yieldboost-ai-sdk).

## Split Layers

The live store also sells the YieldBoost-native layers separately. Those are
represented in the main app metadata under
[`lib/military-grade-api-marketplace.ts`](../lib/military-grade-api-marketplace.ts).

This directory now includes wrapper files for the split layers as well, so it
clearly shows that the store supports all three adoption paths:

- full-package adoption
- split-package adoption
- single-layer adoption

## How To Use This Folder

Use this directory in two passes:

1. Read a manifest in [`products/`](./products) to understand what the store is
   selling.
2. Use the matching wrapper in [`sdk/`](./sdk) when you want to call that
   package or layer from code.

The wrappers are intentionally small. They are useful when you want:

- a clear per-product integration surface
- a repo-local example that matches the marketplace card
- a thinner adapter than the broader official SDK

## Quick Start

### 1. Pick a product

Examples:

- full package: [`products/titan-x-10-layer-api.json`](./products/titan-x-10-layer-api.json)
- split security package:
  [`products/aws-nitro-fortress.json`](./products/aws-nitro-fortress.json)
- split layer:
  [`products/integrity-auditor.json`](./products/integrity-auditor.json)
- partner wrapper: [`products/veilsolver.json`](./products/veilsolver.json)

### 2. Import the matching wrapper

All wrappers are re-exported from [`sdk/index.ts`](./sdk/index.ts).

```ts
import {
  createTitanXClient,
  createIntegrityAuditorClient,
  createVeilSolverClient,
} from "./sdk/index";
```

### 3. Call the package or layer

#### Full package: TITAN X

```ts
import { createTitanXClient } from "./sdk/index";

const client = createTitanXClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
});

const result = await client.run({
  payload: {
    walletAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
    network: "mainnet",
    intent: "run the full TITAN X verification path",
  },
});
```

#### Split layer: Integrity Auditor

```ts
import { createIntegrityAuditorClient } from "./sdk/index";

const client = createIntegrityAuditorClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
});

const result = await client.audit({
  payload: {
    walletAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
    proposedApy: 12.8,
    recommendedProtocol: "SaucerSwap LP",
  },
});
```

#### Partner wrapper: VeilSolver

```ts
import { createVeilSolverClient } from "./sdk/index";

const client = createVeilSolverClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
});

const result = await client.solve({
  intent: "private swap route search",
  chainId: 16661,
  payload: {
    tokenIn: "0x0000000000000000000000000000000000000000",
    tokenOut: "0x0000000000000000000000000000000000000000",
    amountIn: "1.0",
  },
});
```

## Which Wrapper To Pick

- Use **`createTitanXClient`** when you want the full 10-layer path.
- Use **package wrappers** such as
  **`createAwsNitroFortressClient`** or
  **`createAntiSybilFingerprintClient`**
  when you want one store module sold beside TITAN X.
- Use **split layer wrappers** when you want one callable layer from the TITAN X
  family.
- Use **`createVeilSolverClient`** only when you explicitly want the partner
  wrapper path, not the YieldBoost-native core.

## Partner Wrappers

Partner SDKs are treated as wrapped products, not as the core system itself.
When a partner integration is listed in the marketplace, YieldBoost applies its
own execution controls, proof packaging, and 0G anchoring around the partner
request before returning the final response to the subscriber.

## VeilSolver Secure Proxy

VeilSolver Secure Proxy is the reference partner wrapper in this directory. It
demonstrates how a third-party solver can be routed through isolated execution,
wrapped in a ZK-backed response envelope, and returned through the same
verification-oriented developer surface used by native YieldBoost products.

Important boundary:

- **VeilSolver is not the TITAN X core**
- it is a partner wrapper with **selected YieldBoost protections**
- the full 10-layer YieldBoost-native path remains a separate first-party
  product

## Notes On Naming

- **YieldBoost AI Protocol** = the broader commercial platform
- **TITAN X** = the flagship 10-layer first-party product
- **split layers** = individually callable pieces of the TITAN X family
- **partner wrappers** = non-core products protected by selected YieldBoost
  controls

## Repository Scope

This directory is intended to hold:

- marketplace product manifests
- first-party package wrappers
- partner SDK client wrappers
- product-specific docs and examples
- marketplace-facing verification delivery logic

It should not be used for unrelated UI-only experiments or ad hoc test notes.
