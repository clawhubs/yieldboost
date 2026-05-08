import "server-only";

import { createHash } from "node:crypto";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroHash,
  type LogDescription,
} from "ethers";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import type {
  StoredDecisionPayload,
  StoredGovernanceDecision,
  StoredPortfolioSnapshot,
  StoredProofRecord,
  StoredZkComplianceProof,
} from "@/lib/backend-data";
import {
  getServer0GNetworkConfig,
  type WalletNetworkKey,
} from "@/lib/wallet";
import { recordZkComplianceProof } from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
  "function recordProof(string cid, bytes32 rootHash, bytes32 storageTxHash, uint256 currentApyBps, uint256 optimizedApyBps) external returns (uint256 proofId)",
] as const;

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
  const config = getServer0GNetworkConfig(input.networkKey);

  if (!config.rpcUrl || !config.privateKey || !config.proofRegistryAddress) {
    return { note: "proof_registry_not_configured" };
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
      asBytes32(input.rootHash) ?? ZeroHash,
      asBytes32(input.storageTxHash) ?? ZeroHash,
      Math.round(input.decision.current_apy * 100),
      Math.round(input.decision.optimized_apy * 100),
    );
    const receipt = await tx.wait(1).catch(() => null);
    const parsedLogs: Array<LogDescription | null> = (receipt?.logs ?? []).map((log: unknown) => {
      try {
        return proofRegistry.interface.parseLog(
          log as { topics: string[]; data: string },
        );
      } catch {
        return null;
      }
    });
    const proofRecorded = parsedLogs.find(
      (log): log is LogDescription => log?.name === "ProofRecorded",
    );

    return {
      proofRegistryAddress: config.proofRegistryAddress,
      proofRegistryTxHash: tx.hash as string,
      proofRegistryProofId: proofRecorded?.args?.[0]?.toString(),
      proofRegistryExplorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${tx.hash}`,
      note: receipt ? undefined : "pending_registry_receipt",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "proof_registry_failed";
    return {
      note: `proof_registry_failed:${message.slice(0, 160)}`,
    };
  }
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
