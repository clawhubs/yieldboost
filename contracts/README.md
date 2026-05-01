# YieldStrategyINFT Contracts

## Files
- `YieldStrategyINFT.sol` - Main ERC-7857 compliant Strategy NFT contract
- `AttestationRegistryOracle.sol` - On-chain registry for broker-verified attestation hashes
- `YieldStrategyAdoptionMarket.sol` - Simple adoption marketplace for enumerable Strategy NFTs
- `MockOracle.sol` - Mock oracle for local testing only

## Deployment Options

### Option 1: Remix (Easiest)
1. Go to https://remix.ethereum.org
2. Create new file and paste `YieldStrategyINFT.sol`
3. Add OpenZeppelin contracts via plugin
4. Compile and deploy to 0G testnet
5. Save address to `.env.local` as `YIELD_STRATEGY_INFT_ADDRESS`

### Option 2: Hardhat (Recommended for production)
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npx hardhat init
# Select "Create a TypeScript project"
# Copy contracts to contracts/
# Configure hardhat.config.ts for 0G testnet
npx hardhat compile
npx hardhat deploy --network 0g_testnet
```

### Option 3: Direct deployment scripts
- `scripts/deploy-inft.cjs`
- `scripts/deploy-attestation-oracle.cjs`
- `scripts/configure-inft-oracle.cjs`

## Contract Features

### YieldStrategyINFT
- ERC-721 Enumerable NFT representing yield strategies
- Encrypted strategy metadata stored on 0G Storage
- TEE verification via oracle (optional, now supported by the AttestationRegistryOracle flow)
- Authorization system for strategy usage
- APY tracking in basis points

### YieldStrategyAdoptionMarket
- Lists Strategy NFTs after the owner approves the marketplace contract
- Lets another wallet adopt a listed strategy through an atomic NFT transfer
- Keeps marketplace custody simple: payment and `safeTransferFrom` happen in the same transaction

### AttestationRegistryOracle
- Stores attestation hashes that already passed broker-backed runtime verification
- Lets `YieldStrategyINFT` mark a minted strategy as `verified=true` on-chain
- Can be configured after deployment without redeploying the INFT contract

### MockOracle
- Simple oracle that always returns true for local testing
- Not recommended for production or hackathon submission proof

## Environment Variables Needed
```bash
YIELD_STRATEGY_INFT_ADDRESS=<deployed_contract_address>
YIELD_STRATEGY_ATTESTATION_ORACLE_ADDRESS=<deployed_oracle_address>
```

## Next Steps
1. Deploy `YieldStrategyINFT`
2. Deploy `AttestationRegistryOracle`
3. Point the INFT contract to the oracle with `setOracle(...)`
4. Deploy `YieldStrategyAdoptionMarket` with the INFT contract address when marketplace adoption should go live
5. Save the addresses to `.env.local` or Vercel envs
