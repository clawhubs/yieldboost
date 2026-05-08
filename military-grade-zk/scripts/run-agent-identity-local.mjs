#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Wallet, keccak256, toUtf8Bytes } from "ethers";

const FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const LOCAL_WITNESS_LIMIT = 1_000_000_000_000_000_000n;
const SENTINEL_DOMAIN = 20260508n;
const AGENT_ID_WEIGHT = 131071n;
const AGENT_SECRET_WEIGHT = 524287n;
const ACTION_CONTEXT_WEIGHT = 8191n;
const NULLIFIER_ID_WEIGHT = 65537n;
const NULLIFIER_CONTEXT_WEIGHT = 257n;
const NULLIFIER_SECRET_WEIGHT = 4099n;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const circuitDir = path.join(rootDir, "circuits", "agent_identity");

function parseArgs() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 1) {
    const key = process.argv[index];
    if (!key.startsWith("--")) continue;
    const value = process.argv[index + 1]?.startsWith("--")
      ? "true"
      : process.argv[index + 1] ?? "true";
    args.set(key.slice(2), value);
    if (value !== "true") index += 1;
  }
  return args;
}

function fieldFromHex(hex) {
  return BigInt(hex) % FIELD_MODULUS;
}

function fieldFromText(text) {
  return fieldFromHex(keccak256(toUtf8Bytes(text))) % LOCAL_WITNESS_LIMIT;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function loadPrivateKeys(walletFile) {
  const raw = readFileSync(walletFile, "utf8");
  return [
    ...new Set(
      (raw.match(/0x[a-fA-F0-9]{64}|\b[a-fA-F0-9]{64}\b/g) ?? []).map((value) =>
        value.startsWith("0x") ? value : `0x${value}`,
      ),
    ),
  ];
}

function buildWitness(privateKey, accountIndex, networkKey) {
  const wallet = new Wallet(privateKey);
  const actionContext = {
    appId: "yieldboost-ai",
    circuit: "agent_identity",
    accountIndex,
    networkKey,
    operation: "one-click-optimize",
  };
  const agentId = fieldFromText(`yieldboost-agent-id:${wallet.address.toLowerCase()}`);
  const agentSecret = fieldFromText(`yieldboost-agent-secret:${privateKey.toLowerCase()}`);
  const actionContextHash = fieldFromText(stableStringify(actionContext));
  const agentCommitment =
    (agentId * AGENT_ID_WEIGHT +
      agentSecret * AGENT_SECRET_WEIGHT +
      actionContextHash * ACTION_CONTEXT_WEIGHT +
      SENTINEL_DOMAIN) %
    FIELD_MODULUS;
  const sessionNullifier =
    (agentId * NULLIFIER_ID_WEIGHT +
      actionContextHash * NULLIFIER_CONTEXT_WEIGHT +
      agentSecret * NULLIFIER_SECRET_WEIGHT +
      SENTINEL_DOMAIN) %
    FIELD_MODULUS;

  return {
    walletAddress: wallet.address,
    actionContext,
    witness: {
      agent_id: agentId.toString(),
      agent_secret: agentSecret.toString(),
      agent_commitment: agentCommitment.toString(),
      action_context_hash: actionContextHash.toString(),
      session_nullifier: sessionNullifier.toString(),
    },
  };
}

function writeProverToml(name, witness) {
  const target = path.join(circuitDir, `${name}.toml`);
  const body = Object.keys(witness)
    .sort()
    .map((key) => `${key} = "${witness[key]}"`)
    .join("\n");
  writeFileSync(target, `${body}\n`, "utf8");
  return target;
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: circuitDir,
    stdio: options.stdio ?? "inherit",
    env: {
      ...process.env,
      PATH: `/home/cucu/.nargo/bin:/home/cucu/.bb:${process.env.PATH ?? ""}`,
    },
  });
}

function main() {
  const args = parseArgs();
  const walletFile =
    args.get("wallet-file") ??
    process.env.YB_SENTINEL_WALLET_KEY_FILE ??
    "/home/cucu/Coder/Private key wallet/private";
  const accountCount = Number.parseInt(args.get("accounts") ?? "2", 10);
  const networkKey = args.get("network") ?? "testnet";
  const prove = args.get("prove") !== "false";
  const keys = loadPrivateKeys(walletFile).slice(0, accountCount);

  if (!keys.length) {
    throw new Error(`No private keys found in ${walletFile}`);
  }

  if (!existsSync(circuitDir)) {
    throw new Error(`Circuit directory not found: ${circuitDir}`);
  }

  mkdirSync(path.join(rootDir, "artifacts"), { recursive: true });
  run("nargo", ["check"]);

  const summary = [];
  for (const [index, key] of keys.entries()) {
    const accountNumber = index + 1;
    const proverName = `account${accountNumber}`;
    const witnessName = `sentinel_account_${accountNumber}`;
    const { walletAddress, actionContext, witness } = buildWitness(
      key,
      accountNumber,
      networkKey,
    );
    const proverPath = writeProverToml(proverName, witness);

    run("nargo", ["execute", witnessName, "-p", proverName]);

    const accountTargetDir = path.join(circuitDir, "target", `account${accountNumber}`);
    mkdirSync(accountTargetDir, { recursive: true });
    if (prove) {
      run("bb", [
        "prove",
        "-b",
        path.join(circuitDir, "target", "agent_identity.json"),
        "-w",
        path.join(circuitDir, "target", `${witnessName}.gz`),
        "-o",
        accountTargetDir,
        "--write_vk",
        "--verify",
        "-t",
        "evm",
      ]);
    }

    summary.push({
      account: accountNumber,
      walletAddress,
      proverPath,
      witnessPath: path.join(circuitDir, "target", `${witnessName}.gz`),
      proofDir: prove ? accountTargetDir : null,
      actionContext,
      publicSignals: {
        agentCommitment: witness.agent_commitment,
        actionContextHash: witness.action_context_hash,
        sessionNullifier: witness.session_nullifier,
      },
    });
  }

  const summaryPath = path.join(rootDir, "artifacts", "agent-identity-local-summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify({ ok: true, accounts: summary, summaryPath }, null, 2));
}

main();
