import {
  type OptimizationFeedItem,
  type ProofDetails,
  buildOptimizationSnapshot,
  createProofDetails,
  createYieldSeries,
} from "@/lib/optimizations";

export const dashboardSnapshot = buildOptimizationSnapshot();
export const proofDetails: ProofDetails = createProofDetails();
export const yieldSeries = createYieldSeries(
  dashboardSnapshot.current_apy,
  dashboardSnapshot.optimized_apy,
);

interface KpiCard {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  accent: string;
  testId: string;
}

export const kpiCards: KpiCard[] = [
  { label: "ESTIMATED YIELD INCREASE", value: 23.61, suffix: "%", accent: "text-[var(--accent-green)]", testId: "kpi-yield" },
  { label: "PROJECTED APY", value: 23.84, suffix: "%", accent: "text-white", testId: "kpi-apy" },
  { label: "TOTAL PORTFOLIO", value: 24570.25, prefix: "$", decimals: 2, accent: "text-white", testId: "kpi-portfolio" },
  { label: "LIVE STRATEGIES", value: 12, accent: "text-white", testId: "kpi-strategies" },
];

export const topLineStats = [
  { label: "Users Optimized", value: "1,247", sublabel: "+ 12 in last hour" },
  { label: "TVL Managed", value: "$2.4M", sublabel: "+ $180k today" },
  { label: "Compute Jobs", value: "18,392", sublabel: "+ 184 today" },
  { label: "New Accounts", value: "342", sublabel: "+ 27 this week" },
  { label: "Live Strategies", value: "12", sublabel: "Across 12 chains" },
] as const;

export const optimizationFeed: OptimizationFeedItem[] = [
  {
    id: "log-1",
    protocol: "SAUCE / USDC rebalance",
    beforeApy: 12.38,
    afterApy: 23.84,
    confidence: 96,
    status: "complete",
    proofBadge: "0G proof anchored",
    reasoning:
      "SaucerSwap momentum accelerated while slippage remained below the acceptable low-risk threshold, making it the strongest near-term move.",
    timestamp: "10:32 AM",
  },
  {
    id: "log-2",
    protocol: "0G staking refresh",
    beforeApy: 11.1,
    afterApy: 18.65,
    confidence: 93,
    status: "optimizing",
    proofBadge: "Waiting storage sync",
    reasoning:
      "The optimizer shifted 0G into a higher-yield pool with stable utilization, preserving liquidity while improving reward cadence.",
    timestamp: "10:31 AM",
  },
  {
    id: "log-3",
    protocol: "BONZO risk trim",
    beforeApy: 9.5,
    afterApy: 16.2,
    confidence: 91,
    status: "analyzing",
    proofBadge: "Compute simulation live",
    reasoning:
      "BONZO position sizing was reduced to lower tail risk exposure before entering the next reward epoch with better balance.",
    timestamp: "10:30 AM",
  },
];

export const decisionBullets = [
  "0G / USDC LP yield dropped 2.1% in the last 7 days.",
  "SaucerSwap SAUCE pool showed +4.7% momentum today.",
  "Rebalancing reduces 0G allocation drift.",
  "Net gain after fees is projected at +$47.23 this cycle.",
] as const;

export const topOpportunities = [
  { name: "Move USDC to SaucerSwap LP", apy: "24.18%", change: "11.24%" },
  { name: "Stake 0G in High-Yield Pool", apy: "18.65%", change: "6.71%" },
  { name: "Rebalance BONZO to Earn More", apy: "32.10%", change: "5.66%" },
] as const;

export const transactionProofs = [
  { hash: "0x3f8...b291", network: "0G Galileo", age: "2 sec ago" },
  { hash: "0xa7c...dbe2", network: "0G Galileo", age: "8 sec ago" },
  { hash: "0x9b2...dd49", network: "0G Galileo", age: "15 sec ago" },
] as const;

export const chainStats = [
  { label: "Storage Throughput", value: "12.45 PB/day" },
  { label: "Compute Jobs", value: "184,392" },
  { label: "ZK Proofs Verified", value: "2.14M" },
  { label: "Avg. Finality", value: "2.1s" },
  { label: "Active Operators", value: "128" },
  { label: "Uptime", value: "99.98%" },
] as const;
