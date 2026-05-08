import "server-only";

import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { Wallet, keccak256, toUtf8Bytes } from "ethers";
import type { SentinelAgentIdentityProof } from "@/lib/backend-data";
import type { WalletNetworkKey } from "@/lib/wallet";

const execFileAsync = promisify(execFile);

const FIELD_MODULUS = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);
const LOCAL_WITNESS_LIMIT = BigInt("1000000000000000000");
const SENTINEL_DOMAIN = BigInt("20260508");
const AGENT_ID_WEIGHT = BigInt("131071");
const AGENT_SECRET_WEIGHT = BigInt("524287");
const ACTION_CONTEXT_WEIGHT = BigInt("8191");
const NULLIFIER_ID_WEIGHT = BigInt("65537");
const NULLIFIER_CONTEXT_WEIGHT = BigInt("257");
const NULLIFIER_SECRET_WEIGHT = BigInt("4099");

interface CreateSentinelAgentIdentityProofInput {
  networkKey: WalletNetworkKey;
  walletAddress?: string;
  operation: string;
  actionContext: Record<string, unknown>;
}

function isEnabled() {
  return process.env.YB_SENTINEL_ENABLED === "true";
}

function getWalletKeyFile() {
  const configured = process.env.YB_SENTINEL_WALLET_KEY_FILE;
  if (configured) return configured;

  const localDefault = "/home/cucu/Coder/Private key wallet/private";
  return existsSync(localDefault) ? localDefault : undefined;
}

