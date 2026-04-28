const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");

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

async function acknowledgeProvider() {
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
  const signer = new ethers.Wallet(privateKey, provider);

  console.log("Wallet address:", signer.address);
  console.log("Provider address:", providerAddress);

  // 0G Compute ABI for acknowledgeProvider function
  const abi = [
    "function acknowledgeProvider(address provider) external",
  ];

  const contract = new ethers.Contract(
    providerAddress,
    abi,
    signer
  );

  try {
    console.log("Acknowledging provider...");
    const tx = await contract.acknowledgeProvider(providerAddress);
    console.log("Transaction submitted:", tx.hash);
    
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log("\n✅ Provider acknowledged successfully!");
      console.log("Wallet is now registered with 0G Compute provider.");
    }
  } catch (error) {
    console.error("Error acknowledging provider:", error);
    process.exit(1);
  }
}

acknowledgeProvider();
