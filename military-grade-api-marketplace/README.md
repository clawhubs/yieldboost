# Military-Grade API Marketplace

This folder isolates YieldBoost API Store products from the UI and core optimizer.

## YieldBoost 9-Layer Stack

The 9-layer military-grade stack is YieldBoost-owned infrastructure. It is not borrowed from VeilSolver or any partner SDK.

The marketplace can expose the complete stack as one endpoint or expose each layer individually, but the core verification path remains independent:

1. Wallet/proof snapshot
2. 0G Compute evidence
3. Integrity Auditor
4. 0G Storage CID
5. ProofRegistry anchor
6. Sovereign Memory
7. ZK Reasoning envelope
8. Governance and policy seal
9. Neural Handshake evidence

## VeilSolver Secure Proxy

VeilSolver Secure Proxy is a partner SDK example. YieldBoost wraps the partner solver with isolated execution, ZK proof packaging, and 0G anchoring so developers can call it through the same security envelope used by the API Store.

VeilSolver is not required for the standalone YieldBoost 9-layer stack, Judge Mode, 1-click optimize, vault proofs, or Strategy Agent NFT proofs.

Developer flow:

1. Subscriber calls `POST /api/marketplace/veilsolver` with a YieldBoost API key.
2. YieldBoost validates the key and subscription tier.
3. If `E2B_API_KEY` is configured, the request is proxied from inside an E2B sandbox.
4. The sandbox forwards the payload to `https://veilresolver.onrender.com`.
5. YieldBoost stamps a Layer-9 ZK proof digest and returns a 0G anchor URL.
6. Developer receives a single response envelope with `security: "9-Layer Verified"`.

Local playground: `/veilsolver`

Production alias target: `/v1/agent/veilsolver`
