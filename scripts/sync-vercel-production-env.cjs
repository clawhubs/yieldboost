const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "ZG_NETWORK_KEY",
  "NEXT_PUBLIC_0G_MAINNET_CHAIN_ID",
  "NEXT_PUBLIC_0G_MAINNET_CHAIN_NAME",
  "NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL",
  "NEXT_PUBLIC_0G_MAINNET_RPC",
  "NEXT_PUBLIC_0G_MAINNET_STORAGE",
  "ZG_MAINNET_RPC_URL",
  "ZG_MAINNET_STORAGE_URL",
  "ZG_MAINNET_PRIVATE_KEY",
  "ZG_MAINNET_PROOF_REGISTRY_ADDRESS",
  "ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS",
  "ZG_MAINNET_LEDGER_PRIVATE_KEY",
  "YIELD_STRATEGY_INFT_MAINNET_ADDRESS",
  "YIELD_STRATEGY_ATTESTATION_ORACLE_MAINNET_ADDRESS",
  "GLOBAL_BLACKLIST_REGISTRY_MAINNET_ADDRESS",
  "VALIDATION_REGISTRY_MAINNET_ADDRESS",
];

const OPTIONAL_KEYS = [
  "NEXT_PUBLIC_DEMO_WALLET_ADDRESS",
  "NEXT_PUBLIC_0G_TESTNET_CHAIN_ID",
  "NEXT_PUBLIC_0G_TESTNET_CHAIN_NAME",
  "NEXT_PUBLIC_0G_EXPLORER_BASE_URL",
  "NEXT_PUBLIC_ZG_RPC",
  "NEXT_PUBLIC_ZG_STORAGE",
  "ZG_TESTNET_RPC_URL",
  "ZG_TESTNET_STORAGE_URL",
  "ZG_TESTNET_PRIVATE_KEY",
  "ZG_TESTNET_PROOF_REGISTRY_ADDRESS",
  "ZG_TESTNET_COMPUTE_PROVIDER_ADDRESS",
  "ZG_TESTNET_LEDGER_PRIVATE_KEY",
  "YIELD_STRATEGY_INFT_ADDRESS",
  "YIELD_STRATEGY_ATTESTATION_ORACLE_ADDRESS",
  "YIELD_STRATEGY_MARKETPLACE_ADDRESS",
  "YIELD_STRATEGY_MARKETPLACE_MAINNET_ADDRESS",
  "GLOBAL_BLACKLIST_REGISTRY_ADDRESS",
  "VALIDATION_REGISTRY_ADDRESS",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "ALIBABA_API_KEY",
  "ALIBABA_BASE_URL",
  "ALIBABA_MODEL",
  "ALIBABA_EMBEDDING_MODEL",
  "ALIBABA_EMBEDDING_DIMENSION",
  "STRATEGY_METADATA_ENCRYPTION_KEY",
];

function getEnvSource() {
  const cwd = process.cwd();
  const localValues = readEnvFile(path.join(cwd, ".env.local"));
  const exampleValues = readEnvFile(path.join(cwd, ".env.mainnet.example"));
  return { ...exampleValues, ...localValues };
}

function resolveValue(env, key) {
  const value = process.env[key] ?? env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function printChecklist(env) {
  const allKeys = [...REQUIRED_KEYS, ...OPTIONAL_KEYS];
  for (const key of allKeys) {
    const value = resolveValue(env, key);
    const status = value ? "set" : REQUIRED_KEYS.includes(key) ? "missing" : "optional";
    console.log(`${status.padEnd(8)} ${key}`);
  }
}

function runVercel(args, options = {}) {
  return spawnSync("npx", ["vercel", ...args], {
    cwd: process.cwd(),
    stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
    input: options.input,
    encoding: "utf8",
  });
}

function ensureVercelAvailable() {
  const result = spawnSync("npx", ["vercel", "--version"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  if (result.status !== 0) {
    throw new Error("Unable to launch Vercel CLI with npx.");
  }
}

function syncKey(key, value) {
  runVercel(["env", "rm", key, "production", "--yes"]);
  const addResult = runVercel(["env", "add", key, "production"], { input: `${value}\n` });
  if (addResult.status !== 0) {
    throw new Error(`Failed to sync ${key} to Vercel production.`);
  }
}

function main() {
  const printOnly = process.argv.includes("--print");
  const env = getEnvSource();
  const missing = REQUIRED_KEYS.filter((key) => !resolveValue(env, key));

  if (printOnly) {
    printChecklist(env);
    return;
  }

  if (missing.length > 0) {
    console.error("Missing required env keys:");
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    process.exit(1);
  }

  ensureVercelAvailable();
  for (const key of [...REQUIRED_KEYS, ...OPTIONAL_KEYS]) {
    const value = resolveValue(env, key);
    if (!value) continue;
    console.log(`Syncing ${key} to Vercel production...`);
    syncKey(key, value);
  }
  console.log("Vercel production env sync complete.");
}

main();
