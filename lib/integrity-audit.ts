export type IntegrityAuditStatus = "APPROVED" | "REJECTED";

export interface IntegrityAudit {
  status: IntegrityAuditStatus;
  score: number;
  reasons: string[];
  checkedAt: string;
  source: "deterministic-logic-guardrail";
}

export interface AuditableDecision {
  current_apy: number;
  optimized_apy: number;
  yield_increase?: number;
  yield_increase_pct?: number;
  recommended: string;
  confidence?: number;
  executionSeconds?: number;
  estimatedAnnualGain?: number;
  totalPortfolio?: number;
  reasoning?: string;
}

export interface AuditablePortfolioToken {
  symbol: string;
  amount: number;
  valueUSD: number;
}

export interface AuditablePortfolioSnapshot {
  tokens: AuditablePortfolioToken[];
  totalUSD: number;
  currentAPY: number;
  displayTotal?: number;
  displayUnit?: string;
  displayLabel?: string;
}

export interface AuditableProofReference {
  cid?: string;
  txHash?: string;
  decision?: AuditableDecision;
  portfolioSnapshot?: AuditablePortfolioSnapshot;
}

interface AuditInput {
  decision: AuditableDecision;
  portfolioSnapshot?: AuditablePortfolioSnapshot;
  comparisonProof?: AuditableProofReference | null;
  checkedAt?: string;
}

const SOURCE = "deterministic-logic-guardrail" as const;
const MAX_OPTIMIZED_APY = 75;
const MAX_ABSOLUTE_APY_LIFT = 50;
const MAX_RELATIVE_APY_MULTIPLIER = 4;
const MAX_REPORTED_LIFT_PCT = 400;
const HIGH_CONFIDENCE = 85;
const MIN_POSITIVE_BALANCE = 0.000001;

