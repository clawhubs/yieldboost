/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");

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
  const sourceName = path.basename(contractPath);
  const input = {
    language: "Solidity",
    sources: {
      [sourceName]: {
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
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
        },
      },
    },
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports }),
  );
  const errors = output.errors ?? [];
  const fatalErrors = errors.filter((item) => item.severity === "error");

  if (fatalErrors.length > 0) {
    throw new Error(fatalErrors.map((item) => item.formattedMessage).join("\n"));
  }

  const compiled = output.contracts?.[sourceName]?.[contractName];
  if (!compiled) {
    throw new Error(`Contract ${contractName} not found in compilation output.`);
  }

  return {
    compilerVersion: solc.version(),
    input,
    source,
    sourceName,
    abi: compiled.abi,
    bytecode: compiled.evm.bytecode.object,
    deployedBytecode: compiled.evm.deployedBytecode.object,
    metadata: JSON.parse(compiled.metadata),
  };
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const rootDir = path.resolve(__dirname, "..");
  const contractName = "AttestationRegistryOracle";
  const contractPath = path.join(rootDir, "contracts", `${contractName}.sol`);
  const artifactDir = path.join(rootDir, ".artifacts");
  const publicAbiDir = path.join(rootDir, "public", "abi");

  const compiled = compileContract(contractPath, contractName);
  const testnetDeployment = readJsonIfExists(
    path.join(artifactDir, "attestation-oracle-deployment.json"),
  );
  const mainnetDeployment = readJsonIfExists(
    path.join(artifactDir, "attestation-oracle-deployment-mainnet.json"),
  );

  fs.mkdirSync(artifactDir, { recursive: true });
  fs.mkdirSync(publicAbiDir, { recursive: true });

  const verificationBundle = {
    contractName,
    sourceName: compiled.sourceName,
    compilerVersion: compiled.compilerVersion,
    optimizer: {
      enabled: true,
      runs: 200,
    },
    deployments: {
      testnet: testnetDeployment
        ? {
            address: testnetDeployment.address,
            chainId: testnetDeployment.chainId,
            explorerUrl: testnetDeployment.explorerUrl,
            transactionHash: testnetDeployment.transactionHash,
            blockNumber: testnetDeployment.blockNumber,
            constructorArgs: testnetDeployment.constructorArgs ?? null,
            constructorArgsEncoded: testnetDeployment.constructorArgsEncoded ?? null,
          }
        : null,
      mainnet: mainnetDeployment
        ? {
            address: mainnetDeployment.address,
            chainId: mainnetDeployment.chainId,
            explorerUrl: mainnetDeployment.explorerUrl,
            transactionHash: mainnetDeployment.transactionHash,
            blockNumber: mainnetDeployment.blockNumber,
            constructorArgs: mainnetDeployment.constructorArgs ?? null,
            constructorArgsEncoded: mainnetDeployment.constructorArgsEncoded ?? null,
          }
        : null,
    },
    abi: compiled.abi,
    bytecode: compiled.bytecode,
    deployedBytecode: compiled.deployedBytecode,
    source: compiled.source,
    standardJsonInput: compiled.input,
    metadata: compiled.metadata,
  };

  const abiArtifactPath = path.join(artifactDir, `${contractName}.abi.json`);
  const verificationPath = path.join(artifactDir, `${contractName}.verification.json`);
  const publicAbiPath = path.join(publicAbiDir, `${contractName}.json`);

  fs.writeFileSync(abiArtifactPath, `${JSON.stringify(compiled.abi, null, 2)}\n`, "utf8");
  fs.writeFileSync(verificationPath, `${JSON.stringify(verificationBundle, null, 2)}\n`, "utf8");
  fs.writeFileSync(publicAbiPath, `${JSON.stringify(compiled.abi, null, 2)}\n`, "utf8");

  console.log(`ABI artifact: ${abiArtifactPath}`);
  console.log(`Verification bundle: ${verificationPath}`);
  console.log(`Public ABI: ${publicAbiPath}`);
}

main();
