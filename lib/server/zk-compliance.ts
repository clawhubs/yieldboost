import "server-only";

import { createHash } from "node:crypto";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import type {
  StoredDecisionPayload,
  StoredGovernanceDecision,
  StoredPortfolioSnapshot,
  StoredProofRecord,
  StoredZkComplianceProof,
} from "@/lib/backend-data";
import { type WalletNetworkKey } from "@/lib/wallet";
import { recordZkComplianceProof } from "@/lib/server/runtime-store";
import { recordProofRegistryAnchor } from "@/lib/server/backend-signer";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

export interface CreateZkComplianceProofInput {
  networkKey: WalletNetworkKey;
  walletAddress?: string;
  agentId?: string;
  decision: StoredDecisionPayload;
  portfolioSnapshot?: StoredPortfolioSnapshot;
  governanceDecision: StoredGovernanceDecision;
  proof?: StoredProofRecord | null;
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

function asBytes32(value: string | undefined) {
  return value && /^0x[a-fA-F0-9]{64}$/.test(value) ? value : undefined;
}

function joinNotes(...notes: Array<string | undefined>) {
  const values = notes.filter(Boolean);
  return values.length ? values.join(",") : undefined;
}

async function anchorComplianceArtifact(input: {
  cid: string;
  rootHash?: string;
  storageTxHash?: string;
  networkKey: WalletNetworkKey;
  decision: StoredDecisionPayload;
}) {
  return recordProofRegistryAnchor({
    networkKey: input.networkKey,
    cid: input.cid,
    rootHash: asBytes32(input.rootHash),
    storageTxHash: asBytes32(input.storageTxHash),
    currentApyBps: Math.round(input.decision.current_apy * 100),
    optimizedApyBps: Math.round(input.decision.optimized_apy * 100),
  });
}

export function buildDeterministicCompliancePayload(
  input: CreateZkComplianceProofInput,
) {
  const createdAt = new Date().toISOString();
  const integrityAudit =
    input.proof?.integrityAudit ??
    auditOptimizationDecision({
      decision: input.decision,
      portfolioSnapshot: input.portfolioSnapshot,
    });
  const decisionCommitment = `0x${sha256Hex(input.decision)}`;
  const portfolioCommitment = `0x${sha256Hex(input.portfolioSnapshot ?? {})}`;
  const policyDigest = `0x${sha256Hex({
    governanceStatus: input.governanceDecision.status,
    riskScore: input.governanceDecision.riskScore,
    deterministicReasons: input.governanceDecision.deterministicReasons,
  })}`;
  const witnessDigest = `0x${sha256Hex({
    decisionCommitment,
    portfolioCommitment,
    policyDigest,
    integrityStatus: integrityAudit.status,
    proofCid: input.proof?.cid,
  })}`;
  const compliant =
    integrityAudit.status === "APPROVED" &&
    input.governanceDecision.status === "active" &&
    !input.governanceDecision.killSwitchTriggered;
  const proofId = witnessDigest;

  return {
    appId: "yieldboost-ai",
    artifactType: "zk-policy-seal-proof",
    proofId,
    createdAt,
    networkKey: input.networkKey,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    proofType: "Deterministic optimizer + governance policy seal",
    verifier: "YieldBoost deterministic policy verifier",
    verificationMode: "deterministic-commitment-v1",
    cryptographyClaim:
      "This proof seals deterministic optimizer and governance policy checks from committed inputs; it is structured for a future prover swap.",
    publicStatement: {
      recommended: input.decision.recommended,
      currentApy: input.decision.current_apy,
      optimizedApy: input.decision.optimized_apy,
      governanceStatus: input.governanceDecision.status,
      riskScore: input.governanceDecision.riskScore,
      integrityStatus: integrityAudit.status,
      policyCompliantPct: compliant ? 100 : 0,
    },
    commitments: {
      decisionCommitment,
      portfolioCommitment,
      policyDigest,
      witnessDigest,
    },
    summary: compliant
      ? `Deterministic policy verifier sealed the latest strategy run with a 100% policy match.`
      : `Deterministic policy verifier found a governance or integrity mismatch.`,
    compliant,
    integrityReasons: integrityAudit.reasons,
    governanceReasons: input.governanceDecision.deterministicReasons,
  };
}

export async function createZkComplianceProof(
  input: CreateZkComplianceProofInput,
): Promise<StoredZkComplianceProof> {
  const payload = buildDeterministicCompliancePayload(input);
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload,
    filenamePrefix: "yieldboost-zk-compliance",
    allowLocalFallback: true,
  });
  const anchor = await anchorComplianceArtifact({
    cid: upload.cid,
    rootHash: upload.rootHash,
    storageTxHash: upload.txHash,
    networkKey: input.networkKey,
    decision: input.decision,
  });

  return recordZkComplianceProof({
    proofId: payload.proofId,
    artifactCid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    networkKey: input.networkKey,
    proofType: payload.proofType,
    verifier: payload.verifier,
    status: payload.compliant ? "verified" : "failed",
    policyCompliantPct: payload.publicStatement.policyCompliantPct,
    governanceStatus: input.governanceDecision.status,
    riskScore: input.governanceDecision.riskScore,
    createdAt: payload.createdAt,
    storageMode: upload.storageMode,
    summary: payload.summary,
    decisionCommitment: payload.commitments.decisionCommitment,
    portfolioCommitment: payload.commitments.portfolioCommitment,
    policyDigest: payload.commitments.policyDigest,
    witnessDigest: payload.commitments.witnessDigest,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    proofRegistryAddress: anchor.proofRegistryAddress,
    proofRegistryTxHash: anchor.proofRegistryTxHash,
    proofRegistryProofId: anchor.proofRegistryProofId,
    proofRegistryExplorerUrl: anchor.proofRegistryExplorerUrl,
    note: joinNotes(upload.note, anchor.note),
  });
}
