# Contributing

Thanks for helping improve YieldBoost AI. This repo is proof-oriented, so changes should keep the audit trail honest and easy to verify.

## Development Setup

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

For smart contract changes, also run a Solidity compile check:

```bash
npx solcjs --base-path . --include-path node_modules --bin contracts/YieldStrategyINFT.sol contracts/GlobalBlacklistRegistry.sol contracts/ValidationRegistry.sol -o .artifacts/solc-check
```

## Contribution Guidelines

- Do not commit private keys, API keys, seed phrases, or wallet secrets.
- Keep proof flows honest: if 0G Compute, 0G Storage, ProofRegistry, or KV is unavailable, surface that state instead of mocking success.
- Add or update tests when touching `/api/0g/store`, `/api/agent/optimize`, `/api/agent/memory`, `/api/auditor/blacklist`, `/api/stress-test/run`, contracts, or Judge Mode.
- Keep README evidence current when changing externally verifiable CIDs, tx hashes, deployed addresses, or judge-facing proof behavior.
- For Solidity changes, document any migration or redeployment impact in the pull request.

## Pull Request Checklist

- Explain the user-facing or judge-facing impact.
- List the commands you ran.
- Include screenshots for UI changes under `/judge`, proof modal, dashboard, or agent surfaces.
- Note whether the change touches live 0G mainnet/testnet configuration.
