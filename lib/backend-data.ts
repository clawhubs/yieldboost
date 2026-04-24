import {
  type OptimizationResult,
  buildOptimizationSnapshot,
  createProofDetails,
} from "@/lib/optimizations";

export interface PortfolioToken {
  symbol: string;
  amount: number;
  valueUSD: number;
}

export interface PortfolioResponse {
  tokens: PortfolioToken[];
  totalUSD: number;
  currentAPY: number;
  walletAddress?: string;
  source?: string;
  latestTxHash?: string;
}

export interface PortfolioSummaryResponse {
  hero: {
    totalPortfolio: number;
    idleCapital: number;
    syncPct: number;
    trackedPositions: number;
  };
  allocation: Array<{ symbol: string; pct: number; note: string }>;
  positions: Array<{
    asset: string;
    protocol: string;
    apy: number;
    exposure: string;
    state: string;
  }>;
  health: {
    diversification: string;
    slippageBudget: string;
    riskProfile: string;
  };
  reviewerNotes: {
    syncStatus: string;
    nextTrigger: string;
    proofMode: string;
  };
}

export interface StrategiesResponse {
  hero: {
    liveStrategies: number;
    avgConfidence: number;
    simulatedRoutes: number;
    guardrailsActive: number;
  };
  stack: Array<{ label: string; value: string; note: string }>;
  templates: Array<{
    name: string;
    target: string;
    risk: string;
    trigger: string;
    state: string;
  }>;
  guardrails: {
    maxSlippage: string;
    riskEscalation: string;
    proofRequirement: string;
  };
  queue: {
    queuedTemplates: string;
    autoEligible: string;
    needsManualReview: string;
  };
}

export interface OpportunitiesResponse {
  hero: {
    topEstimatedApy: number;
    signalsMonitored: number;
    opportunitiesReady: number;
    proofEligiblePct: number;
  };
  rankedHighlights: Array<{ label: string; value: string; note: string }>;
  board: Array<{
    route: string;
    apy: string;
    risk: string;
    liquidity: string;
    state: string;
  }>;
  selectionLogic: {
    momentumWeight: string;
    riskFilter: string;
    proofGate: string;
  };
  executionReadiness: {
    autoExecutable: string;
    manualReview: string;
    slippageWindow: string;
  };
}

export interface HistoryResponse {
  hero: {
    runs: number;
    successRate: number;
    proofEntries: number;
    valueRouted: number;
  };
  timeline: Array<{ time: string; value: string; note: string }>;
  ledger: Array<{
    timestamp: string;
    action: string;
    cid: string;
    explorer: string;
    state: string;
  }>;
  latestOutcome: {
    realizedApyLift: string;
    annualizedGain: string;
    executionTime: string;
  };
  verification: {
    explorerSource: string;
    storageAnchor: string;
    reviewStatus: string;
  };
}

export interface AnalyticsResponse {
  hero: {
    avgApyLift: string;
    avgExecution: string;
    computeJobs: string;
    uptime: string;
  };
  overview: Array<{ label: string; value: string; note: string }>;
  matrix: Array<{
    metric: string;
    current: string;
    benchmark: string;
    direction: string;
    state: string;
  }>;
  efficiency: {
    computeEfficiency: string;
    storageFootprint: string;
    explorerCoverage: string;
  };
  modelConfidence: {
    averageConfidence: string;
    fallbackUsage: string;
    userExplainability: string;
  };
}

export interface WatchlistResponse {
  hero: {
    watchedPools: number;
    hotSignals: number;
    idleCandidates: number;
    alertsToday: number;
  };
  protocolsUnderWatch: Array<{ label: string; value: string; note: string }>;
  alerts: Array<{
    protocol: string;
    signal: string;
    action: string;
    priority: string;
    state: string;
  }>;
  conditions: {
    yieldDelta: string;
    liquidityGuard: string;
    proofPreference: string;
  };
  quickActions: {
    promoteToOpportunity: string;
    sendToAgent: string;
    archiveSignal: string;
  };
}

