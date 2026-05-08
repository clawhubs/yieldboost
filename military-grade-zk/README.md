# YieldBoost Sentinel Layer

This folder is intentionally isolated from the Next.js UI, Python API, and
Solidity contracts. It contains the first real ZK micro-circuit for YieldBoost:
`agent_identity`.

The circuit proves one narrow claim:

> The optimizer knows the private identity material for the connected agent
> wallet and binds that proof to one action context, without exposing the
> private material in the public proof statement.

This is not a zkVM. It is a small Noir circuit designed for local proving on a
normal machine.

## Local Toolchain

Install Noir and Barretenberg:

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
bbup
```

This repo was first checked with:

```bash
nargo version = 1.0.0-beta.20
bb version = 5.0.0-nightly.20260324
```

## Circuit Commands

From `military-grade-zk/circuits/agent_identity`:

```bash
nargo check
nargo execute sentinel_account_1 -p Prover.account1
bb prove -b target/agent_identity.json -w target/sentinel_account_1.gz -o target --write_vk --verify -t evm
```

`Prover.*.toml` files are local-only and may contain derived witness material.
Do not commit them.

## App Integration

The Next.js proof storage route can attach a Sentinel proof artifact when these
env vars are set:

```bash
YB_SENTINEL_ENABLED=true
YB_SENTINEL_WALLET_KEY_FILE="/home/cucu/Coder/Private key wallet/private"
YB_SENTINEL_RUN_NARGO=true
```

For Playwright, two funded 0G testnet accounts can be read from that wallet
file and exercised without using judge/demo mode.
