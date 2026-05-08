# Military-Grade API Marketplace

This folder isolates YieldBoost API Store products from the UI and core optimizer.

## YieldBoost 9-Layer Stack

The 9-layer military-grade stack is YieldBoost-owned infrastructure. Partner SDKs can be wrapped by it, while the verification layer itself remains standalone.

The marketplace can expose the complete stack as one endpoint or expose each layer individually, but the core verification path remains independent:

1. Hallucination Blacklist
2. Integrity Auditor
3. Secure Compute / TEE
4. Sovereign Memory
5. 0G Storage Proof Layer
6. Zero-Knowledge Proof Layer
7. ProofRegistry Anchor
8. Programmable Governance
9. Cross-Agent Neural Handshake

## VeilSolver Secure Proxy

VeilSolver Secure Proxy is a partner SDK example. YieldBoost wraps the partner solver with isolated execution, ZK proof packaging, and 0G anchoring so developers can call it through the same security envelope used by the API Store.

The standalone YieldBoost 9-layer stack powers Judge Mode, 1-click optimize, vault proofs, and Strategy Agent NFT proofs; VeilSolver shows how a partner solver can plug into that protection model.

Developer flow:

1. Subscriber calls `POST /api/marketplace/veilsolver` with a YieldBoost API key.
2. YieldBoost validates the key and subscription tier.
3. If `E2B_API_KEY` is configured, the request is proxied from inside an E2B sandbox.
4. The sandbox forwards the payload to `https://veilresolver.onrender.com`.
5. YieldBoost stamps a Layer-9 ZK proof digest and returns a 0G anchor URL.
6. Developer receives a single response envelope with `security: "9-Layer Verified"`.

Local playground: `/veilsolver`

Production alias target: `/v1/agent/veilsolver`
