# Military-Grade API Marketplace

This directory contains the product definitions, partner wrappers, and delivery
logic for the YieldBoost developer marketplace. It is intentionally separated
from the main UI and optimizer runtime so marketplace products can evolve as a
modular surface without changing the core proof engine.

## Purpose

The marketplace exposes YieldBoost verification products in two forms:

- the complete 9-layer military-grade verification stack
- individual verification modules that can be consumed one layer at a time
- partner SDK wrappers that are secured by the same YieldBoost proof envelope

This keeps the core YieldBoost security architecture independent while still
allowing external developer products to plug into the same trust model.

## YieldBoost 9-Layer Verification Stack

1. Hallucination Blacklist
2. Integrity Auditor
3. Secure Compute / TEE
4. Sovereign Memory
5. 0G Storage Proof Layer
6. Zero-Knowledge Proof Layer
7. ProofRegistry Anchor
8. Programmable Governance
9. Cross-Agent Neural Handshake

The marketplace may expose the full stack as one endpoint or expose each layer
as a separate API product. In both cases, the underlying verification system
remains YieldBoost-native infrastructure.

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

Reference delivery path:

1. The subscriber calls the YieldBoost marketplace endpoint with a valid API key.
2. YieldBoost validates package scope and access tier.
3. If isolated execution is enabled, the request is forwarded through the
   configured secure execution layer.
4. The partner response is wrapped with YieldBoost proof metadata and 0G anchor
   references.
5. The subscriber receives one response envelope with security status, proof
   metadata, and the partner result payload.

## Repository Scope

This directory is intended to hold:

- marketplace product manifests
- partner SDK client wrappers
- product-specific docs and examples
- marketplace-facing verification delivery logic

It should not be used for unrelated UI-only experiments or ad hoc test notes.
