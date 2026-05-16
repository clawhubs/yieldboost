# SDK Directory

This directory holds the **official first-party SDK source** for YieldBoost AI.

Right now, the root `sdk/` folder contains two SDK packages:

- [`yieldboost-ai-sdk/`](./yieldboost-ai-sdk) — the broader TypeScript client
  for the YieldBoost AI Protocol surface
- [`yieldboost-native-sdk/`](./yieldboost-native-sdk) — internal
  first-party native wrappers for TITAN X, split packages, and split
  layers

## What Lives Here vs Elsewhere

Use this quick rule:

- if you want the **official broader SDK**, start in
  [`./yieldboost-ai-sdk`](./yieldboost-ai-sdk)
- if you want **internal native wrappers** that mirror marketplace
  cards, use [`./yieldboost-native-sdk`](./yieldboost-native-sdk)
- if you want **product-local or future partner wrappers**, use
  [`../military-grade-api-marketplace/sdk`](../military-grade-api-marketplace/sdk)
- if you want **product manifests** that mirror the marketplace UI, use
  [`../military-grade-api-marketplace/products`](../military-grade-api-marketplace/products)

## Recommended Reading Order

1. [`./yieldboost-ai-sdk/README.md`](./yieldboost-ai-sdk/README.md)
2. [`./yieldboost-native-sdk/README.md`](./yieldboost-native-sdk/README.md)
3. [`../military-grade-api-marketplace/README.md`](../military-grade-api-marketplace/README.md)

That split is intentional:

- `sdk/` = official reusable SDK package
- `sdk/yieldboost-native-sdk/` = internal native wrapper package
- `military-grade-api-marketplace/sdk/` = marketplace-local wrappers and future
  partner examples
- `military-grade-api-marketplace/products/` = marketplace catalog manifests

## Which One Should I Use?

### Use `sdk/yieldboost-ai-sdk`

When you want:

- the official broader client
- one package for auth, seal/unseal, metadata, proof, governance, handshake,
  and health surfaces
- something you could vendor or publish as `yieldboost-ai-sdk`

### Use `sdk/yieldboost-native-sdk`

When you want:

- one wrapper per marketplace product
- product-specific examples such as `createTitanXClient`
- split-layer wrappers such as `createIntegrityAuditorClient`

### Use `military-grade-api-marketplace/sdk`

When you want:

- marketplace-local wrappers that stay close to product manifests
- future partner-facing examples
- partner wrappers such as `createVeilSolverClient`

## Naming Boundary

- **YieldBoost AI Protocol** = broader commercial platform
- **yieldboost-ai-sdk** = official SDK package for that broader platform
- **yieldboost-native-sdk** = internal first-party native SDK package
- **marketplace-local wrappers** = product-level adapters kept close to the
  marketplace folder, especially for partner wrappers
