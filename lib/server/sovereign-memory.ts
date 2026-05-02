import "server-only";

import { randomUUID } from "node:crypto";
import type {
  StoredAgentMemoryRecord,
  StoredProofRecord,
} from "@/lib/backend-data";
import type { WalletNetworkKey } from "@/lib/wallet";
import {
  getLatestAgentMemory,
  recordAgentMemory,
} from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

function nextMemoryVersion(previous: StoredAgentMemoryRecord | null) {
  return (previous?.memoryVersion ?? 0) + 1;
}

export async function syncSovereignMemory(input: {
  agentId?: string;
  tokenId?: string;
  walletAddress?: string;
  networkKey: WalletNetworkKey;
  proof?: StoredProofRecord;
  contextSummary?: string;
  recentTask?: string;
}) {
  const timestamp = new Date().toISOString();
  const agentId =
    input.agentId ??
    input.tokenId ??
    input.walletAddress ??
    "yieldboost-default-agent";
  const previous = await getLatestAgentMemory(agentId, input.networkKey);
  const memoryVersion = nextMemoryVersion(previous);
  const snapshot = {
    contextSummary:
      input.contextSummary ??
      input.proof?.decision.reasoning ??
      "YieldBoost agent context snapshot synced after proof processing.",
    recentTask:
      input.recentTask ??
      input.proof?.decision.recommended ??
      "Portfolio optimization audit",
    lastRecommendation: input.proof?.decision.recommended,
    auditStatus: input.proof?.integrityAudit?.status,
    proofCid: input.proof?.cid,
  };
  const storagePayload = {
    appId: "yieldboost-ai",
    artifactType: "sovereign-memory-snapshot",
    timestamp,
    networkKey: input.networkKey,
    agentId,
    tokenId: input.tokenId,
    walletAddress: input.walletAddress ?? input.proof?.walletAddress,
    proofCid: input.proof?.cid,
    memoryVersion,
    previousMemoryCid: previous?.cid,
    snapshot,
  };
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload: storagePayload,
    filenamePrefix: "yieldboost-memory",
    allowLocalFallback: true,
  });
  const record: StoredAgentMemoryRecord = {
    id: randomUUID(),
    agentId,
    tokenId: input.tokenId,
    walletAddress: input.walletAddress ?? input.proof?.walletAddress,
    networkKey: input.networkKey,
    cid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    proofCid: input.proof?.cid,
    memoryVersion,
    snapshot,
    timestamp,
    storageMode: upload.storageMode,
    note: upload.note,
  };

  return recordAgentMemory(record);
}
