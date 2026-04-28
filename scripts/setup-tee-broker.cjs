const { ethers } = require("ethers");
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");
require("dotenv").config({ path: ".env.local" });

async function setupTEE() {
  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  const wallet = new ethers.Wallet(process.env.ZG_LEDGER_PRIVATE_KEY, provider);

  console.log("Wallet address:", wallet.address);
  console.log("Provider address:", process.env.ZG_COMPUTE_PROVIDER_ADDRESS);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("OG Balance:", ethers.formatEther(balance), "OG");

  // Step 1: Create broker instance
  console.log("\nStep 1: Creating broker instance...");
  const broker = await createZGComputeNetworkBroker(wallet);
  console.log("Broker created successfully");

  // Step 2: Deposit fund to ledger (minimum 3 OG)
  console.log("\nStep 2: Depositing 3 OG to ledger...");
  try {
    await broker.ledger.depositFund(3);
    console.log("Deposit successful!");
  } catch (error) {
    console.warn("Deposit failed (may already have funds):", error.message);
  }

  // Step 3: Transfer fund to provider sub-account (minimum 1 OG)
  console.log("\nStep 3: Transferring 1 OG to provider sub-account...");
  try {
    const providerAddress = process.env.ZG_COMPUTE_PROVIDER_ADDRESS;
    await broker.ledger.transferFund(providerAddress, 'inference', BigInt(1) * BigInt(10 ** 18));
    console.log("Transfer to provider sub-account successful!");
  } catch (error) {
    console.warn("Transfer failed:", error.message);
  }

  // Step 4: Acknowledge provider
  console.log("\nStep 4: Acknowledging provider...");
  try {
    await broker.inference.acknowledgeProviderSigner(process.env.ZG_COMPUTE_PROVIDER_ADDRESS);
    console.log("Provider acknowledged successfully!");
  } catch (error) {
    console.warn("Acknowledge failed:", error.message);
  }

  // Step 5: List available services
  console.log("\nStep 5: Listing available services...");
  try {
    const services = await broker.inference.listService();
    console.log("Available services:", JSON.stringify(services, null, 2));
  } catch (error) {
    console.warn("List services failed:", error.message);
  }

  console.log("\n✅ TEE setup complete!");
}

setupTEE().catch(console.error);
