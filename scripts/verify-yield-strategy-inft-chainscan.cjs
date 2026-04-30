/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { AbiCoder } = require("ethers");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getExplorerBase(network) {
  if (network === "mainnet") {
    return process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL ?? "https://chainscan.0g.ai";
  }

  return process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ?? "https://chainscan-galileo.0g.ai";
}

function resolveConstructorEncoding(deployment, verification, network) {
  const deploymentInfo = verification.deployments?.[network] ?? null;

  if (typeof deployment?.constructorArgsEncoded === "string") {
    return deployment.constructorArgsEncoded;
  }

  if (typeof deploymentInfo?.constructorArgsEncoded === "string") {
    return deploymentInfo.constructorArgsEncoded;
  }

  const owner =
    deployment?.constructorArgs?.[0] ??
    deploymentInfo?.constructorArgs?.[0] ??
    deployment?.deployer;

  if (!owner) {
    return undefined;
  }

  return AbiCoder.defaultAbiCoder().encode(["address"], [owner]);
}

async function main() {
  const network = process.argv[2] === "mainnet" ? "mainnet" : "testnet";
  const rootDir = path.resolve(__dirname, "..");
  const artifactDir = path.join(rootDir, ".artifacts");
  const deploymentFile =
    network === "mainnet"
      ? "yield-strategy-inft-deployment-mainnet.json"
      : "yield-strategy-inft-deployment.json";
  const deploymentPath = path.join(artifactDir, deploymentFile);
  const verificationPath = path.join(artifactDir, "YieldStrategyINFT.verification.json");
  const sourcePath = path.join(rootDir, "contracts", "YieldStrategyINFT.sol");

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Missing deployment artifact: ${deploymentPath}`);
  }

  if (!fs.existsSync(verificationPath)) {
    throw new Error(
      `Missing verification bundle. Run "npm run export:inft-abi" first.`,
    );
  }

  const deployment = readJson(deploymentPath);
  const verification = readJson(verificationPath);
  const sourceCode = fs.readFileSync(sourcePath, "utf8");
  const explorerBase = getExplorerBase(network).replace(/\/$/, "");
  const metadataSettings = verification.metadata?.settings ?? {};
  const optimizer = metadataSettings.optimizer ?? verification.optimizer;
  const constructorArguments = resolveConstructorEncoding(
    deployment,
    verification,
    network,
  );

  const payload = {
    address: deployment.address,
    name: "YieldStrategyINFT",
    sourceCode,
    compiler: "0.8.24",
    license: "3",
    optimizeRuns: optimizer?.enabled ? optimizer.runs ?? 200 : 0,
    evmVersion: metadataSettings.evmVersion ?? "shanghai",
    constructorArguments,
    standardJsonInput: verification.standardJsonInput,
    metadata: verification.metadata,
  };

  console.log(`Verifying YieldStrategyINFT on ${network} ChainScan...`);
  console.log(`Contract: ${payload.address}`);
  console.log(`Endpoint: ${explorerBase}/v1/contract/verify`);

  const response = await fetch(`${explorerBase}/v1/contract/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  console.log(`Status: ${response.status}`);
  console.log(JSON.stringify(data, null, 2));

  const alreadyVerified = Array.isArray(data.result?.errors)
    ? data.result.errors.some((item) => String(item).startsWith("already_verified"))
    : false;

  if (
    !response.ok ||
    data.status !== "1" ||
    (data.result?.exactMatch !== true && !alreadyVerified)
  ) {
    throw new Error("ChainScan verification did not return an exact match.");
  }

  console.log(`Verified: ${explorerBase}/address/${payload.address}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
