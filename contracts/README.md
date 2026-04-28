# YieldStrategyINFT Contracts

## Files
- `YieldStrategyINFT.sol` - Main ERC-7857 compliant Strategy NFT contract
- `MockOracle.sol` - Mock oracle for TEE verification testing

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

### Option 3: Direct deployment script (coming soon)
- `scripts/deploy-inft.cjs` - Will be completed with proper compilation setup

## Contract Features

### YieldStrategyINFT
- ERC-721 NFT representing yield strategies
- Encrypted strategy metadata stored on 0G Storage
- TEE verification via oracle (optional)
- Authorization system for strategy usage
- APY tracking in basis points

### MockOracle
- Simple oracle that always returns true for testing
- Used for testnet before real TEE oracle is available

## Environment Variables Needed
```bash
YIELD_STRATEGY_INFT_ADDRESS=<deployed_contract_address>
MOCK_ORACLE_ADDRESS=<deployed_oracle_address>
```

## Next Steps
1. Deploy contracts to 0G testnet
2. Save addresses to `.env.local`
3. Build API routes for minting
4. Create UI for agent gallery
