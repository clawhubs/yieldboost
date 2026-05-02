import "server-only";

import { randomUUID } from "node:crypto";
import type {
  StoredDecisionPayload,
  StoredPortfolioSnapshot,
  StoredStressTestReport,
} from "@/lib/backend-data";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import type { WalletNetworkKey } from "@/lib/wallet";
import { recordStressTestReport } from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

interface HistoricalPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const DEFAULT_HISTORICAL_SLICE: HistoricalPoint[] = [
  { timestamp: "2026-04-24T00:00:00.000Z", open: 1, high: 1.08, low: 0.96, close: 1.04, volume: 184000 },
  { timestamp: "2026-04-25T00:00:00.000Z", open: 1.04, high: 1.12, low: 0.99, close: 1.1, volume: 231000 },
  { timestamp: "2026-04-26T00:00:00.000Z", open: 1.1, high: 1.14, low: 0.88, close: 0.91, volume: 420000 },
  { timestamp: "2026-04-27T00:00:00.000Z", open: 0.91, high: 0.98, low: 0.72, close: 0.86, volume: 398000 },
  { timestamp: "2026-04-28T00:00:00.000Z", open: 0.86, high: 0.94, low: 0.84, close: 0.92, volume: 252000 },
  { timestamp: "2026-04-29T00:00:00.000Z", open: 0.92, high: 1.03, low: 0.9, close: 1.01, volume: 210000 },
];

function buildSnapshot(totalUSD: number): StoredPortfolioSnapshot {
  return {
    tokens: [
      { symbol: "USDC", amount: totalUSD * 0.55, valueUSD: totalUSD * 0.55 },
      { symbol: "0G", amount: totalUSD * 0.3, valueUSD: totalUSD * 0.3 },
      { symbol: "BONZO", amount: totalUSD * 0.15, valueUSD: totalUSD * 0.15 },
    ],
    totalUSD,
    currentAPY: 12.38,
  };
}

function buildDecision(point: HistoricalPoint, index: number): StoredDecisionPayload {
  const drawdown = (point.high - point.low) / Math.max(point.high, 0.0001);
  const suspiciousApy = drawdown > 0.2 ? 58 + index : 23.84;

  return {
    current_apy: 12.38,
    optimized_apy: suspiciousApy,
    yield_increase: suspiciousApy > 40 ? 8000 : 2350,
    yield_increase_pct: suspiciousApy > 40 ? 470 : 23.61,
    recommended: suspiciousApy > 40 ? "USDC 0G BONZO emergency high APY vault" : "SaucerSwap LP",
    confidence: suspiciousApy > 40 ? 97 : 91,
    totalPortfolio: 24570.25,
    estimatedAnnualGain: suspiciousApy > 40 ? 8000 : 2350,
    reasoning:
      suspiciousApy > 40
        ? "Standard agent accepted a volatile oracle slice and projected an unrealistic APY spike."
        : "Auditor accepted a bounded APY route under normal volatility.",
  };
}

export async function runMultiverseStressTest(input: {
  agentId?: string;
  tokenId?: string;
  walletAddress?: string;
  networkKey: WalletNetworkKey;
  datasetCid?: string;
  historicalSlice?: HistoricalPoint[];
}) {
  const timestamp = new Date().toISOString();
  const agentId =
    input.agentId ??
    input.tokenId ??
    input.walletAddress ??
    "yieldboost-default-agent";
  const datasetCid = input.datasetCid ?? "builtin-ohclv-0g-volatility-slice";
  const historicalSlice = input.historicalSlice?.length
    ? input.historicalSlice
    : DEFAULT_HISTORICAL_SLICE;
  const snapshot = buildSnapshot(24570.25);

  const decisions = historicalSlice.map((point, index) => {
    const decision = buildDecision(point, index);
    const audit = auditOptimizationDecision({
      decision,
      portfolioSnapshot: snapshot,
      checkedAt: point.timestamp,
    });

    return {
      timestamp: point.timestamp,
      marketClose: point.close,
      standardAgentApy: decision.optimized_apy,
      auditorApy: audit.status === "APPROVED" ? decision.optimized_apy : 23.84,
      auditorDecision: audit.status,
      reason: audit.reasons[0] ?? "Auditor completed deterministic replay.",
    };
  });

  const rejectedCount = decisions.filter(
    (decision) => decision.auditorDecision === "REJECTED",
  ).length;
  const avgAuditorApy =
    decisions.reduce((sum, decision) => sum + decision.auditorApy, 0) /
    Math.max(decisions.length, 1);
  const avgStandardApy =
    decisions.reduce((sum, decision) => sum + decision.standardAgentApy, 0) /
    Math.max(decisions.length, 1);
  const simulatedProfit = Number(
    ((avgAuditorApy - 12.38) / 100 * snapshot.totalUSD).toFixed(2),
  );
  const maxDrawdown = Number(
    Math.max(
      ...historicalSlice.map((point) => (point.high - point.low) / point.high),
    ).toFixed(4),
  );
  const verdict =
    rejectedCount >= 2 && avgAuditorApy < avgStandardApy ? "PASS" : rejectedCount > 0 ? "WATCH" : "FAIL";
  const reportPayload = {
    appId: "yieldboost-ai",
    artifactType: "multiverse-stress-test-report",
    timestamp,
    networkKey: input.networkKey,
    agentId,
    tokenId: input.tokenId,
    walletAddress: input.walletAddress,
    datasetCid,
    baselineApy: 12.38,
    verifiedApy: Number(avgAuditorApy.toFixed(2)),
    standardApy: Number(avgStandardApy.toFixed(2)),
    simulatedProfit,
    maxDrawdown,
    rejectedCount,
    decisions,
    verdict,
  };
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload: reportPayload,
    filenamePrefix: "yieldboost-stress-report",
    allowLocalFallback: true,
  });
  const report: StoredStressTestReport = {
    id: randomUUID(),
    agentId,
    tokenId: input.tokenId,
    walletAddress: input.walletAddress,
    networkKey: input.networkKey,
    datasetCid,
    reportCid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    baselineApy: 12.38,
    verifiedApy: Number(avgAuditorApy.toFixed(2)),
    simulatedProfit,
    maxDrawdown,
    decisions,
    verdict,
    timestamp,
    storageMode: upload.storageMode,
    note: upload.note,
  };

  return recordStressTestReport(report);
}
