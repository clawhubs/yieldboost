# Military-Grade API Marketplace

This folder isolates YieldBoost API Store products from the UI and core optimizer.

## VeilSolver Secure Proxy

Developer flow:

1. Subscriber calls `POST /api/marketplace/veilsolver` with a YieldBoost API key.
2. YieldBoost validates the key and subscription tier.
3. If `E2B_API_KEY` is configured, the request is proxied from inside an E2B sandbox.
4. The sandbox forwards the payload to `https://veilresolver.onrender.com`.
5. YieldBoost stamps a Layer-9 Noir-ready proof digest and returns a 0G anchor placeholder/URL.
6. Developer receives a single response envelope with `security: "9-Layer Verified"`.

Local playground: `/veilsolver`

Production alias target: `/v1/agent/veilsolver`
