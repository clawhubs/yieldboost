/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const {
  JsonRpcProvider,
  Wallet,
  Contract,
  formatEther,
} = require("ethers");

function readEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) {
    return values;
  }

  const source = fs.readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
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
  return process.env[name] || fallback[name];
}

async function main() {
  const network = process.argv[2] || "testnet";
  const rootDir = path.resolve(__dirname, "..");
  const envLocal = readEnvFile(path.join(rootDir, ".env.local"));

  const rpcUrl =
    network === "mainnet"
      ? getEnv("ZG_MAINNET_RPC_URL", envLocal) || "https://evmrpc.0g.ai"
      : getEnv("ZG_TESTNET_RPC_URL", envLocal) ||
        getEnv("NEXT_PUBLIC_ZG_RPC", envLocal) ||
        "https://evmrpc-testnet.0g.ai";
  const privateKey =
    network === "mainnet"
      ? getEnv("ZG_MAINNET_LEDGER_PRIVATE_KEY", envLocal) ||
        getEnv("ZG_MAINNET_PRIVATE_KEY", envLocal)
      : getEnv("ZG_TESTNET_LEDGER_PRIVATE_KEY", envLocal) ||
        getEnv("ZG_TESTNET_PRIVATE_KEY", envLocal) ||
        getEnv("ZG_PRIVATE_KEY", envLocal);
  const inftAddress =
    network === "mainnet"
      ? getEnv("YIELD_STRATEGY_INFT_MAINNET_ADDRESS", envLocal)
      : getEnv("YIELD_STRATEGY_INFT_ADDRESS", envLocal);
  const oracleAddress =
    network === "mainnet"
      ? getEnv("YIELD_STRATEGY_ATTESTATION_ORACLE_MAINNET_ADDRESS", envLocal)
      : getEnv("YIELD_STRATEGY_ATTESTATION_ORACLE_ADDRESS", envLocal);

  if (!rpcUrl || !privateKey || !inftAddress || !oracleAddress) {
    throw new Error(`Missing RPC/private key/INFT/oracle config for ${network}.`);
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const balance = await provider.getBalance(signer.address);
  console.log(`Configuring INFT oracle on ${network}`);
  console.log(`Signer: ${signer.address}`);
  console.log(`Balance: ${formatEther(balance)} 0G`);

  const inft = new Contract(
    inftAddress,
    [
      "function owner() view returns (address)",
      "function oracle() view returns (address)",
      "function setOracle(address newOracle) external",
    ],
    signer,
  );

  const [owner, currentOracle] = await Promise.all([inft.owner(), inft.oracle()]);
  console.log(`Owner: ${owner}`);
  console.log(`Current oracle: ${currentOracle}`);

  if (currentOracle.toLowerCase() === oracleAddress.toLowerCase()) {
    console.log("INFT oracle already configured.");
    return;
  }

  const tx = await inft.setOracle(oracleAddress);
  console.log(`Set oracle tx: ${tx.hash}`);
  await tx.wait();
  console.log(`Updated oracle to: ${oracleAddress}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
