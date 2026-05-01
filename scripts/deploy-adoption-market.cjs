/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");
const {
  AbiCoder,
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  formatEther,
} = require("ethers");

function readEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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

function findImports(importPath) {
  const candidates = [
    path.join(process.cwd(), importPath),
    path.join(process.cwd(), "node_modules", importPath),
    path.join(process.cwd(), "contracts", importPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }

  return { error: `File not found: ${importPath}` };
}

function compileContract(rootDir) {
  const contractPath = path.join(rootDir, "contracts", "YieldStrategyAdoptionMarket.sol");
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "YieldStrategyAdoptionMarket.sol": { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors ?? []).filter((item) => item.severity === "error");
  if (errors.length) {
    throw new Error(errors.map((item) => item.formattedMessage).join("\n"));
  }

  const compiled =
    output.contracts["YieldStrategyAdoptionMarket.sol"].YieldStrategyAdoptionMarket;
  return {
    abi: compiled.abi,
    bytecode: compiled.evm.bytecode.object,
  };
}

async function main() {
  const network = process.argv[2] || "mainnet";
  const rootDir = path.resolve(__dirname, "..");
  const envLocal = readEnvFile(path.join(rootDir, ".env.local"));
  const isMainnet = network === "mainnet";
  const rpcUrl = isMainnet
    ? getEnv("ZG_MAINNET_RPC_URL", envLocal) || "https://evmrpc.0g.ai"
    : getEnv("ZG_TESTNET_RPC_URL", envLocal) ||
      getEnv("NEXT_PUBLIC_ZG_RPC", envLocal) ||
      "https://evmrpc-testnet.0g.ai";
  const privateKey = isMainnet
    ? getEnv("ZG_MAINNET_LEDGER_PRIVATE_KEY", envLocal) ||
      getEnv("ZG_MAINNET_PRIVATE_KEY", envLocal) ||
      getEnv("ZG_PRIVATE_KEY", envLocal)
    : getEnv("ZG_TESTNET_LEDGER_PRIVATE_KEY", envLocal) ||
      getEnv("ZG_TESTNET_PRIVATE_KEY", envLocal) ||
      getEnv("ZG_PRIVATE_KEY", envLocal);
  const inftAddress = isMainnet
    ? getEnv("YIELD_STRATEGY_INFT_MAINNET_ADDRESS", envLocal) ||
      getEnv("YIELD_STRATEGY_INFT_ADDRESS", envLocal)
    : getEnv("YIELD_STRATEGY_INFT_ADDRESS", envLocal);
  const explorerBase = isMainnet
    ? getEnv("NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL", envLocal) ||
      "https://chainscan.0g.ai"
    : getEnv("NEXT_PUBLIC_0G_EXPLORER_BASE_URL", envLocal) ||
      "https://chainscan-galileo.0g.ai";

  if (!privateKey) throw new Error("Missing deployment private key.");
  if (!inftAddress) throw new Error("Missing YieldStrategyINFT address.");

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const balance = await provider.getBalance(signer.address);
  const { abi, bytecode } = compileContract(rootDir);
  const factory = new ContractFactory(abi, bytecode, signer);
  const deployTx = await factory.getDeployTransaction(inftAddress);
  const gas = await provider.estimateGas({ ...deployTx, from: signer.address });

  console.log(`Deploying YieldStrategyAdoptionMarket to ${network}...`);
  console.log(`Deployer: ${signer.address}`);
  console.log(`Balance: ${formatEther(balance)} 0G`);
  console.log(`INFT: ${inftAddress}`);
  console.log(`Estimated gas: ${gas.toString()}`);

  const contract = await factory.deploy(inftAddress);
  const tx = contract.deploymentTransaction();
  console.log(`Deployment tx: ${tx.hash}`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await provider.getTransactionReceipt(tx.hash);

  const artifactDir = path.join(rootDir, ".artifacts");
  fs.mkdirSync(artifactDir, { recursive: true });
  const deployment = {
    contractName: "YieldStrategyAdoptionMarket",
    address,
    network,
    chainId: isMainnet ? 16661 : 16602,
    deployer: signer.address,
    transactionHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    explorerUrl: `${explorerBase.replace(/\/$/, "")}/address/${address}`,
    deployedAt: new Date().toISOString(),
    constructorArgs: [inftAddress],
    constructorArgsEncoded: AbiCoder.defaultAbiCoder().encode(["address"], [inftAddress]),
    abi,
  };
  fs.writeFileSync(
    path.join(
      artifactDir,
      isMainnet
        ? "yield-strategy-adoption-market-deployment-mainnet.json"
        : "yield-strategy-adoption-market-deployment.json",
    ),
    JSON.stringify(deployment, null, 2),
    "utf8",
  );

  console.log(`Contract Address: ${address}`);
  console.log(`Explorer: ${deployment.explorerUrl}`);
  console.log(
    isMainnet
      ? `YIELD_STRATEGY_MARKETPLACE_MAINNET_ADDRESS=${address}`
      : `YIELD_STRATEGY_MARKETPLACE_ADDRESS=${address}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
