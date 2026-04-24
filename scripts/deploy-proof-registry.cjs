/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");
const { JsonRpcProvider, Wallet, ContractFactory, formatEther } = require("ethers");

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

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors ?? [];
  const fatalErrors = errors.filter((item) => item.severity === "error");

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
  const rootDir = path.resolve(__dirname, "..");
  const envLocal = readEnvFile(path.join(rootDir, ".env.local"));

  const rpcUrl = getEnv("ZG_RPC_URL", envLocal) || getEnv("NEXT_PUBLIC_ZG_RPC", envLocal);
  const privateKey = getEnv("ZG_PRIVATE_KEY", envLocal);
  const explorerBase =
    getEnv("NEXT_PUBLIC_0G_EXPLORER_BASE_URL", envLocal) ||
    "https://chainscan-galileo.0g.ai";

  if (!rpcUrl) {
    throw new Error("Missing ZG_RPC_URL.");
  }

  if (!privateKey) {
    throw new Error("Missing ZG_PRIVATE_KEY.");
  }

  const contractPath = path.join(rootDir, "contracts", "ProofRegistry.sol");
  const { abi, bytecode } = compileContract(contractPath, "ProofRegistry");

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const balance = await provider.getBalance(signer.address);

  console.log(`Deploying from: ${signer.address}`);
  console.log(`Balance: ${formatEther(balance)} 0G`);

  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  console.log(`Deployment tx: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const deploymentReceipt = await provider.getTransactionReceipt(
    contract.deploymentTransaction().hash,
  );

  const artifactDir = path.join(rootDir, ".artifacts");
  fs.mkdirSync(artifactDir, { recursive: true });

  const deployment = {
    contractName: "ProofRegistry",
    address,
    chainId: 16602,
    rpcUrl,
    deployer: signer.address,
    transactionHash: contract.deploymentTransaction().hash,
    blockNumber: deploymentReceipt?.blockNumber ?? null,
    explorerUrl: `${explorerBase.replace(/\/$/, "")}/address/${address}`,
    deployedAt: new Date().toISOString(),
    abi,
  };

  fs.writeFileSync(
    path.join(artifactDir, "proof-registry-deployment.json"),
    JSON.stringify(deployment, null, 2),
    "utf8",
  );

  console.log("");
  console.log(`ZG_PROOF_REGISTRY_ADDRESS=${address}`);
  console.log(`Explorer: ${deployment.explorerUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
