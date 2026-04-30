/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");
const {
  AbiCoder,
  JsonRpcProvider,
  Wallet,
  ContractFactory,
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

function getExplorerBase(network, envLocal) {
  if (network === "mainnet") {
    return (
      getEnv("NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL", envLocal) ||
      "https://chainscan.0g.ai"
    );
  }

  return (
    getEnv("NEXT_PUBLIC_0G_EXPLORER_BASE_URL", envLocal) ||
    "https://chainscan-galileo.0g.ai"
  );
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

function compileContract(contractPath, contractName) {
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      [path.basename(contractPath)]: {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const fatalErrors = (output.errors ?? []).filter((item) => item.severity === "error");

  if (fatalErrors.length) {
    throw new Error(fatalErrors.map((item) => item.formattedMessage).join("\n"));
  }

  const compiled = output.contracts[path.basename(contractPath)][contractName];
  if (!compiled) {
    throw new Error(`Contract ${contractName} not found in compilation output.`);
  }

  return {
    abi: compiled.abi,
    bytecode: compiled.evm.bytecode.object,
  };
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
  const chainId = network === "mainnet" ? 16661 : 16602;
  const explorerBase = getExplorerBase(network, envLocal);

  if (!rpcUrl || !privateKey) {
    throw new Error(`Missing RPC URL or private key for ${network}.`);
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const balance = await provider.getBalance(signer.address);

  console.log(`Deploying AttestationRegistryOracle to ${network}...`);
  console.log(`Deployer: ${signer.address}`);
  console.log(`Balance: ${formatEther(balance)} 0G`);

  const contractPath = path.join(rootDir, "contracts", "AttestationRegistryOracle.sol");
  const { abi, bytecode } = compileContract(contractPath, "AttestationRegistryOracle");
  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy(signer.address);

  console.log(`Deployment tx: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = await provider.getTransactionReceipt(contract.deploymentTransaction().hash);

  const artifactDir = path.join(rootDir, ".artifacts");
  fs.mkdirSync(artifactDir, { recursive: true });

  const deployment = {
    contractName: "AttestationRegistryOracle",
    address,
    network,
    chainId,
    rpcUrl,
    deployer: signer.address,
    transactionHash: contract.deploymentTransaction().hash,
    blockNumber: receipt?.blockNumber ?? null,
    explorerUrl: `${explorerBase.replace(/\/$/, "")}/address/${address}`,
    deployedAt: new Date().toISOString(),
    constructorArgs: [signer.address],
    constructorArgsEncoded: AbiCoder.defaultAbiCoder().encode(["address"], [signer.address]),
    abi,
  };

  const deploymentFile =
    network === "mainnet"
      ? "attestation-oracle-deployment-mainnet.json"
      : "attestation-oracle-deployment.json";

  fs.writeFileSync(
    path.join(artifactDir, deploymentFile),
    JSON.stringify(deployment, null, 2),
    "utf8",
  );

  console.log(`Contract Address: ${address}`);
  console.log(`Explorer: ${deployment.explorerUrl}`);

  if (network === "mainnet") {
    console.log(`YIELD_STRATEGY_ATTESTATION_ORACLE_MAINNET_ADDRESS=${address}`);
  } else {
    console.log(`YIELD_STRATEGY_ATTESTATION_ORACLE_ADDRESS=${address}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
