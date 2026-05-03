import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type {
  AIGovernanceStatus,
  StoredDecisionPayload,
  StoredGovernanceDecision,
  StoredPortfolioSnapshot,
} from "@/lib/backend-data";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import type { WalletNetworkKey } from "@/lib/wallet";
import { recordGovernanceDecision } from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

export interface EvaluateAIGovernanceInput {
  networkKey: WalletNetworkKey;
  walletAddress?: string;
  agentId?: string;
  evaluatedAction?: string;
  decision?: Partial<StoredDecisionPayload>;
  portfolioSnapshot?: StoredPortfolioSnapshot;
  policy?: {
    maxOptimizedApy?: number;
    maxYieldIncreasePct?: number;
    minConfidenceForAutonomy?: number;
    haltAboveRiskScore?: number;
    throttleAboveRiskScore?: number;
    warningAboveRiskScore?: number;
  };
}

type GovernancePolicy = Required<NonNullable<EvaluateAIGovernanceInput["policy"]>>;

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

function hasCompleteDecision(
  decision: Partial<StoredDecisionPayload> | undefined,
): decision is StoredDecisionPayload {
  return Boolean(
    decision &&
      typeof decision.current_apy === "number" &&
      typeof decision.optimized_apy === "number" &&
      typeof decision.recommended === "string",
  );
}

function containsDangerousClaim(value: string | undefined) {
  if (!value) return false;

  return /\b(guaranteed|risk[- ]?free|infinite|100x|private key|seed phrase|bypass|ignore guardrail)\b/i.test(value);
}

function clampRiskScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveGovernanceStatus(
  riskScore: number,
  policy: GovernancePolicy,
): AIGovernanceStatus {
  if (riskScore >= policy.haltAboveRiskScore) return "halted";
  if (riskScore >= policy.throttleAboveRiskScore) return "throttled";
  if (riskScore >= policy.warningAboveRiskScore) return "warning";
  return "active";
}

function getDefaultPolicy(input?: EvaluateAIGovernanceInput["policy"]) {
  return {
    maxOptimizedApy: input?.maxOptimizedApy ?? 42,
    maxYieldIncreasePct: input?.maxYieldIncreasePct ?? 160,
    minConfidenceForAutonomy: input?.minConfidenceForAutonomy ?? 70,
    haltAboveRiskScore: input?.haltAboveRiskScore ?? 85,
    throttleAboveRiskScore: input?.throttleAboveRiskScore ?? 65,
    warningAboveRiskScore: input?.warningAboveRiskScore ?? 45,
  };
}

function buildRiskEvaluation(input: EvaluateAIGovernanceInput) {
  const policy = getDefaultPolicy(input.policy);
  const decision = input.decision;
  const deterministicReasons: string[] = [];
  let riskScore = 12;

  if (!decision) {
    deterministicReasons.push("No strategy decision supplied; governance records configuration readiness only.");
  }

  if (hasCompleteDecision(decision)) {
    const currentApy = Math.max(decision.current_apy, 0.01);
    const optimizedApy = decision.optimized_apy;
    const yieldIncreasePct =
      typeof decision.yield_increase_pct === "number"
        ? decision.yield_increase_pct
        : ((optimizedApy - currentApy) / currentApy) * 100;

    if (optimizedApy > policy.maxOptimizedApy) {
      riskScore += 34;
      deterministicReasons.push(
        `Optimized APY ${optimizedApy.toFixed(2)}% exceeds policy cap ${policy.maxOptimizedApy.toFixed(2)}%.`,
      );
    }

    if (yieldIncreasePct > policy.maxYieldIncreasePct) {
      riskScore += 24;
      deterministicReasons.push(
        `Yield increase ${yieldIncreasePct.toFixed(2)}% exceeds deviation cap ${policy.maxYieldIncreasePct.toFixed(2)}%.`,
      );
    }

    if (
      typeof decision.confidence === "number" &&
      decision.confidence < policy.minConfidenceForAutonomy
    ) {
      riskScore += 12;
      deterministicReasons.push(
        `Confidence ${decision.confidence}% is below autonomous execution minimum ${policy.minConfidenceForAutonomy}%.`,
      );
    }

    if (
      typeof decision.estimatedAnnualGain === "number" &&
      typeof decision.totalPortfolio === "number" &&
      decision.totalPortfolio > 0 &&
      decision.estimatedAnnualGain > decision.totalPortfolio * 0.45
    ) {
      riskScore += 18;
      deterministicReasons.push("Projected annual gain is too large relative to portfolio size.");
    }

    if (
      containsDangerousClaim(decision.recommended) ||
      containsDangerousClaim(decision.reasoning)
    ) {
      riskScore += 30;
      deterministicReasons.push("Decision text contains a deterministic dangerous-claim pattern.");
    }

    const audit = auditOptimizationDecision({
      decision,
      portfolioSnapshot: input.portfolioSnapshot,
    });

    if (audit.status === "REJECTED") {
      riskScore = Math.max(riskScore, 90);
      deterministicReasons.push(...audit.reasons);
    }
  }

  if (!deterministicReasons.length) {
    deterministicReasons.push("Decision stayed inside deterministic governance policy limits.");
  }

  const normalizedRiskScore = clampRiskScore(riskScore);
  const status = resolveGovernanceStatus(normalizedRiskScore, policy);

  return {
    status,
    riskScore: normalizedRiskScore,
    killSwitchTriggered: status === "halted",
    reason: deterministicReasons[0],
    deterministicReasons,
    policy,
  };
}

export async function evaluateAIGovernance(
  input: EvaluateAIGovernanceInput,
): Promise<StoredGovernanceDecision> {
  const createdAt = new Date().toISOString();
  const governanceId = `gov-${randomUUID()}`;
  const evaluation = buildRiskEvaluation(input);
  const payload = {
    appId: "yieldboost-ai",
    artifactType: "ai-governance-decision",
    governanceId,
    createdAt,
    networkKey: input.networkKey,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    evaluatedAction: input.evaluatedAction ?? "yield-strategy-decision",
    decision: input.decision,
    portfolioSnapshot: input.portfolioSnapshot,
    status: evaluation.status,
    riskScore: evaluation.riskScore,
    killSwitchTriggered: evaluation.killSwitchTriggered,
    reason: evaluation.reason,
    deterministicReasons: evaluation.deterministicReasons,
    policy: evaluation.policy,
    scopeDigest: sha256Hex({
      walletAddress: input.walletAddress,
      agentId: input.agentId,
      evaluatedAction: input.evaluatedAction,
      decision: input.decision,
    }),
  };
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload,
    filenamePrefix: "yieldboost-governance",
    allowLocalFallback: true,
  });
  const record: StoredGovernanceDecision = {
    governanceId,
    status: evaluation.status,
    reason: evaluation.reason,
    riskScore: evaluation.riskScore,
    killSwitchTriggered: evaluation.killSwitchTriggered,
    artifactCid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    networkKey: input.networkKey,
    createdAt,
    storageMode: upload.storageMode,
    walletAddress: input.walletAddress,
    agentId: input.agentId,
    evaluatedAction: payload.evaluatedAction,
    deterministicReasons: evaluation.deterministicReasons,
    note: upload.note,
  };

  return recordGovernanceDecision(record);
}

export function shouldBlockGovernanceDecision(
  decision: StoredGovernanceDecision,
) {
  return decision.killSwitchTriggered || decision.status === "halted";
}
