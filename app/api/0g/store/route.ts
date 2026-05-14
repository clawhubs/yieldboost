import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  type StoredProofRecord,
  type StoredDecisionPayload,
  type StoredPortfolioSnapshot,
} from "@/lib/backend-data";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import {
  getServer0GNetworkConfig,
  getServerDefaultNetworkKey,
  resolveWalletNetworkKey,
  type WalletNetworkKey,
} from "@/lib/wallet";
import {
  getLatestStoredProofForWallet,
  recordStoredProof,
} from "@/lib/server/runtime-store";
import { evaluateAIGovernance } from "@/lib/server/ai-governance";
import { createCrossAgentHandshake } from "@/lib/server/cross-agent-handshake";
import { recordHallucinationBlacklistEntry } from "@/lib/server/hallucination-blacklist";
import { syncSovereignMemory } from "@/lib/server/sovereign-memory";
import { createZkComplianceProof } from "@/lib/server/zk-compliance";
import { createZkReasoningProof } from "@/lib/server/zk-reasoning";
import { createSentinelAgentIdentityProof } from "@/lib/server/sentinel-agent-identity";
import { recordProofRegistryAnchor } from "@/lib/server/backend-signer";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

export const runtime = "nodejs";

const decisionSchema = z.object({
  current_apy: z.number(),
  optimized_apy: z.number(),
  yield_increase: z.number(),
  yield_increase_pct: z.number(),
  recommended: z.string(),
  confidence: z.number(),
  executionSeconds: z.number().optional(),
  estimatedAnnualGain: z.number().optional(),
  totalPortfolio: z.number().optional(),
  reasoning: z.string().optional(),
});

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional();
const portfolioSnapshotSchema = z
  .object({
    tokens: z.array(
      z.object({
        symbol: z.string(),
        amount: z.number(),
        valueUSD: z.number(),
      }),
    ),
    totalUSD: z.number(),
    currentAPY: z.number(),
    displayTotal: z.number().optional(),
    displayUnit: z.string().optional(),
    displayLabel: z.string().optional(),
  })
  .optional();

function resolveMainnetFirstNetwork(value: string | null | undefined): WalletNetworkKey {
  return value ? resolveWalletNetworkKey(value) : getServerDefaultNetworkKey();
}

function toBasisPoints(value: number) {
  return Math.round(value * 100);
}

function joinNotes(...notes: Array<string | undefined>) {
  const values = notes.filter(Boolean);
  return values.length ? values.join(",") : undefined;
}

