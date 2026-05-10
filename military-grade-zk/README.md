# YieldBoost Military-Grade ZK

This directory contains the Noir-based zero-knowledge components used by
YieldBoost. It is intentionally isolated from the UI and marketplace product
surface so the proof system can be maintained as a standalone verification
layer.

The current circuit is `agent_identity`, a micro-circuit that proves a narrow
and useful claim:

> the optimizer controls the private identity material associated with the
> connected agent wallet and binds that proof to one action context, without
> revealing the private material in the public statement

## Design Choice

YieldBoost uses a compact Noir circuit rather than a zkVM for this layer. The
goal is to keep proving lightweight, reproducible, and practical on standard
hardware while still producing a real zero-knowledge proof artifact that can be
attached to the broader 0G proof pipeline.

## Toolchain

Install Noir and Barretenberg:

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
bbup
```

Verified with:

```bash
nargo version = 1.0.0-beta.20
bb version = 5.0.0-nightly.20260324
```

## Circuit Layout

- `circuits/agent_identity/src/main.nr` — Noir circuit source
- `circuits/agent_identity/Nargo.toml` — circuit package definition
- `circuits/agent_identity/Prover.toml.example` — example witness input format
- `scripts/run-agent-identity-local.mjs` — local helper runner

## Basic Commands

From `military-grade-zk/circuits/agent_identity`:

```bash
nargo check
nargo execute sentinel_account_1 -p Prover.account1
bb prove -b target/agent_identity.json -w target/sentinel_account_1.gz -o target --write_vk --verify -t evm
```

Witness input files may contain derived private material and should not be
committed.

## Application Integration

YieldBoost can attach the `agent_identity` proof artifact to the proof storage
path when the following environment variables are configured:

```bash
YB_SENTINEL_ENABLED=true
YB_SENTINEL_WALLET_KEY_FILE="/home/cucu/Coder/Private key wallet/private"
YB_SENTINEL_RUN_NARGO=true
```

When enabled, the proof pipeline can compile, execute, and attach the Noir
micro-circuit result as part of the broader YieldBoost verification payload.
