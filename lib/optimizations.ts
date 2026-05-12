import { z } from "zod";
import type { IntegrityAudit } from "@/lib/integrity-audit";
import type {
  SentinelAgentIdentityProof,
  ZkComplianceProofStatus,
} from "@/lib/backend-data";

export type OptimizationState = "analyzing" | "optimizing" | "executing" | "anchoring" | "done";
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
  blockNumber?: number;
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
  proofStatus?: "stored" | "error" | "pending";
  proofStatusDetail?: string;
  integrityAudit?: IntegrityAudit;
  sentinelProof?: SentinelAgentIdentityProof | null;
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
  zkCompliance?: {
    proofId: string;
    status: ZkComplianceProofStatus;
    policyCompliantPct: number;
    summary: string;
    explorerUrl?: string;
    proofRegistryExplorerUrl?: string;
  };
  integrityLayers?: {
    sovereignMemory?: boolean;
    zkReasoning?: boolean;
    governance?: boolean;
    neuralHandshake?: boolean;
    zkCompliance?: boolean;
    nitroFortress?: boolean;
  };
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

function isNative0GOnlyPortfolio(portfolio: Record<string, number>) {
  const positiveSymbols = Object.entries(portfolio)
    .filter(([, value]) => value > 0)
    .map(([symbol]) => symbol.toUpperCase());

  return positiveSymbols.length > 0 && positiveSymbols.every((symbol) => symbol === "0G");
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
  if (result.totalPortfolio <= 0 || result.top_protocols.length === 0) {
    return "Wallet connected, but no supported on-chain balances were detected yet. Fund the wallet with native 0G or add supported assets before running a real optimization pass.";
  }

  const instruction = prompt ? `Request: ${prompt}. ` : "";
  if (result.top_protocols.every((protocol) => protocol.name.startsWith("0G"))) {
    return `${instruction}YieldBoost detected native 0G in MetaMask and routed the optimization through 0G-native yield paths: native staking, storage-backed proof execution, and compute-ready reserve. Estimated APY rises to ${result.optimized_apy}% with the strategy kept inside the 9-layer integrity flow.`;
  }

  return `${instruction}YieldBoost rerouted idle stablecoin and 0G exposure into SaucerSwap LP, high-yield 0G staking, and a safer BONZO rebalance. Estimated APY rises to ${result.optimized_apy}% with moderated slippage, diversified protocol exposure, and proof anchored to 0G Compute plus 0G Storage.`;
}

export function buildOptimizationSnapshot(
  portfolioInput?: Record<string, number>,
  prompt?: string,
): OptimizationResult {
  const hasExplicitPortfolio = portfolioInput !== undefined;
  const portfolio = portfolioSchema.parse(portfolioInput ?? DEFAULT_PORTFOLIO);
  const totalPortfolio = round(
    Object.values(portfolio).reduce((sum, value) => sum + value, 0),
    2,
  );

  if (hasExplicitPortfolio && totalPortfolio <= 0) {
    const emptySnapshot: OptimizationResult = {
      current_apy: 0,
      optimized_apy: 0,
      yield_increase: 0,
      yield_increase_pct: 0,
      top_protocols: [],
      recommended: "Fund wallet / add supported assets",
      confidence: 0,
      timestamp: new Date().toISOString(),
      executionSeconds: 0.42,
      estimatedAnnualGain: 0,
      totalPortfolio: 0,
      riskProfile: "Low",
    };

    emptySnapshot.reasoning = buildNarrative(emptySnapshot, promptSchema.parse(prompt));
    return emptySnapshot;
  }

  const normalizedTotalPortfolio = totalPortfolio || 24570.25;
  const native0GOnly = isNative0GOnlyPortfolio(portfolio);

  const currentApy = native0GOnly ? 5.2 : 12.38;
  const optimizedApy = native0GOnly ? 14.8 : 23.84;
  const estimatedAnnualGain = round(
    normalizedTotalPortfolio * (native0GOnly ? 0.116 : 0.0959),
    2,
  );

  const snapshot: OptimizationResult = {
    current_apy: currentApy,
    optimized_apy: optimizedApy,
    yield_increase: estimatedAnnualGain,
    yield_increase_pct: native0GOnly ? 11.6 : 23.61,
    top_protocols: native0GOnly
      ? [
          { name: "0G Native Staking Route", apy: 14.8, risk: "low" },
          { name: "0G Storage Proof Route", apy: 10.4, risk: "low" },
          { name: "0G Compute Reserve", apy: 7.2, risk: "low" },
        ]
      : [
          { name: "SaucerSwap LP", apy: 24.18, risk: "medium" },
          { name: "0G High-Yield Pool", apy: 18.65, risk: "low" },
          { name: "BONZO Earn More", apy: 32.1, risk: "medium" },
        ],
    recommended: native0GOnly ? "0G Native Staking Route" : "SaucerSwap LP",
    confidence: native0GOnly ? 94 : 96,
    timestamp: new Date().toISOString(),
    executionSeconds: 8.42,
    estimatedAnnualGain,
    totalPortfolio: normalizedTotalPortfolio,
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
