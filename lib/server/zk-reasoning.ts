import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type {
  StoredDecisionPayload,
  StoredPortfolioSnapshot,
  StoredZkReasoningProof,
  ZkReasoningProofStatus,
} from "@/lib/backend-data";
import { type WalletNetworkKey } from "@/lib/wallet";
import { recordZkReasoningProof } from "@/lib/server/runtime-store";
import { recordProofRegistryAnchor } from "@/lib/server/backend-signer";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

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
  return recordProofRegistryAnchor({
    networkKey: input.networkKey,
    cid: input.cid,
    rootHash: input.rootHash,
    storageTxHash: input.storageTxHash,
    currentApyBps: 0,
    optimizedApyBps: 0,
  });
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