export interface SettingsResponse {
  hero: {
    riskProfile: string;
    notificationRules: number;
    explorerDefault: string;
    agentMode: string;
  };
  preferences: {
    maxSlippage: string;
    proofRetention: string;
    autoExecute: boolean;
    notificationMode: string;
  };
  rules: Array<{
    rule: string;
    scope: string;
    current: string;
    effect: string;
    state: string;
  }>;
  security: {
    walletAccess: string;
    proofVisibility: string;
    manualOverride: string;
  };
  demoMode: {
    sampleNotifications: string;
    explorerShortcut: string;
    autoPrefill: string;
  };
}

export interface SettingsState {
  riskProfile: "Low" | "Moderate" | "High";
  notificationRules: number;
  explorerDefault: string;
  agentMode: "Autonomous" | "Manual";
  maxSlippage: string;
  proofRetention: string;
  autoExecute: boolean;
  notificationMode: "Realtime" | "Digest";
}

export interface SettingsPatchInput {
  riskProfile?: SettingsState["riskProfile"];
  maxSlippage?: string;
  autoExecute?: boolean;
  notificationMode?: SettingsState["notificationMode"];
}

export interface StoredDecisionPayload {
  current_apy: number;
  optimized_apy: number;
  yield_increase: number;
  yield_increase_pct: number;
  recommended: string;
  confidence: number;
  executionSeconds?: number;
  estimatedAnnualGain?: number;
  totalPortfolio?: number;
  reasoning?: string;
}

export interface StoredProofRecord {
  cid: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  explorerUrl: string;
  decision: StoredDecisionPayload;
  walletAddress?: string;
  proofRegistryAddress?: string;
  proofRegistryTxHash?: string;
  proofRegistryProofId?: string;
  proofRegistryExplorerUrl?: string;
  note?: string;
}

function round(value: number, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
}

