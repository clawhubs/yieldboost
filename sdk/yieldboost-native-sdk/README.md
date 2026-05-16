# YieldBoost Native SDK

Internal first-party native SDK package for YieldBoost AI Protocol.

This package collects the **internal product and split-layer wrappers** that
match the live marketplace cards:

- TITAN X 10-Layer API
- AWS Nitro Fortress SDK
- Anti-Sybil + ZK + Alibaba Fingerprinting
- split layer wrappers such as Hallucination Blacklist, Integrity Auditor,
  Secure Compute / TEE, Sovereign Memory, 0G Storage Proof Layer,
  Zero-Knowledge Proof Layer, ProofRegistry Anchor, Programmable Governance,
  and Cross-Agent Neural Handshake

This package is intentionally different from:

- [`../yieldboost-ai-sdk`](../yieldboost-ai-sdk) — the broader official SDK
- [`../../military-grade-api-marketplace/sdk`](../../military-grade-api-marketplace/sdk) —
  the marketplace folder, which can still hold product-local wrappers and
  future partner-facing examples such as VeilSolver

## What This Package Is For

Use `yieldboost-native-sdk` when you want:

- a product-oriented SDK story for the store
- per-product wrappers that map directly to marketplace cards
- split-layer wrappers for internal YieldBoost-native security surfaces

## What It Does Not Include

This package does **not** include partner wrappers such as VeilSolver.
Partner wrappers stay in the marketplace folder because they are not part of
the internal first-party SDK set.

## Example

```ts
import {
  createTitanXClient,
  createAntiSybilFingerprintClient,
  createIntegrityAuditorClient,
} from "yieldboost-native-sdk";

const titan = createTitanXClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
});

const result = await titan.run({
  payload: {
    walletAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
    network: "mainnet",
    intent: "run the full TITAN X path",
  },
});

console.log(result);
```
