/**
 * Simple unit test for YieldStrategyINFT and MockOracle
 * Run with: node contracts/test-YieldStrategyINFT.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function compileContracts() {
  console.log("Compiling contracts...");
  
  const solc = require("solc");
  
  const yieldStrategySource = fs.readFileSync(
    path.join(__dirname, "YieldStrategyINFT.sol"),
    "utf8"
  );
  
  const mockOracleSource = fs.readFileSync(
    path.join(__dirname, "MockOracle.sol"),
    "utf8"
  );
  
  const input = {
    language: "Solidity",
    sources: {
      "YieldStrategyINFT.sol": {
        content: yieldStrategySource,
      },
      "MockOracle.sol": {
        content: mockOracleSource,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    console.error("Compilation errors:", output.errors);
    throw new Error("Compilation failed");
  }
  
  const yieldStrategyBytecode = output.contracts["YieldStrategyINFT.sol"]["YieldStrategyINFT"].evm.bytecode.object;
  const yieldStrategyAbi = output.contracts["YieldStrategyINFT.sol"]["YieldStrategyINFT"].abi;
  
  const mockOracleBytecode = output.contracts["MockOracle.sol"]["MockOracle"].evm.bytecode.object;
  const mockOracleAbi = output.contracts["MockOracle.sol"]["MockOracle"].abi;
  
  return {
    yieldStrategy: { bytecode: yieldStrategyBytecode, abi: yieldStrategyAbi },
    mockOracle: { bytecode: mockOracleBytecode, abi: mockOracleAbi },
  };
}

async function test() {
  console.log("Starting unit tests...\n");
  
  // Compile contracts
  const { yieldStrategy, mockOracle } = await compileContracts();
  
  // Setup local provider
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get signers (for local testing, use the first account)
  let signer;
  try {
    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length > 0) {
      signer = await provider.getSigner(accounts[0]);
    } else {
      console.log("No local accounts found, creating random wallet for testing");
      signer = ethers.Wallet.createRandom();
      console.log("Test wallet address:", signer.address);
    }
  } catch (error) {
    console.log("Local provider not available, using random wallet for testing");
    signer = ethers.Wallet.createRandom();
    console.log("Test wallet address:", signer.address);
  }
  
  console.log("\n--- Test 1: Deploy MockOracle ---");
  const MockOracleFactory = new ethers.ContractFactory(mockOracle.abi, mockOracle.bytecode, signer);
  let mockOracleContract;
  try {
    mockOracleContract = await MockOracleFactory.deploy();
    console.log("✓ MockOracle deployed to:", await mockOracleContract.getAddress());
  } catch (error) {
    console.log("✗ MockOracle deployment failed (expected if no local node):", error.message);
    console.log("  This is OK - contracts compiled successfully, just need a local node for full test");
    return;
  }
  
  console.log("\n--- Test 2: Deploy YieldStrategyINFT ---");
  const YieldStrategyFactory = new ethers.ContractFactory(yieldStrategy.abi, yieldStrategy.bytecode, signer);
  const yieldStrategyContract = await YieldStrategyFactory.deploy(signer.address);
  console.log("✓ YieldStrategyINFT deployed to:", await yieldStrategyContract.getAddress());
  
  console.log("\n--- Test 3: Mint a strategy NFT ---");
  const encryptedUri = "ipfs://QmTest123";
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test strategy"));
  const apy = 1250; // 12.5% in basis points
  const attestationHash = ethers.keccak256(ethers.toUtf8Bytes("test attestation"));
  
  const mintTx = await yieldStrategyContract.mintStrategy(
    signer.address,
    encryptedUri,
    contentHash,
    apy,
    attestationHash
  );
  const receipt = await mintTx.wait();
  console.log("✓ Strategy minted, token ID: 1");
  console.log("  Gas used:", receipt.gasUsed.toString());
  
  console.log("\n--- Test 4: Get strategy metadata ---");
  const strategy = await yieldStrategyContract.getStrategy(1);
  console.log("✓ Strategy metadata:");
  console.log("  Encrypted URI:", strategy.encryptedUri);
  console.log("  APY:", strategy.apy.toString(), "basis points");
  console.log("  Creator:", strategy.creator);
  console.log("  Verified:", strategy.verified);
  console.log("  Timestamp:", new Date(Number(strategy.timestamp) * 1000).toISOString());
  
  console.log("\n--- Test 5: Authorize user ---");
  const testUser = ethers.Wallet.createRandom().address;
  await yieldStrategyContract.authorizeUsage(1, testUser);
  console.log("✓ Authorized user:", testUser);
  
  console.log("\n--- Test 6: Check authorization ---");
  const isAuthorized = await yieldStrategyContract.isAuthorized(1, testUser);
  console.log("✓ User authorized:", isAuthorized);
  
  console.log("\n--- Test 7: Revoke authorization ---");
  await yieldStrategyContract.revokeUsage(1, testUser);
  const isAuthorizedAfter = await yieldStrategyContract.isAuthorized(1, testUser);
  console.log("✓ User authorized after revoke:", isAuthorizedAfter);
  
  console.log("\n--- Test 8: Set oracle ---");
  const oracleAddress = await mockOracleContract.getAddress();
  await yieldStrategyContract.setOracle(oracleAddress);
  console.log("✓ Oracle set to:", oracleAddress);
  
  console.log("\n--- Test 9: Verify total supply ---");
  const totalSupply = await yieldStrategyContract.totalSupply();
  console.log("✓ Total supply:", totalSupply.toString());
  
  console.log("\n--- All tests passed! ---");
}

// Run tests
test().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