function normalizePrivateKey(value: string) {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function fieldFromHex(hex: string) {
  return BigInt(hex) % FIELD_MODULUS;
}

function fieldFromText(text: string) {
  return fieldFromHex(keccak256(toUtf8Bytes(text))) % LOCAL_WITNESS_LIMIT;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

async function loadPrivateKeyForWallet(walletAddress: string) {
  const walletKeyFile = getWalletKeyFile();
  const raw = walletKeyFile ? await readFile(walletKeyFile, "utf8") : "";
  const envKeys = [
    process.env.ZG_MAINNET_LEDGER_PRIVATE_KEY,
    process.env.ZG_MAINNET_PRIVATE_KEY,
    process.env.ZG_LEDGER_PRIVATE_KEY,
    process.env.ZG_PRIVATE_KEY,
    process.env.ZG_TESTNET_LEDGER_PRIVATE_KEY,
    process.env.ZG_TESTNET_PRIVATE_KEY,
  ];
  const keys = [
    ...new Set(
      [
        ...(raw.match(/0x[a-fA-F0-9]{64}|\b[a-fA-F0-9]{64}\b/g) ?? []),
        ...envKeys.filter((value): value is string => Boolean(value)),
      ].map(normalizePrivateKey),
    ),
  ];
  const normalizedWallet = walletAddress.toLowerCase();

  for (const privateKey of keys) {
    const wallet = new Wallet(privateKey);
    if (wallet.address.toLowerCase() === normalizedWallet) {
      return privateKey;
    }
  }

  return null;
}

function buildWitness(input: {
  privateKey: string;
  walletAddress: string;
  networkKey: WalletNetworkKey;
  operation: string;
  actionContext: Record<string, unknown>;
}) {
  const actionContext = {
    appId: "yieldboost-ai",
    circuit: "agent_identity",
    networkKey: input.networkKey,
    walletAddress: input.walletAddress,
    operation: input.operation,
    ...input.actionContext,
  };
  const agentId = fieldFromText(`yieldboost-agent-id:${input.walletAddress.toLowerCase()}`);
  const agentSecret = fieldFromText(
    `yieldboost-agent-secret:${input.privateKey.toLowerCase()}`,
  );
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

async function runNoirProof(input: {
  witness: Record<string, string>;
  proofId: string;
}) {
  if (process.env.YB_SENTINEL_RUN_NARGO !== "true") {
    return {
      status: "witness-generated" as const,
      proofGenerated: false,
      proofDigest: undefined,
      publicInputDigest: undefined,
      note: "nargo_execution_disabled",
    };
  }

  const repoRoot = process.cwd();
  const circuitDir = path.join(
    repoRoot,
    "military-grade-zk",
    "circuits",
    "agent_identity",
  );
  const nargo = process.env.NARGO_BIN ?? "/home/cucu/.nargo/bin/nargo";
  const bb = process.env.BB_BIN ?? "/home/cucu/.bb/bb";
  const suffix = input.proofId.replace(/[^a-zA-Z0-9_]/g, "_");
  const proverName = `sentinel_${suffix}`;
  const witnessName = `sentinel_${suffix}_witness`;
  const proofDir = path.join(circuitDir, "target", proverName);
  const proverPath = path.join(circuitDir, `${proverName}.toml`);
  const env = {
    ...process.env,
    PATH: `/home/cucu/.nargo/bin:/home/cucu/.bb:${process.env.PATH ?? ""}`,
  };
  const proverToml = Object.keys(input.witness)
    .sort()
    .map((key) => `${key} = "${input.witness[key]}"`)
    .join("\n");

  await mkdir(proofDir, { recursive: true });
  await writeFile(proverPath, `${proverToml}\n`, "utf8");
  await execFileAsync(nargo, ["check"], { cwd: circuitDir, env });
  await execFileAsync(nargo, ["execute", witnessName, "-p", proverName], {
    cwd: circuitDir,
    env,
  });
  await execFileAsync(
    bb,
    [
      "prove",
      "-b",
      path.join(circuitDir, "target", "agent_identity.json"),
      "-w",
      path.join(circuitDir, "target", `${witnessName}.gz`),
      "-o",
      proofDir,
      "--write_vk",
      "--verify",
      "-t",
      "evm",
    ],
    { cwd: circuitDir, env },
  );

  const [proof, publicInputs] = await Promise.all([
    readFile(path.join(proofDir, "proof")),
    readFile(path.join(proofDir, "public_inputs")),
  ]);

  return {
    status: "verified" as const,
    proofGenerated: true,
    proofDigest: `0x${sha256Hex(proof)}`,
    publicInputDigest: `0x${sha256Hex(publicInputs)}`,
    note: undefined,
  };
}

export async function createSentinelAgentIdentityProof(
  input: CreateSentinelAgentIdentityProofInput,
): Promise<SentinelAgentIdentityProof | null> {
  if (!isEnabled() || !input.walletAddress) {
    return null;
  }

  const createdAt = new Date().toISOString();
  const proofId = `sentinel-${randomUUID()}`;
  const privateKey = await loadPrivateKeyForWallet(input.walletAddress);

  if (!privateKey) {
    return {
      proofId,
      circuit: "agent_identity",
      status: "wallet-not-found",
      createdAt,
      networkKey: input.networkKey,
      walletAddress: input.walletAddress,
      operation: input.operation,
      verifier: "ZK agent_identity circuit",
      publicSignals: {},
      summary: "ZK agent identity layer could not find a matching local test wallet.",
      note: "wallet_key_not_found",
    };
  }

  try {
    const { actionContext, witness } = buildWitness({
      privateKey,
      walletAddress: input.walletAddress,
      networkKey: input.networkKey,
      operation: input.operation,
      actionContext: input.actionContext,
    });
    const proofRun = await runNoirProof({ witness, proofId });

    return {
      proofId,
      circuit: "agent_identity",
      status: proofRun.status,
      createdAt,
      networkKey: input.networkKey,
      walletAddress: input.walletAddress,
      operation: input.operation,
      verifier: "ZK agent_identity circuit",
      publicSignals: {
        agentCommitment: witness.agent_commitment,
        actionContextHash: witness.action_context_hash,
        sessionNullifier: witness.session_nullifier,
      },
      actionContextHash: witness.action_context_hash,
      proofDigest: proofRun.proofDigest,
      publicInputDigest: proofRun.publicInputDigest,
      proofGenerated: proofRun.proofGenerated,
      summary:
        proofRun.status === "verified"
          ? "ZK agent_identity verified the connected agent identity for this optimization action."
          : "ZK agent_identity witness generated; local Noir proving was disabled.",
      note: proofRun.note,
      actionContext,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "sentinel_failed";
    return {
      proofId,
      circuit: "agent_identity",
      status: "failed",
      createdAt,
      networkKey: input.networkKey,
      walletAddress: input.walletAddress,
      operation: input.operation,
      verifier: "ZK agent_identity circuit",
      publicSignals: {},
      summary: "ZK agent identity layer failed while generating or verifying the Noir proof.",
      note: message.slice(0, 240),
    };
  }
}
