import { z } from "zod";

export type OptimizationState = "analyzing" | "optimizing" | "executing" | "done";
export type FeedState = "analyzing" | "optimizing" | "complete";
export type RiskBand = "low" | "medium" | "high";

export interface TopProtocol {
  name: string;
  apy: number;
  risk: RiskBand;
}

export interface OptimizationResult {
  current_apy: number;
  optimized_apy: number;
  yield_increase: number;
  yield_increase_pct: number;
  top_protocols: TopProtocol[];
  recommended: string;
  confidence: number;
  reasoning?: string;
  storageProof?: string;
  txHash?: string;
  timestamp: string;
  executionSeconds: number;
  estimatedAnnualGain: number;
  totalPortfolio: number;
  riskProfile: "Low" | "Moderate" | "High";
  proofUrl?: string;
  walletAddress?: string;
  proofRegistryAddress?: string;
  proofRegistryTxHash?: string;
  proofRegistryProofId?: string;
  proofRegistryExplorerUrl?: string;
}

export interface OptimizationFeedItem {
  id: string;
  protocol: string;
  beforeApy: number;
  afterApy: number;
  confidence: number;
  status: FeedState;
  proofBadge: string;
  reasoning: string;
  timestamp: string;
}

export interface ProofDetails {
  txHash: string;
  cid: string;
  blockNumber: number;
  timestamp: string;
  explorerUrl: string;
}

export interface YieldPoint {
  label: string;
  value: number;
}

const DEFAULT_PORTFOLIO = {
  USDC: 12450,
  "0G": 4180,
  SAUCE: 2960,
  BONZO: 2410.25,
  HBAR: 2570,
};

export const portfolioSchema = z
  .record(z.string(), z.number().min(0))
  .default(DEFAULT_PORTFOLIO);

const promptSchema = z.string().trim().max(240).optional();

function round(value: number, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

export function createYieldSeries(current: number, optimized: number, points = 30) {
  return Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1);
    const eased = 1 - Math.pow(1 - progress, 2.4);
    const ripple = Math.sin(index * 1.12) * 0.25 + Math.cos(index * 0.44) * 0.14;
    const value = round(current + (optimized - current) * eased + ripple, 2);

    return {
      label: index === 0 ? "Today" : index === points - 1 ? "After Optimization" : `T+${index}`,
      value: Math.min(optimized, Math.max(current - 0.3, value)),
    } satisfies YieldPoint;
  });
}

export function buildNarrative(result: OptimizationResult, prompt?: string) {
  const instruction = prompt ? `Request: ${prompt}. ` : "";
  return `${instruction}YieldBoost rerouted idle stablecoin and 0G exposure into SaucerSwap LP, high-yield 0G staking, and a safer BONZO rebalance. Estimated APY rises to ${result.optimized_apy}% with moderated slippage, diversified protocol exposure, and proof anchored to 0G Compute plus 0G Storage.`;
}

export function buildOptimizationSnapshot(
  portfolioInput?: Record<string, number>,
  prompt?: string,
): OptimizationResult {
  const portfolio = portfolioSchema.parse(portfolioInput ?? DEFAULT_PORTFOLIO);
  const totalPortfolio =
    Object.values(portfolio).reduce((sum, value) => sum + value, 0) || 24570.25;

  const currentApy = 12.38;
  const optimizedApy = 23.84;
  const estimatedAnnualGain = round(totalPortfolio * 0.0959, 2);

  const snapshot: OptimizationResult = {
    current_apy: currentApy,
    optimized_apy: optimizedApy,
    yield_increase: estimatedAnnualGain,
    yield_increase_pct: 23.61,
    top_protocols: [
      { name: "SaucerSwap LP", apy: 24.18, risk: "medium" },
      { name: "0G High-Yield Pool", apy: 18.65, risk: "low" },
      { name: "BONZO Earn More", apy: 32.1, risk: "medium" },
    ],
    recommended: "SaucerSwap LP",
    confidence: 96,
    timestamp: new Date().toISOString(),
    executionSeconds: 8.42,
    estimatedAnnualGain,
    totalPortfolio: round(totalPortfolio, 2),
    riskProfile: "Moderate",
  };

  snapshot.reasoning = buildNarrative(snapshot, promptSchema.parse(prompt));
  return snapshot;
}

export function createProofDetails(): ProofDetails {
  const suffix = Date.now().toString(16).slice(-8);
  const explorerBase =
    process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
    "https://chainscan-galileo.0g.ai";

  return {
    txHash: `0x0g${suffix.padEnd(18, "a")}bb9e4`,
    cid: `bafybeiyieldboost${suffix}`,
    blockNumber: 482103,
    timestamp: new Date().toISOString(),
    explorerUrl: explorerBase,
  };
}
