import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type {
  CrossAgentHandshakeStatus,
  StoredCrossAgentHandshake,
} from "@/lib/backend-data";
import type { WalletNetworkKey } from "@/lib/wallet";
import { recordCrossAgentHandshake } from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

export interface CreateCrossAgentHandshakeInput {
  networkKey: WalletNetworkKey;
  requestingAgent: string;
  respondingAgent: string;
  handshakeType?: string;
  skillPurpose?: string;
  walletAddress?: string;
  transcript?: Array<{
    role: "requester" | "responder" | "system";
    content: string;
  }>;
  summary?: string;
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

function sha256Hex(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function resolveHandshakeStatus(input: CreateCrossAgentHandshakeInput): CrossAgentHandshakeStatus {
  const purpose = `${input.skillPurpose ?? ""} ${input.summary ?? ""}`;

  if (/\b(private key|seed phrase|bypass|disable guardrail|ignore policy)\b/i.test(purpose)) {
    return "rejected";
  }

  if (!input.requestingAgent || !input.respondingAgent) {
    return "pending";
  }

  return "completed";
}

function defaultTranscript(input: CreateCrossAgentHandshakeInput) {
  return [
    {
      role: "requester" as const,
      content: `${input.requestingAgent} requests ${input.handshakeType ?? "neural-handshake"} for ${input.skillPurpose ?? "strategy validation"}.`,
    },
    {
      role: "responder" as const,
      content: `${input.respondingAgent} acknowledges purpose, scope, and deterministic audit boundaries.`,
    },
  ];
}

export async function createCrossAgentHandshake(
  input: CreateCrossAgentHandshakeInput,
): Promise<StoredCrossAgentHandshake> {
  const createdAt = new Date().toISOString();
  const handshakeId = `handshake-${randomUUID()}`;
  const handshakeType = input.handshakeType ?? "cross-agent-neural-handshake";
  const transcript = input.transcript?.length ? input.transcript : defaultTranscript(input);
  const transcriptDigest = sha256Hex(transcript);
  const status = resolveHandshakeStatus(input);
  const summary =
    input.summary ??
    `${input.requestingAgent} and ${input.respondingAgent} recorded a ${handshakeType} session for ${input.skillPurpose ?? "YieldBoost strategy coordination"}.`;
  const payload = {
    appId: "yieldboost-ai",
    artifactType: "cross-agent-neural-handshake",
    handshakeId,
    createdAt,
    networkKey: input.networkKey,
    walletAddress: input.walletAddress,
    requestingAgent: input.requestingAgent,
    respondingAgent: input.respondingAgent,
    handshakeType,
    skillPurpose: input.skillPurpose,
    status,
    summary,
    transcript,
    transcriptDigest,
    proofEnvelope: {
      requesterCommitment: sha256Hex({
        agent: input.requestingAgent,
        role: "requester",
        transcriptDigest,
      }),
      responderCommitment: sha256Hex({
        agent: input.respondingAgent,
        role: "responder",
        transcriptDigest,
      }),
      scopeCommitment: sha256Hex({
        handshakeType,
        skillPurpose: input.skillPurpose,
        walletAddress: input.walletAddress,
      }),
    },
  };
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload,
    filenamePrefix: "yieldboost-agent-handshake",
    allowLocalFallback: true,
  });
  const record: StoredCrossAgentHandshake = {
    handshakeId,
    requestingAgent: input.requestingAgent,
    respondingAgent: input.respondingAgent,
    handshakeType,
    artifactCid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    networkKey: input.networkKey,
    status,
    createdAt,
    summary,
    storageMode: upload.storageMode,
    skillPurpose: input.skillPurpose,
    walletAddress: input.walletAddress,
    transcriptDigest,
    note: upload.note,
  };

  return recordCrossAgentHandshake(record);
}