async function runBackgroundIntegrityStack(input: {
  networkKey: WalletNetworkKey;
  walletAddress: string;
  proof: StoredProofRecord;
  decision: StoredDecisionPayload;
  portfolioSnapshot?: StoredPortfolioSnapshot;
}) {
  const { decision, networkKey, portfolioSnapshot, proof, walletAddress } = input;

  const memoryRecord = await syncSovereignMemory({
    agentId: walletAddress,
    walletAddress,
    networkKey,
    proof,
  }).catch((error) => {
    console.warn("[sovereign-memory] Memory sync failed:", error);
    return null;
  });

  const zkReasoningProof = await createZkReasoningProof({
    networkKey,
    walletAddress,
    agentId: walletAddress,
    decision,
    portfolioSnapshot,
    reasoning: decision.reasoning,
    summary: `TEE/ZK reasoning envelope recorded after proof ${proof.cid}.`,
  }).catch((error) => {
    console.warn("[zk-reasoning] ZK reasoning envelope sync failed:", error);
    return null;
  });

  const governanceDecision = await evaluateAIGovernance({
    networkKey,
    walletAddress,
    agentId: walletAddress,
    evaluatedAction: "proof-storage-follow-up",
    decision,
    portfolioSnapshot,
  }).catch((error) => {
    console.warn("[ai-governance] Governance evaluation sync failed:", error);
    return null;
  });

  const crossAgentHandshake = await createCrossAgentHandshake({
    networkKey,
    walletAddress,
    requestingAgent: "YieldBoost Optimizer Agent",
    respondingAgent: "Integrity Auditor Agent",
    handshakeType: "cross-agent-neural-handshake",
    skillPurpose: "Cross-check proof-backed yield reasoning after storage",
    transcript: [
      {
        role: "requester",
        content: `YieldBoost Optimizer Agent requests a deterministic follow-up review for proof ${proof.cid}.`,
      },
      {
        role: "responder",
        content: `Integrity Auditor Agent confirms the reasoning envelope, governance policy, and stored proof metadata for ${networkKey}.`,
      },
      {
        role: "system",
        content: `Proof tx ${proof.txHash} and storage CID ${proof.cid} were recorded before the handshake envelope was persisted.`,
      },
    ],
    summary: `Handshake recorded after proof ${proof.cid} to align optimizer and auditor agents.`,
  }).catch((error) => {
    console.warn("[cross-agent-handshake] Neural handshake sync failed:", error);
    return null;
  });

  const zkComplianceProof = governanceDecision
    ? await createZkComplianceProof({
        networkKey,
        walletAddress,
        agentId: walletAddress,
        decision,
        portfolioSnapshot,
        governanceDecision,
        proof,
      }).catch((error) => {
        console.warn("[zk-compliance] Deterministic compliance proof sync failed:", error);
        return null;
      })
    : null;

  return {
    memoryRecord,
    zkReasoningProof,
    governanceDecision,
    crossAgentHandshake,
    zkComplianceProof,
  };
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as {
    decision?: unknown;
    portfolioSnapshot?: unknown;
    networkKey?: WalletNetworkKey;
    walletAddress?: string;
    proofRegistryMode?: "backend" | "user";
    // TEE metadata from client
    teeProvider?: string;
    teeModel?: string;
    teeChatId?: string;
    teeVerified?: boolean;
    teeVerificationMethod?: string;
    teeSignedTextMatches?: boolean;
    teeServiceAttestationVerified?: boolean;
    teeServiceSignerMatched?: boolean;
    teeServiceComposeVerified?: boolean;
    llmProvider?: string;
  };
  const decision = decisionSchema.parse(payload.decision) as StoredDecisionPayload;
  const portfolioSnapshot = portfolioSnapshotSchema.parse(
    payload.portfolioSnapshot,
  ) as StoredPortfolioSnapshot | undefined;
  const walletAddress = walletAddressSchema.safeParse(payload.walletAddress).data;
  const networkKey = resolveMainnetFirstNetwork(payload.networkKey);
  const proofRegistryMode = payload.proofRegistryMode === "user" ? "user" : "backend";
  const config = getServer0GNetworkConfig(networkKey);
  const comparisonProof = walletAddress
    ? await getLatestStoredProofForWallet(walletAddress, networkKey)
    : null;
  const integrityAudit = auditOptimizationDecision({
    decision,
    portfolioSnapshot,
    comparisonProof,
  });

  if (integrityAudit.status === "REJECTED") {
    const blacklistEntry = await recordHallucinationBlacklistEntry({
      networkKey,
      decision,
      portfolioSnapshot,
      audit: integrityAudit,
    }).catch((error) => {
      console.warn("[integrity-audit] Blacklist indexing failed:", error);
      return null;
    });

    return NextResponse.json(
      {
        success: false,
        error: "Integrity Auditor rejected this optimization; proof write skipped.",
        integrityAudit,
        blacklistEntry,
      },
      { status: 422 },
    );
  }

  if (!config.storageUrl || !config.rpcUrl || !config.privateKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "0G storage is not configured. Set ZG_STORAGE_URL, ZG_RPC_URL, and ZG_PRIVATE_KEY.",
      },
      { status: 503 },
    );
  }

  const timestamp = new Date().toISOString();
  const sentinelProof = await createSentinelAgentIdentityProof({
    networkKey,
    walletAddress,
    operation: "one-click-optimize",
    actionContext: {
      timestamp,
      recommended: decision.recommended,
      currentApy: decision.current_apy,
      optimizedApy: decision.optimized_apy,
      proofRegistryMode,
      portfolioTotal: portfolioSnapshot?.totalUSD,
    },
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "sentinel_failed";
    console.warn("[sentinel-agent-identity] Proof generation failed:", message);
    return null;
  });
  const proofPayload = {
    appId: "yieldboost-ai",
    timestamp,
    networkKey,
    walletAddress: walletAddress ?? undefined,
    decision,
    portfolioSnapshot,
    integrityAudit,
    sentinelProof,
    teeProvider: payload.teeProvider,
    teeModel: payload.teeModel,
    teeChatId: payload.teeChatId,
    teeVerified: payload.teeVerified,
    teeVerificationMethod: payload.teeVerificationMethod,
    teeSignedTextMatches: payload.teeSignedTextMatches,
    teeServiceAttestationVerified: payload.teeServiceAttestationVerified,
    teeServiceSignerMatched: payload.teeServiceSignerMatched,
    teeServiceComposeVerified: payload.teeServiceComposeVerified,
    llmProvider: payload.llmProvider,
  };

  try {
    const upload = await uploadJsonToZeroGStorage({
      networkKey,
      payload: proofPayload,
      filenamePrefix: "yieldboost-proof",
      allowLocalFallback: false,
      priority: "high",
    });

    const proof: StoredProofRecord = {
      cid: upload.cid,
      rootHash: upload.rootHash,
      txHash: upload.txHash ?? "",
      blockNumber: upload.blockNumber ?? 0,
      timestamp,
      networkKey,
      explorerUrl: upload.explorerUrl ?? "",
      decision,
      walletAddress,
      portfolioSnapshot,
      integrityAudit,
      sentinelProof,
      note: upload.note,
      // TEE / 0G Compute metadata
      teeProvider: payload.teeProvider,
      teeModel: payload.teeModel,
      teeChatId: payload.teeChatId,
      teeVerified: payload.teeVerified,
      teeVerificationMethod: payload.teeVerificationMethod,
      teeSignedTextMatches: payload.teeSignedTextMatches,
      teeServiceAttestationVerified: payload.teeServiceAttestationVerified,
      teeServiceSignerMatched: payload.teeServiceSignerMatched,
      teeServiceComposeVerified: payload.teeServiceComposeVerified,
      llmProvider: payload.llmProvider,
    };

    if (!config.proofRegistryAddress) {
      proof.note = joinNotes(proof.note, "proof_registry_not_configured");
    }

    if (config.proofRegistryAddress && proofRegistryMode === "backend") {
      const anchor = await recordProofRegistryAnchor({
        networkKey,
        cid: upload.cid,
        rootHash: upload.rootHash,
        storageTxHash: upload.txHash,
        currentApyBps: toBasisPoints(decision.current_apy),
        optimizedApyBps: toBasisPoints(decision.optimized_apy),
        priority: "high",
      });

      proof.proofRegistryAddress = anchor.proofRegistryAddress;
      proof.proofRegistryTxHash = anchor.proofRegistryTxHash;
      proof.proofRegistryProofId = anchor.proofRegistryProofId;
      proof.proofRegistryExplorerUrl = anchor.proofRegistryExplorerUrl;
      proof.note = joinNotes(proof.note, anchor.note);
    } else if (config.proofRegistryAddress && proofRegistryMode === "user") {
      proof.proofRegistryAddress = config.proofRegistryAddress;
      proof.note = joinNotes(proof.note, "awaiting_user_registry_signature");
    }

    await recordStoredProof(proof);

    if (proof.walletAddress) {
      void runBackgroundIntegrityStack({
        networkKey,
        walletAddress: proof.walletAddress,
        proof,
        decision,
        portfolioSnapshot,
      }).catch((error) => {
        console.warn("[integrity-stack] Background integrity stack failed:", error);
      });
    }

    return NextResponse.json({
      success: true,
      cid: proof.cid,
      rootHash: upload.rootHash,
      txHash: proof.txHash,
      blockNumber: proof.blockNumber,
      timestamp: proof.timestamp,
      networkKey: proof.networkKey,
      explorerUrl: proof.explorerUrl,
      walletAddress: proof.walletAddress,
      proofRegistryAddress: proof.proofRegistryAddress,
      proofRegistryTxHash: proof.proofRegistryTxHash,
      proofRegistryProofId: proof.proofRegistryProofId,
      proofRegistryExplorerUrl: proof.proofRegistryExplorerUrl,
      proofRegistryMode,
      integrityAudit: proof.integrityAudit,
      sentinelProof: proof.sentinelProof,
      backgroundIntegrityStatus: "syncing",
      note: proof.note,
      teeProvider: proof.teeProvider,
      teeModel: proof.teeModel,
      teeChatId: proof.teeChatId,
      teeVerified: proof.teeVerified,
      teeVerificationMethod: proof.teeVerificationMethod,
      teeSignedTextMatches: proof.teeSignedTextMatches,
      teeServiceAttestationVerified: proof.teeServiceAttestationVerified,
      teeServiceSignerMatched: proof.teeServiceSignerMatched,
      teeServiceComposeVerified: proof.teeServiceComposeVerified,
      llmProvider: proof.llmProvider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown 0G storage error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 502 },
    );
  }
}