function formatPercent(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortenCid(cid: string) {
  return cid.length > 12 ? `${cid.slice(0, 4)}...${cid.slice(-4)}` : cid;
}

function trimProtocolName(protocol: string) {
  return protocol.replace(/\s+(LP|Vault|Pool|Finance|Network|Lending Loop)$/i, "");
}

const portfolioTokens: PortfolioToken[] = [
  { symbol: "ETH", amount: 1.25, valueUSD: 3750 },
  { symbol: "USDC", amount: 500, valueUSD: 500 },
  { symbol: "BTC", amount: 0.05, valueUSD: 4700 },
  { symbol: "ARB", amount: 1000, valueUSD: 820 },
];

export function getMockPortfolio(): PortfolioResponse {
  const totalUSD = round(
    portfolioTokens.reduce((sum, token) => sum + token.valueUSD, 0),
  );
  const snapshot = buildOptimizationSnapshot(getPortfolioValueMap());

  return {
    tokens: portfolioTokens.map((token) => ({ ...token })),
    totalUSD,
    currentAPY: snapshot.current_apy,
  };
}

export function getPortfolioValueMap(
  portfolio?: PortfolioResponse,
) {
  const tokens = portfolio?.tokens ?? portfolioTokens;

  return Object.fromEntries(
    tokens.map((token) => [token.symbol, token.valueUSD]),
  ) as Record<string, number>;
}

export function getMockPortfolioSummary(): PortfolioSummaryResponse {
  const portfolio = getMockPortfolio();

  return {
    hero: {
      totalPortfolio: 24570.25,
      idleCapital: 4180,
      syncPct: 98.4,
      trackedPositions: 12,
    },
    allocation: [
      { symbol: "USDC", pct: 50.7, note: "Largest idle allocation" },
      { symbol: "0G Token", pct: 17.0, note: "Core ecosystem exposure" },
      { symbol: "SAUCE", pct: 12.0, note: "Momentum-driven opportunity" },
      {
        symbol: "BONZO",
        pct: 9.8,
        note: "Needs risk trim before next epoch",
      },
    ],
    positions: [
      {
        asset: "USDC",
        protocol: "SaucerSwap LP",
        apy: portfolio.currentAPY,
        exposure: "Medium",
        state: "idle",
      },
      {
        asset: "0G Token",
        protocol: "0G Network Vault",
        apy: 18.65,
        exposure: "Low",
        state: "healthy",
      },
      {
        asset: "SAUCE",
        protocol: "Reward Pool",
        apy: 14.22,
        exposure: "Medium",
        state: "watch",
      },
      {
        asset: "BONZO",
        protocol: "Lending Loop",
        apy: 9.51,
        exposure: "High",
        state: "trim",
      },
    ],
    health: {
      diversification: "Healthy across 4 major buckets",
      slippageBudget: "0.8% max for auto execution",
      riskProfile: "Moderate with capital preservation bias",
    },
    reviewerNotes: {
      syncStatus: "Wallet snapshot mirrored to 0G Storage",
      nextTrigger: "Optimize once idle capital exceeds $2,500",
      proofMode: "Explorer-ready record after execution",
    },
  };
}

export function getMockStrategies(): StrategiesResponse {
  return {
    hero: {
      liveStrategies: 12,
      avgConfidence: 96,
      simulatedRoutes: 128,
      guardrailsActive: 8,
    },
    stack: [
      {
        label: "Stable LP Rotation",
        value: "24.18%",
        note: "Best current APY target",
      },
      {
        label: "0G Yield Staking",
        value: "18.65%",
        note: "Low-risk ecosystem exposure",
      },
      {
        label: "BONZO Trim & Rebalance",
        value: "16.20%",
        note: "Reduce downside concentration",
      },
      {
        label: "Execution Time",
        value: "8.42s",
        note: "Expected wall-clock completion",
      },
    ],
    templates: [
      {
        name: "Idle Stable Sweep",
        target: "SaucerSwap LP",
        risk: "Moderate",
        trigger: ">$2k idle USDC",
        state: "ready",
      },
      {
        name: "0G Core Hold",
        target: "0G Staking Vault",
        risk: "Low",
        trigger: "Maintain baseline",
        state: "live",
      },
      {
        name: "Momentum Rotate",
        target: "SAUCE Pool",
        risk: "Moderate",
        trigger: "Signal > 4.0",
        state: "watch",
      },
      {
        name: "Risk Compression",
        target: "BONZO Trim",
        risk: "Low",
        trigger: "Exposure > 10%",
        state: "queued",
      },
    ],
    guardrails: {
      maxSlippage: "0.8% per route",
      riskEscalation: "Blocked above moderate posture",
      proofRequirement: "Mandatory 0G explorer reference",
    },
    queue: {
      queuedTemplates: "4 waiting for review",
      autoEligible: "2 can run immediately",
      needsManualReview: "2 due to volatility window",
    },
  };
}

export function getMockOpportunities(): OpportunitiesResponse {
  return {
    hero: {
      topEstimatedApy: 24.18,
      signalsMonitored: 37,
      opportunitiesReady: 9,
      proofEligiblePct: 100,
    },
    rankedHighlights: [
      {
        label: "SaucerSwap LP",
        value: "24.18%",
        note: "Best balance of yield and depth",
      },
      {
        label: "0G High-Yield Pool",
        value: "18.65%",
        note: "Stable ecosystem-aligned option",
      },
      {
        label: "BONZO Rebalance",
        value: "16.20%",
        note: "Useful after exposure trim",
      },
      {
        label: "Momentum Confidence",
        value: "96%",
        note: "Current model conviction",
      },
    ],
    board: [
      {
        route: "USDC → SaucerSwap LP",
        apy: "24.18%",
        risk: "Moderate",
        liquidity: "High",
        state: "best",
      },
      {
        route: "0G → Staking Vault",
        apy: "18.65%",
        risk: "Low",
        liquidity: "High",
        state: "safe",
      },
      {
        route: "BONZO → Earn More",
        apy: "16.20%",
        risk: "Moderate",
        liquidity: "Medium",
        state: "watch",
      },
      {
        route: "SAUCE Momentum Pool",
        apy: "14.70%",
        risk: "Moderate",
        liquidity: "Medium",
        state: "rising",
      },
    ],
    selectionLogic: {
      momentumWeight: "High for short-term yield jumps",
      riskFilter: "Rejects routes beyond moderate profile",
      proofGate: "Must support 0G Network traceability",
    },
    executionReadiness: {
      autoExecutable: "5 routes ready right now",
      manualReview: "2 routes due to liquidity depth",
      slippageWindow: "0.4% to 0.8% across shortlist",
    },
  };
}

export function getMockHistory(): HistoryResponse {
  return {
    hero: {
      runs: 48,
      successRate: 94,
      proofEntries: 48,
      valueRouted: 182000,
    },
    timeline: [
      {
        time: "10:32 AM",
        value: "Yield raised to 23.84%",
        note: "Completed run",
      },
      {
        time: "10:31 AM",
        value: "Strategy execution started",
        note: "Swapping + LP route",
      },
      {
        time: "10:30 AM",
        value: "Portfolio analysis finished",
        note: "Risk and slippage verified",
      },
      {
        time: "10:29 AM",
        value: "0G sync created",
        note: "Snapshot archived for replay",
      },
    ],
    ledger: [
      {
        timestamp: "10:32 AM",
        action: "Optimization settled",
        cid: "bafy...e321",
        explorer: "0G Galileo",
        state: "verified",
      },
      {
        timestamp: "10:31 AM",
        action: "Liquidity added",
        cid: "bafy...d182",
        explorer: "0G Galileo",
        state: "stored",
      },
      {
        timestamp: "10:30 AM",
        action: "Portfolio analyzed",
        cid: "bafy...ab04",
        explorer: "0G Galileo",
        state: "indexed",
      },
      {
        timestamp: "10:29 AM",
        action: "Wallet snapshot",
        cid: "bafy...901c",
        explorer: "0G Galileo",
        state: "anchored",
      },
    ],
    latestOutcome: {
      realizedApyLift: "+11.46%",
      annualizedGain: "+$2,356.41 projected",
      executionTime: "8.42 seconds",
    },
    verification: {
      explorerSource: "0G Galileo reference path",
      storageAnchor: "CID reserved for every mock run",
      reviewStatus: "Ready for judge walkthrough",
    },
  };
}

export function buildHistoryFromProofs(
  proofs: StoredProofRecord[],
): HistoryResponse {
  if (proofs.length === 0) {
    return getMockHistory();
  }

  const latest = proofs[0];
  const totalValueRouted = round(
    proofs.reduce(
      (sum, proof) => sum + (proof.decision.totalPortfolio ?? 0),
      0,
    ),
  );
  const proofEntries = proofs.length;

  return {
    hero: {
      runs: proofEntries,
      successRate: 94,
      proofEntries,
      valueRouted: totalValueRouted || 182000,
    },
    timeline: proofs.slice(0, 4).map((proof, index) => ({
      time: formatTime(proof.timestamp),
      value:
        index === 0
          ? `Yield raised to ${proof.decision.optimized_apy.toFixed(2)}%`
          : index === 1
            ? "Strategy execution started"
            : index === 2
              ? "Portfolio analysis finished"
              : "0G sync created",
      note:
        index === 0
          ? "Completed run"
          : index === 1
            ? "Swapping + LP route"
            : index === 2
              ? "Risk and slippage verified"
              : "Snapshot archived for replay",
    })),
    ledger: proofs.slice(0, 4).map((proof, index) => ({
      timestamp: formatTime(proof.timestamp),
      action:
        index === 0
          ? "Optimization settled"
          : index === 1
            ? "Liquidity added"
            : index === 2
              ? "Portfolio analyzed"
              : "Wallet snapshot",
      cid: shortenCid(proof.cid),
      explorer: "0G Galileo",
      state: index === 0 ? "verified" : index === 1 ? "stored" : "indexed",
    })),
    latestOutcome: {
      realizedApyLift: `+${(
        latest.decision.optimized_apy - latest.decision.current_apy
      ).toFixed(2)}%`,
      annualizedGain: `+${formatCurrency(
        latest.decision.estimatedAnnualGain ?? latest.decision.yield_increase,
      )} projected`,
      executionTime: `${(latest.decision.executionSeconds ?? 8.42).toFixed(2)} seconds`,
    },
    verification: {
      explorerSource: "0G explorer reference path",
      storageAnchor: `${proofEntries} proof entries available`,
      reviewStatus: "Ready for judge walkthrough",
    },
  };
}

export function getMockAnalytics(): AnalyticsResponse {
  return {
    hero: {
      avgApyLift: "+23.61%",
      avgExecution: "8.42s",
      computeJobs: "184,392",
      uptime: "99.98%",
    },
    overview: [
      {
        label: "Gross Yield Lift",
        value: "+23.61%",
        note: "Mock benchmark outperformance",
      },
      {
        label: "Net Gain After Fees",
        value: "+$47.23",
        note: "Per cycle expectation",
      },
      {
        label: "Risk Compression",
        value: "-18%",
        note: "Reduced concentration pressure",
      },
      {
        label: "Proof Completion",
        value: "100%",
        note: "Every run reserves proof state",
      },
    ],
    matrix: [
      {
        metric: "APY Improvement",
        current: "23.61%",
        benchmark: "12.00%",
        direction: "Up",
        state: "strong",
      },
      {
        metric: "Execution Time",
        current: "8.42s",
        benchmark: "12.50s",
        direction: "Down",
        state: "better",
      },
      {
        metric: "Proof Coverage",
        current: "100%",
        benchmark: "90%",
        direction: "Up",
        state: "clean",
      },
      {
        metric: "Risk Deviation",
        current: "Low",
        benchmark: "Moderate",
        direction: "Down",
        state: "safe",
      },
    ],
    efficiency: {
      computeEfficiency: "High throughput at low latency",
      storageFootprint: "Compact proof-first snapshots",
      explorerCoverage: "Ready for end-to-end linking",
    },
    modelConfidence: {
      averageConfidence: "96% on top-ranked actions",
      fallbackUsage: "Minimal in current scenarios",
      userExplainability: "Clear reasoning surfaces available",
    },
  };
}

export function getMockWatchlist(): WatchlistResponse {
  return {
    hero: {
      watchedPools: 17,
      hotSignals: 7,
      idleCandidates: 3,
      alertsToday: 5,
    },
    protocolsUnderWatch: [
      {
        label: "SaucerSwap",
        value: "+4.7%",
        note: "Momentum still accelerating",
      },
      {
        label: "0G Staking Vault",
        value: "Stable",
        note: "Low-risk yield anchor",
      },
      { label: "BONZO", value: "Trim", note: "Exposure threshold approaching" },
      {
        label: "Stable LP Spread",
        value: "0.8%",
        note: "Within safe trade window",
      },
    ],
    alerts: [
      {
        protocol: "SaucerSwap LP",
        signal: "Yield up +4.7%",
        action: "Move idle USDC",
        priority: "High",
        state: "new",
      },
      {
        protocol: "0G Vault",
        signal: "Steady low-risk APY",
        action: "Maintain core hold",
        priority: "Medium",
        state: "stable",
      },
      {
        protocol: "BONZO",
        signal: "Exposure limit nearing",
        action: "Trim size",
        priority: "High",
        state: "alert",
      },
      {
        protocol: "SAUCE Pool",
        signal: "Volume rising",
        action: "Monitor depth",
        priority: "Medium",
        state: "watch",
      },
    ],
    conditions: {
      yieldDelta: "Alert above +3.0% shift",
      liquidityGuard: "Reject thin pools automatically",
      proofPreference: "Prioritize traceable destinations",
    },
    quickActions: {
      promoteToOpportunity: "1 click once threshold is met",
      sendToAgent: "Mock-ready for manual execution",
      archiveSignal: "Keep the list clean for demos",
    },
  };
}

export function getDefaultSettingsState(): SettingsState {
  return {
    riskProfile: "Moderate",
    notificationRules: 8,
    explorerDefault: "0G Galileo",
    agentMode: "Autonomous",
    maxSlippage: "0.8%",
    proofRetention: "30 days",
    autoExecute: true,
    notificationMode: "Realtime",
  };
}

export function buildSettingsResponse(
  state: SettingsState = getDefaultSettingsState(),
): SettingsResponse {
  return {
    hero: {
      riskProfile: state.riskProfile,
      notificationRules: state.notificationRules,
      explorerDefault: state.explorerDefault,
      agentMode: state.agentMode,
    },
    preferences: {
      maxSlippage: state.maxSlippage,
      proofRetention: state.proofRetention,
      autoExecute: state.autoExecute,
      notificationMode: state.notificationMode,
    },
    rules: [
      {
        rule: "Execution Complete",
        scope: "Global",
        current: "Enabled",
        effect:
          state.notificationMode === "Digest" ? "Queue summary" : "Push update",
        state: "active",
      },
      {
        rule: "High Slippage",
        scope: "Trade",
        current: "Enabled",
        effect: "Block run",
        state: "guard",
      },
      {
        rule: "Proof Stored",
        scope: "History",
        current: "Enabled",
        effect: "Show CID",
        state: "active",
      },
      {
        rule: "Volatility Spike",
        scope: "Watchlist",
        current: "Enabled",
        effect: state.notificationMode === "Digest" ? "Digest only" : "Alert only",
        state: "watch",
      },
    ],
    security: {
      walletAccess: "Read-only until execution confirmation",
      proofVisibility: "Always show explorer references",
      manualOverride: "Enabled for reviewer demo safety",
    },
    demoMode: {
      sampleNotifications:
        state.notificationMode === "Digest"
          ? "Digest demo enabled"
          : "Enabled for walkthrough clarity",
      explorerShortcut: `Pinned to ${state.explorerDefault}`,
      autoPrefill: "Mock data on every route",
    },
  };
}

export function buildStoredDecisionPayload(
  result: OptimizationResult,
): StoredDecisionPayload {
  return {
    current_apy: result.current_apy,
    optimized_apy: result.optimized_apy,
    yield_increase: result.yield_increase,
    yield_increase_pct: result.yield_increase_pct,
    recommended: result.recommended,
    confidence: result.confidence,
    executionSeconds: result.executionSeconds,
    estimatedAnnualGain: result.estimatedAnnualGain,
    totalPortfolio: result.totalPortfolio,
    reasoning: result.reasoning,
  };
}

export function createStoredProofFallback(
  decision: StoredDecisionPayload,
  note = "dev_mock",
): StoredProofRecord {
  const proof = createProofDetails();

  return {
    cid: proof.cid,
    txHash: proof.txHash,
    blockNumber: proof.blockNumber,
    timestamp: proof.timestamp,
    explorerUrl: proof.explorerUrl,
    decision,
    note,
  };
}

export function createDecisionSummary(decision: StoredDecisionPayload) {
  return `${trimProtocolName(decision.recommended)} lifted APY to ${formatPercent(
    decision.optimized_apy,
  )}`;
}

export function formatFeatureCurrency(value: number) {
  return formatCurrency(value);
}

export function formatFeaturePercent(value: number, digits = 2) {
  return formatPercent(value, digits);
}

export function formatFeatureTime(timestamp: string) {
  return formatTime(timestamp);
}

export function formatFeatureBoolean(value: boolean) {
  return value ? "Enabled" : "Disabled";
}

export function shortenFeatureCid(cid: string) {
  return shortenCid(cid);
}
