const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker");

function readEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) {
    return values;
  }

  const source = fs.readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getEnv(name, fallback) {
  if (process.env[name]) {
    return process.env[name];
  }

  return fallback[name];
}

async function setupTEE() {
  const network = process.argv[2] || "testnet";
  const envLocal = readEnvFile(path.join(process.cwd(), ".env.local"));
  const rpcUrl =
    network === "mainnet"
      ? getEnv("ZG_MAINNET_RPC_URL", envLocal) || "https://evmrpc.0g.ai"
      : getEnv("ZG_TESTNET_RPC_URL", envLocal) ||
        getEnv("NEXT_PUBLIC_ZG_RPC", envLocal) ||
        getEnv("ZG_RPC_URL", envLocal) ||
        "https://evmrpc-testnet.0g.ai";
  const privateKey =
    network === "mainnet"
      ? getEnv("ZG_MAINNET_LEDGER_PRIVATE_KEY", envLocal) ||
        getEnv("ZG_LEDGER_PRIVATE_KEY", envLocal)
      : getEnv("ZG_TESTNET_LEDGER_PRIVATE_KEY", envLocal) ||
        getEnv("ZG_LEDGER_PRIVATE_KEY", envLocal);
  const providerAddress = getEnv("ZG_COMPUTE_PROVIDER_ADDRESS", envLocal);

  if (!privateKey || !providerAddress) {
    throw new Error("Missing ZG_LEDGER_PRIVATE_KEY or ZG_COMPUTE_PROVIDER_ADDRESS.");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Wallet address:", wallet.address);
  console.log("Provider address:", providerAddress);
  console.log("Network:", network);

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
    await broker.ledger.transferFund(providerAddress, 'inference', BigInt(1) * BigInt(10 ** 18));
    console.log("Transfer to provider sub-account successful!");
  } catch (error) {
    console.warn("Transfer failed:", error.message);
  }

  // Step 4: Acknowledge provider
  console.log("\nStep 4: Acknowledging provider...");
  try {
    await broker.inference.acknowledgeProviderSigner(providerAddress);
    console.log("Provider acknowledged successfully!");
  } catch (error) {
    console.warn("Acknowledge failed:", error.message);
  }

  // Step 5: List available services
  console.log("\nStep 5: Listing available services...");
  try {
    const services = await broker.inference.listService();
    console.log(
      "Available services:",
      JSON.stringify(
        services,
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );
  } catch (error) {
    console.warn("List services failed:", error.message);
  }

  console.log("\n✅ TEE setup complete!");
}

setupTEE().catch(console.error);
