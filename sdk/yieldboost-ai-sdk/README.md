# YieldBoost AI SDK

Official TypeScript client scaffold for the YieldBoost AI Protocol 10-Layer Integrity API.

Current status:

- source-ready in this repository
- not yet published to npm
- safe to vendor into partner apps or publish as `yieldboost-ai-sdk`

This is the broader first-party SDK source. The marketplace-facing package
wrappers for TITAN X, AWS Nitro Fortress, Anti-Sybil + ZK + Alibaba
Fingerprinting now also have their own internal package at
[`../yieldboost-native-sdk`](../yieldboost-native-sdk).

Marketplace-local wrappers and partner-oriented examples such as VeilSolver
still live under [`../../military-grade-api-marketplace`](../../military-grade-api-marketplace).

If you started from the root `sdk/` folder and want the directory map first,
see [`../README.md`](../README.md).

## What it covers

- `createChallenge`
- `seal`
- `unseal`
- `getMetadata`
- `listVaults`
- `blacklistCheck`
- `auditEvaluate`
- `proofRun`
- `governanceEvaluate`
- `handshakeLog`
- `layerStatus`
- `health`
- browser wallet helpers
- generic signer helpers for `ethers`-style signers

## Example

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
  plaintext: "proof-backed secret",
  metadata: {
    app: "acme-server",
    purpose: "beta-integration",
  },
});

console.log(sealed.storage_id);
```

## Security note

Managed API keys are only returned in raw form once, at creation time. The platform stores only a hashed representation after that. If a partner loses the raw key, the right recovery move is to rotate and mint a new key.
