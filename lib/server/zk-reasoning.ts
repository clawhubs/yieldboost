import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroHash,
  type LogDescription,
} from "ethers";
import type {
  StoredDecisionPayload,
  StoredPortfolioSnapshot,
  StoredZkReasoningProof,
  ZkReasoningProofStatus,
} from "@/lib/backend-data";
import {
  getServer0GNetworkConfig,
  type WalletNetworkKey,
} from "@/lib/wallet";
import { recordZkReasoningProof } from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
  "function recordProof(string cid, bytes32 rootHash, bytes32 storageTxHash, uint256 currentApyBps, uint256 optimizedApyBps) external returns (uint256 proofId)",
] as const;

export interface CreateZkReasoningProofInput {
  networkKey: WalletNetworkKey;
  walletAddress?: string;
  agentId?: string;
  prompt?: string;
  reasoning?: string;
  decision?: Partial<StoredDecisionPayload>;
  portfolioSnapshot?: StoredPortfolioSnapshot;
  verifier?: string;
  proofType?: string;
  summary?: string;
  publicSignals?: Record<string, unknown>;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }

  return value;
}

function stableStringify(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function sha256Hex(value: unknown) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : stableStringify(value))
    .digest("hex");
}

function isBytes32(value: string | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}

function joinNotes(...notes: Array<string | undefined>) {
  const values = notes.filter(Boolean);
  return values.length ? values.join(",") : undefined;
}

function resolveStatus(
  networkKey: WalletNetworkKey,
  storageMode: StoredZkReasoningProof["storageMode"],
): ZkReasoningProofStatus {
  if (storageMode === "0g" && networkKey === "testnet") {
    return "testnet-verified";
  }

  if (storageMode === "0g") {
    return "tee-envelope-recorded";
  }

  return "zk-ready";
}

async function anchorReasoningEnvelope(input: {
  cid: string;
  rootHash?: string;
  storageTxHash?: string;
  networkKey: WalletNetworkKey;
}) {
  const config = getServer0GNetworkConfig(input.networkKey);

  if (!config.rpcUrl || !config.privateKey || !config.proofRegistryAddress) {
    return {
      note: "proof_registry_not_configured",
    };
  }

  try {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = new Wallet(config.privateKey, provider);
    const proofRegistry = new Contract(
      config.proofRegistryAddress,
      proofRegistryAbi,
      signer,
    );
    const tx = await proofRegistry.recordProof(
      input.cid,
      isBytes32(input.rootHash) ? input.rootHash : ZeroHash,
      isBytes32(input.storageTxHash) ? input.storageTxHash : ZeroHash,
      0,
      0,
    );
    const receipt = await tx.wait(1).catch(() => null);
    const parsedLogs: Array<LogDescription | null> = (receipt?.logs ?? [])
      .map((log: unknown): LogDescription | null => {
        try {
          return proofRegistry.interface.parseLog(
            log as { topics: string[]; data: string },
          );
        } catch {
          return null;
        }
      });
    const proofRecorded = parsedLogs.find(
      (log: LogDescription | null): log is LogDescription =>
        log?.name === "ProofRecorded",
    );
    const proofId = proofRecorded?.args?.[0]?.toString();

    return {
      proofRegistryAddress: config.proofRegistryAddress,
      proofRegistryTxHash: tx.hash as string,
      proofRegistryProofId: proofId,
      proofRegistryExplorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${tx.hash}`,
      note: receipt ? undefined : "pending_registry_receipt",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "proof_registry_failed";
    return {
      note: `proof_registry_failed:${message.slice(0, 160)}`,
    };
  }
}

export function buildZkReasoningProofPayload(input: CreateZkReasoningProofInput) {
  const createdAt = new Date().toISOString();
  const proofId = `zkr-${randomUUID()}`;
  const verifier = input.verifier ?? "0G Storage + YieldBoost deterministic verifier";
  const proofType = input.proofType ?? "TEE/ZK reasoning proof envelope";
  const privateInputCommitment = sha256Hex({
    prompt: input.prompt,
    reasoning: input.reasoning,
    decision: input.decision,
    portfolioSnapshot: input.portfolioSnapshot,
  });
  const publicSignals = {
    appId: "yieldboost-ai",
    networkKey: input.networkKey,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    recommended: input.decision?.recommended,
    currentApy: input.decision?.current_apy,
    optimizedApy: input.decision?.optimized_apy,
    ...input.publicSignals,
  };
  const envelope = {
    appId: "yieldboost-ai",
    artifactType: "zk-reasoning-proof-envelope",
    proofId,
    createdAt,
    networkKey: input.networkKey,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    verifier,
    proofType,
    envelopeMode: "tee-zk-ready",
    cryptographyClaim:
      "This records a TEE/ZK reasoning commitment envelope; it does not claim a full ZK circuit proof.",
    publicSignals,
    privateInputCommitment,
    reasoningTraceCommitment: sha256Hex(input.reasoning ?? input.decision?.reasoning ?? ""),
    decisionCommitment: sha256Hex(input.decision ?? {}),
    portfolioCommitment: sha256Hex(input.portfolioSnapshot ?? {}),
    summary:
      input.summary ??
      `Reasoning envelope recorded for ${input.decision?.recommended ?? "YieldBoost agent decision"}.`,
  };

  return {
    ...envelope,
    artifactHash: sha256Hex(envelope),
  };
}

export async function createZkReasoningProof(input: CreateZkReasoningProofInput) {
  const payload = buildZkReasoningProofPayload(input);
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload,
    filenamePrefix: "yieldboost-zk-reasoning",
    allowLocalFallback: true,
  });
  const anchor = await anchorReasoningEnvelope({
    cid: upload.cid,
    rootHash: upload.rootHash,
    storageTxHash: upload.txHash,
    networkKey: input.networkKey,
  });
  const record: StoredZkReasoningProof = {
    proofId: payload.proofId,
    proofCid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    networkKey: input.networkKey,
    verifier: payload.verifier,
    proofType: payload.proofType,
    createdAt: payload.createdAt,
    status: resolveStatus(input.networkKey, upload.storageMode),
    summary: payload.summary,
    storageMode: upload.storageMode,
    artifactHash: payload.artifactHash,
    rootHash: upload.rootHash,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    proofRegistryAddress: anchor.proofRegistryAddress,
    proofRegistryTxHash: anchor.proofRegistryTxHash,
    proofRegistryProofId: anchor.proofRegistryProofId,
    proofRegistryExplorerUrl: anchor.proofRegistryExplorerUrl,
    note: joinNotes(upload.note, anchor.note),
  };

  return recordZkReasoningProof(record);
}