const GENERIC_ROUTE_SYMBOLS = new Set([
  "AI",
  "APY",
  "APR",
  "DEFI",
  "EARN",
  "LP",
  "POOL",
  "ROI",
  "USD",
  "VAULT",
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function getSnapshot(input: AuditInput) {
  return input.portfolioSnapshot ?? input.comparisonProof?.portfolioSnapshot;
}

function getSnapshotTotal(snapshot: AuditablePortfolioSnapshot | undefined) {
  if (!snapshot) {
    return 0;
  }

  if (isFiniteNumber(snapshot.totalUSD) && snapshot.totalUSD > 0) {
    return snapshot.totalUSD;
  }

  return snapshot.tokens.reduce(
    (sum, token) => sum + (isFiniteNumber(token.valueUSD) ? Math.max(0, token.valueUSD) : 0),
    0,
  );
}

function getPositiveSnapshotTokens(snapshot: AuditablePortfolioSnapshot | undefined) {
  if (!snapshot) {
    return [];
  }

  return snapshot.tokens.filter(
    (token) =>
      isFiniteNumber(token.amount) &&
      isFiniteNumber(token.valueUSD) &&
      (token.amount > MIN_POSITIVE_BALANCE || token.valueUSD > MIN_POSITIVE_BALANCE),
  );
}

function getSnapshotSymbols(snapshot: AuditablePortfolioSnapshot | undefined) {
  return new Set(getPositiveSnapshotTokens(snapshot).map((token) => normalizeSymbol(token.symbol)));
}

function extractRouteSymbols(route: string) {
  const matches = route.match(/\b[A-Z0-9]{2,10}\b/g) ?? [];
  return matches
    .map(normalizeSymbol)
    .filter((symbol) => !GENERIC_ROUTE_SYMBOLS.has(symbol));
}

function hasProofEvidence(reference: AuditableProofReference | null | undefined) {
  return Boolean(reference?.cid || reference?.txHash);
}

function getReferenceTotal(input: AuditInput, snapshot: AuditablePortfolioSnapshot | undefined) {
  const snapshotTotal = getSnapshotTotal(snapshot);
  if (snapshotTotal > 0) {
    return snapshotTotal;
  }

  const proofSnapshotTotal = getSnapshotTotal(input.comparisonProof?.portfolioSnapshot);
  if (proofSnapshotTotal > 0) {
    return proofSnapshotTotal;
  }

  const proofTotal = input.comparisonProof?.decision?.totalPortfolio;
  return isFiniteNumber(proofTotal) && proofTotal > 0 ? proofTotal : 0;
}

export function auditOptimizationDecision(input: AuditInput): IntegrityAudit {
  const { decision } = input;
  const snapshot = getSnapshot(input);
  const snapshotTotal = getSnapshotTotal(snapshot);
  const referenceTotal = getReferenceTotal(input, snapshot);
  const positiveTokens = getPositiveSnapshotTokens(snapshot);
  const snapshotSymbols = getSnapshotSymbols(snapshot);
  const rejectReasons: string[] = [];
  const warnings: string[] = [];
  let penalty = 0;

  function reject(reason: string, cost = 35) {
    rejectReasons.push(reason);
    penalty += cost;
  }

  function warn(reason: string, cost = 8) {
    warnings.push(reason);
    penalty += cost;
  }

  if (!decision.recommended?.trim()) {
    reject("Recommended route is empty.");
  }

  if (!isFiniteNumber(decision.current_apy) || !isFiniteNumber(decision.optimized_apy)) {
    reject("APY fields are missing or non-numeric.", 60);
  } else {
    if (decision.current_apy < 0 || decision.optimized_apy < 0) {
      reject("APY values cannot be negative.", 45);
    }

    if (decision.optimized_apy > MAX_OPTIMIZED_APY) {
      reject(`Optimized APY ${decision.optimized_apy}% exceeds the ${MAX_OPTIMIZED_APY}% deterministic guardrail.`, 45);
    }

    const absoluteLift = decision.optimized_apy - decision.current_apy;
    if (absoluteLift > MAX_ABSOLUTE_APY_LIFT) {
      reject(`APY lift ${absoluteLift.toFixed(2)} points is outside the deterministic guardrail.`, 35);
    }

    if (
      decision.current_apy >= 1 &&
      decision.optimized_apy / Math.max(decision.current_apy, 0.01) > MAX_RELATIVE_APY_MULTIPLIER
    ) {
      reject("Optimized APY is more than 4x the current APY baseline.", 30);
    }

    if (decision.optimized_apy < decision.current_apy) {
      warn("Optimized APY is below the current APY baseline.");
    }
  }

  if (isFiniteNumber(decision.yield_increase_pct) && decision.yield_increase_pct > MAX_REPORTED_LIFT_PCT) {
    reject(`Reported APY lift ${decision.yield_increase_pct}% is above the ${MAX_REPORTED_LIFT_PCT}% guardrail.`, 35);
  }

  if (!isFiniteNumber(decision.confidence)) {
    warn("Confidence is missing; treating the recommendation as lower assurance.");
  } else if (decision.confidence < 0 || decision.confidence > 100) {
    reject("Confidence must stay between 0 and 100.", 35);
  }

  const hasCurrentSnapshot = Boolean(snapshot);
  const hasPositiveLiquidity =
    snapshotTotal > MIN_POSITIVE_BALANCE || positiveTokens.length > 0 || referenceTotal > MIN_POSITIVE_BALANCE;
  const predictsYield =
    decision.optimized_apy > 0 ||
    (isFiniteNumber(decision.estimatedAnnualGain) && decision.estimatedAnnualGain > 0) ||
    (isFiniteNumber(decision.yield_increase) && decision.yield_increase > 0);

  if (predictsYield && !hasPositiveLiquidity) {
    reject("Prediction claims yield while snapshot balance/liquidity is zero.", 55);
  }

  if (
    isFiniteNumber(decision.confidence) &&
    decision.confidence >= HIGH_CONFIDENCE &&
    !hasCurrentSnapshot &&
    !hasProofEvidence(input.comparisonProof)
  ) {
    reject("High confidence prediction has no portfolio/proof snapshot evidence.", 45);
  }

  if (
    snapshot?.currentAPY &&
    snapshot.currentAPY > 0 &&
    isFiniteNumber(decision.current_apy)
  ) {
    const baselineDelta = Math.abs(decision.current_apy - snapshot.currentAPY);
    if (baselineDelta > 25) {
      reject("Current APY diverges too far from the portfolio snapshot baseline.", 30);
    } else if (baselineDelta > 8) {
      warn("Current APY differs from the portfolio snapshot baseline.");
    }
  }

  if (
    isFiniteNumber(decision.totalPortfolio) &&
    decision.totalPortfolio > 0 &&
    referenceTotal > 0
  ) {
    const delta = Math.abs(decision.totalPortfolio - referenceTotal);
    const relativeDelta = delta / Math.max(referenceTotal, decision.totalPortfolio);
    if (relativeDelta > 0.8) {
      warn("Predicted portfolio value differs materially from the available snapshot.");
    }
  }

  if (
    isFiniteNumber(decision.estimatedAnnualGain) &&
    decision.estimatedAnnualGain > 0 &&
    referenceTotal > 0 &&
    decision.estimatedAnnualGain > referenceTotal
  ) {
    reject("Estimated annual gain is larger than the available snapshot balance.", 40);
  }

  const routeSymbols = extractRouteSymbols(decision.recommended ?? "");
  const missingRouteSymbols = snapshotSymbols.size
    ? routeSymbols.filter((symbol) => !snapshotSymbols.has(symbol))
    : [];
  if (missingRouteSymbols.length > 0) {
    reject(`Recommended route references asset(s) not present in the snapshot: ${missingRouteSymbols.join(", ")}.`, 35);
  }

  if (
    snapshotSymbols.size > 0 &&
    /\b0g\b/i.test(decision.recommended) &&
    !snapshotSymbols.has("0G")
  ) {
    reject("Recommended 0G route does not match the snapshot assets.", 35);
  }

  const status: IntegrityAuditStatus = rejectReasons.length > 0 ? "REJECTED" : "APPROVED";
  const reasons =
    status === "REJECTED"
      ? rejectReasons
      : warnings.length
        ? warnings
        : [
            "APY projection stays within deterministic guardrail bounds.",
            "Snapshot or proof evidence supports the recommendation.",
            "Route recommendation is compatible with available snapshot symbols.",
          ];

  return {
    status,
    score: roundScore(100 - penalty),
    reasons,
    checkedAt: input.checkedAt ?? new Date().toISOString(),
    source: SOURCE,
  };
}

export function isIntegrityAuditApproved(audit: IntegrityAudit | null | undefined) {
  return audit?.status === "APPROVED";
}
