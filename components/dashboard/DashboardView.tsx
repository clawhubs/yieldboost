"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  Bell,
  Bot,
  Box,
  Check,
  CheckCheck,
  ChevronDown,
  CircleDashed,
  Clock3,
  Cpu,
  Database,
  Disc3,
  DollarSign,
  Expand,
  Gauge,
  Globe,
  Grid2X2,
  HeartHandshake,
  Lock,
  MessageCircleMore,
  Plane,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet2,
  Zap,
  Copy,
  ExternalLink,
} from "lucide-react";
import ProofModal from "@/components/modals/ProofModal";
import { chainStats } from "@/lib/mock-data";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import { usePortfolio } from "@/hooks/usePortfolio";

const decisionItems = [
  "0G/USDC LP yield dropped 2.1% (7d avg)",
  "0G yield pool showing +4.7% momentum",
  "Rebalancing reduces risk by tightening 0G exposure",
  "Net gain after fees: +$47.23",
] as const;

const opportunities = [
  { name: "Move USDC to SaucerSwap LP",   apy: "24.18%", change: "11.24%", icon: Disc3 },
  { name: "Stake 0G in High-Yield Pool",  apy: "18.65%", change: "6.71%",  icon: Globe },
  { name: "Rebalance BONZO to Earn More", apy: "32.10%", change: "5.66%",  icon: HeartHandshake },
] as const;

const executionSteps = [
  "Swapping 1,250 USDC to SAUCE",
  "Adding liquidity to SaucerSwap LP",
  "Staking 512.5 0G",
  "Rebalancing BONZO position",
  "Finalizing & updating stats",
] as const;

const agentChecklist = [
  "Scanning wallet & balances",
  "Detecting idle assets",
  "Finding best yield opportunities",
  "Simulating strategies",
  "Checking risk & slippage",
] as const;

const whyOg = [
  { icon: Box, title: "AI-NATIVE STORAGE", line1: "Petabyte scale", line2: "Low cost, high throughput" },
  { icon: ShieldCheck, title: "VERIFIABLE COMPUTE", line1: "ZK-proofs on-chain", line2: "Trustless & verifiable" },
  { icon: Cpu, title: "BUILT FOR AI AGENTS", line1: "Decentralized infra", line2: "Designed for scale" },
] as const;

const impactStats = [
  { label: "New Accounts", value: "+18,392" },
  { label: "Compute Jobs", value: "184,392" },
  { label: "ZK Proofs Verified", value: "2.14M" },
] as const;

const footerItems = [
  { icon: Lock, label: "Secure" },
  { icon: ShieldCheck, label: "Non-Custodial" },
  { icon: Zap, label: "1-Click Execution" },
  { icon: Sparkles, label: "AI-Powered" },
] as const;

function HeroChart() {
  return (
    <div data-testid="yield-chart" className="relative h-[176px]">
      <svg
        viewBox="0 0 640 176"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28e0d7" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#28e0d7" stopOpacity="0" />
          </linearGradient>
          <filter id="heroGlow" x="-20%" y="-40%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M24 132C48 125 61 114 79 107C97 100 121 105 139 96C157 87 176 71 193 70C210 69 233 75 249 67C265 59 284 46 301 47C317 48 333 57 350 52C367 47 382 31 399 32C416 33 438 44 456 40C474 36 490 20 507 21C525 22 541 30 557 26C573 22 594 10 616 11V157H24V132Z"
          fill="url(#heroFill)"
          opacity="0.95"
        />
        <path
          d="M24 132C48 125 61 114 79 107C97 100 121 105 139 96C157 87 176 71 193 70C210 69 233 75 249 67C265 59 284 46 301 47C317 48 333 57 350 52C367 47 382 31 399 32C416 33 438 44 456 40C474 36 490 20 507 21C525 22 541 30 557 26C573 22 594 10 616 11"
          fill="none"
          stroke="#3FF3E9"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#heroGlow)"
        />
        <line
          x1="23"
          y1="129"
          x2="618"
          y2="129"
          stroke="#c6d0d9"
          strokeDasharray="4 6"
          strokeOpacity="0.35"
        />
        <circle cx="24" cy="132" r="5" fill="#3FF3E9" />
        <circle cx="616" cy="11" r="6" fill="#A7FFF8" stroke="#3FF3E9" strokeWidth="3" />
      </svg>

      <div className="absolute right-2 top-0 text-[14px] font-semibold text-white">APY</div>
      <div className="absolute left-0 top-[128px] text-[11px] text-white/90">Today</div>
      <div className="absolute left-0 bottom-0 text-[11px] text-[#cfd8e0]">Today</div>
      <div className="absolute right-0 bottom-0 text-[11px] text-[#cfd8e0]">After Optimization</div>
    </div>
  );
}

function MiniSpark({ color = "#2cf0dd" }: { color?: string }) {
  return (
    <svg viewBox="0 0 96 30" className="h-[26px] w-[96px]" aria-hidden="true">
      <path
        d="M1 22C8 22 9 18 16 18C23 18 24 24 31 24C38 24 38 13 45 13C52 13 54 22 61 22C68 22 68 9 75 9C82 9 84 16 95 4"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImpactBars() {
  const heights = [10, 17, 12, 20, 14, 24, 27, 16, 25, 22, 18, 26];

  return (
    <div className="flex h-[32px] items-end gap-[4px] overflow-hidden" aria-hidden="true">
      {heights.map((height, index) => (
        <div
          key={index}
          className="min-w-0 flex-1 rounded-t-[8px] bg-[linear-gradient(180deg,#5cf48e_0%,#2ecf67_45%,#0c1a12_100%)] shadow-[0_0_10px_rgba(76,235,130,0.14)]"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

function ImpactLine({
  path,
}: {
  path: string;
}) {
  return (
    <svg viewBox="0 0 108 32" className="h-[32px] w-full" aria-hidden="true">
      <path d={path} fill="none" stroke="#42ebe2" strokeWidth="4.5" strokeOpacity="0.08" strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke="#42ebe2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricIcon({
  icon: Icon,
}: {
  icon: typeof Users;
}) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#18232c] bg-[#091117] text-[#dce4eb]">
      <Icon className="h-4 w-4" />
    </div>
  );
}

function AgentSideRail({ icon: Icon }: { icon: typeof Activity }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#1b242d] bg-[#0a1117] text-[#cfd9e2]">
      <Icon className="h-4 w-4" />
    </div>
  );
}

const EXPLORER_BASE = "https://chainscan-galileo.0g.ai";

export default function DashboardView() {
  const [proofOpen, setProofOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { latestResult, optimize, isOptimizing } = useYieldOptimizer();
  const { portfolio } = usePortfolio();
  const [globalStats, setGlobalStats] = useState<{
    hasData: boolean;
    formatted: { users: string; computeJobs: string; tvl: string; recentJobs24h: string; protocols: string };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/stats/global", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setGlobalStats(data);
      } catch {
        // keep null; UI will show em-dash
      }
    }
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [latestResult]);

  async function copyToClipboard(value: string, field: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1400);
  }

  const livePortfolio = useMemo(
    () =>
      Object.fromEntries(
        (portfolio?.tokens ?? []).map((token) => [token.symbol, token.valueUSD]),
      ) as Record<string, number>,
    [portfolio],
  );

  const canOptimize = Object.keys(livePortfolio).length > 0 && !isOptimizing;

  async function runDashboardOptimization() {
    if (!canOptimize) return;
    await optimize(livePortfolio, "Optimize my portfolio for best yield with low risk");
  }

  const liveDecisions = useMemo(() => {
    if (!latestResult) return decisionItems as readonly string[];
    const gain = latestResult.estimatedAnnualGain.toLocaleString();
    const bullets: string[] = [
      `${latestResult.recommended} selected with ${latestResult.confidence}% confidence`,
      `APY lift ${latestResult.current_apy}% → ${latestResult.optimized_apy}% (+${latestResult.yield_increase_pct}%)`,
      `Projected annual gain +$${gain} on $${latestResult.totalPortfolio.toLocaleString()} portfolio`,
      latestResult.proofRegistryProofId
        ? `ProofRegistry entry #${latestResult.proofRegistryProofId} recorded on 0G Galileo`
        : `Proof anchored to 0G Storage (CID ${latestResult.storageProof?.slice(0, 10) ?? "pending"}…)`,
    ];
    return bullets;
  }, [latestResult]);

  const liveOpportunities = useMemo(() => {
    if (!latestResult || latestResult.top_protocols.length === 0) return opportunities;
    const iconMap = [Disc3, Globe, Box];
    return latestResult.top_protocols.slice(0, 3).map((p, idx) => ({
      name: p.name,
      apy: `${p.apy.toFixed(2)}%`,
      change: `${p.risk} risk`,
      icon: iconMap[idx] ?? Disc3,
    }));
  }, [latestResult]);

  const live = useMemo(() => {
    const totalPortfolio = latestResult?.totalPortfolio ?? portfolio?.totalUSD ?? 0;
    const currentApy = latestResult?.current_apy ?? portfolio?.currentAPY ?? 0;
    const optimizedApy = latestResult?.optimized_apy ?? currentApy;
    const yieldIncreasePct = latestResult?.yield_increase_pct ?? 0;
    const estimatedAnnualGain = latestResult?.estimatedAnnualGain ?? 0;
    const confidence = latestResult?.confidence ?? 0;
    return { totalPortfolio, currentApy, optimizedApy, yieldIncreasePct, estimatedAnnualGain, confidence };
  }, [latestResult, portfolio]);

  const portfolioWalletLabel = portfolio?.walletAddress
    ? `${portfolio.walletAddress.slice(0, 6)}...${portfolio.walletAddress.slice(-4)}`
    : "wallet connected";

  return (
    <>
      <section className="animate-fade-in-up p-[10px] md:h-full">
        <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="min-w-0 space-y-[10px]">
            <header className="flex flex-col gap-3 rounded-[18px] border border-[#141c23] bg-[#060c11] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white">GM, Builder! 👋</div>
                <div className="mt-1 text-[12px] text-[#9daab6]">
                  Your AI agent is working 24/7 to grow your wealth.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="risk-profile"
                  className="flex h-[46px] items-center gap-2 rounded-[12px] border border-[#1b242d] bg-[#0a1117] px-4 text-left"
                >
                  <div>
                    <div className="text-[11px] text-[#d9e1e8]">Risk Profile</div>
                    <div className="mt-0.5 text-[12px] font-medium text-[#2ad7c8]">Moderate</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#d9e1e8]" />
                </button>
                <button
                  type="button"
                  data-testid="alerts-button"
                  className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-[#1b242d] bg-[#0a1117] text-white"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1cdad0] px-1 text-[9px] font-semibold text-[#061015]">
                    3
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="boost-yield-cta"
                  onClick={() => void runDashboardOptimization()}
                  disabled={!canOptimize}
                  className="yb-teal-button flex h-[46px] min-w-[248px] items-center justify-center gap-3 rounded-[12px] px-5 text-left text-[#051015]"
                >
                  <Zap className="h-4 w-4" />
                  <div>
                    <div className="text-[14px] font-semibold">
                      {isOptimizing ? "Optimizing..." : "Boost My Yield Now"}
                    </div>
                    <div className="text-[11px] text-[#0b4340]">1-Click AI Optimization</div>
                  </div>
                </button>
              </div>
            </header>

            <div className="yb-card rounded-[18px] px-5 py-5" data-testid="hero-card">
              <div className="grid gap-6 xl:grid-cols-[356px_minmax(0,1fr)]">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#1a2730] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]">
                    {latestResult ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22e070]" />
                        <span className="text-[#22e070]">Live · {new Date(latestResult.timestamp).toLocaleTimeString()}</span>
                      </>
                    ) : (
                      <>
                        <span className={`h-1.5 w-1.5 rounded-full ${portfolio?.tokens?.length ? "bg-[#22e070]" : "bg-[#d9a441]"}`} />
                        <span className={portfolio?.tokens?.length ? "text-[#22e070]" : "text-[#d9a441]"}>
                          {portfolio?.tokens?.length
                            ? `Wallet live · ${portfolioWalletLabel}`
                            : "Awaiting live wallet data"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[15px] text-white">Stop letting your crypto sit idle.</p>
                  <h1 className="yb-glow-text mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.08] text-white md:text-[34px]">
                    Let AI make it <span className="text-[#22ddd0]">earn.</span>
                  </h1>
                  <p className="mt-2 text-[14px] text-[#d6dee6]">
                    Autonomous. On-chain. Profitable.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-5">
                    <div className="border-r border-[#182028] pr-4">
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[#a9b5c0]">
                        Estimated Yield Increase
                      </div>
                      <div className="mt-2 text-[26px] font-semibold text-[#22e070]">+{live.yieldIncreasePct}%</div>
                      <div className="mt-1 text-[13px] text-[#29e072]">
                        +${live.estimatedAnnualGain.toLocaleString()} <span className="text-[#d8e1e9]">/ year</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[#a9b5c0]">
                        Projected APY
                      </div>
                      <div className="mt-2 text-[26px] font-semibold text-white">{live.optimizedApy}%</div>
                      <div className="mt-1 inline-flex rounded-[8px] border border-[#242d35] px-2 py-1 text-[11px] text-[#d4dee7]">
                        Current APY: {live.currentApy}%
                      </div>
                    </div>
                  </div>
                </div>

                <HeroChart />
              </div>
            </div>

            <div className="grid gap-[10px] xl:grid-cols-5">
              {(() => {
                const hasData = globalStats?.hasData ?? false;
                const dash = "—";
                const cards = [
                  { icon: Users, value: globalStats?.formatted.users ?? dash, label: "Wallets Optimized", sublabel: hasData ? "Runtime proof store" : "Awaiting first optimization" },
                  { icon: DollarSign, value: globalStats?.formatted.tvl ?? dash, label: "TVL Managed", sublabel: hasData ? "Sum of optimized portfolios" : "Awaiting first optimization" },
                  { icon: Cpu, value: globalStats?.formatted.computeJobs ?? dash, label: "Compute Jobs", sublabel: hasData ? "0G + ProofRegistry" : "Awaiting first optimization" },
                  { icon: UserRound, value: globalStats?.formatted.recentJobs24h ?? dash, label: "Jobs (24h)", sublabel: hasData ? "Last 24 hours" : "Awaiting first optimization" },
                  { icon: Shield, value: globalStats?.formatted.protocols ?? dash, label: "Unique Protocols", sublabel: hasData ? "Recommended so far" : "Awaiting first optimization" },
                ];
                return cards.map((item) => (
                  <div key={item.label} className="yb-soft-card rounded-[14px] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MetricIcon icon={item.icon} />
                      <div>
                        <div className="text-[18px] font-semibold text-white">{item.value}</div>
                        <div className="text-[12px] text-[#d4dde5]">{item.label}</div>
                        <div className="mt-1 text-[11px] text-[#2fe06d]">{item.sublabel}</div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div
              data-testid="proof-banner"
              className="yb-card rounded-[16px] px-4 py-3"
            >
              <div className="grid items-center gap-4 xl:grid-cols-[292px_minmax(0,1fr)_182px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#1f6e67] bg-[#071a1a] text-[#26ddd0]">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#21d8c8]">0G STORAGE STATUS</div>
                    <div className="text-[13px] text-white">Your portfolio data is securely synced to 0G Storage</div>
                    <div className="mt-1 text-[11px] text-[#a8b4bf]">Last synced: 2s ago to 0G Storage</div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between text-[13px] text-[#d8e1e9]">
                    <span>Synchronizing...</span>
                    <span>98.4%</span>
                  </div>
                  <div className="mt-2 h-[12px] rounded-full bg-[#0c141b] p-[2px]">
                    <div className="h-full w-[98.4%] rounded-full bg-[linear-gradient(90deg,#22ddd0_0%,#18aeb8_100%)]" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProofOpen(true)}
                  data-testid="view-proof-banner"
                  className="flex items-center gap-3 rounded-[14px] border border-[#173832] bg-[#081313] px-4 py-3 text-left"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#214d45] text-[#26ddd0]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white">Secured by 0G</div>
                    <div className="text-[11px] text-[#cfd9e1]">Decentralized Storage</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid gap-[10px] xl:grid-cols-4">
              {[
                { label: "TOTAL PORTFOLIO VALUE", value: `$${live.totalPortfolio.toLocaleString()}`, change: "↑ 5.34% (24h)", icon: Wallet2, accent: false },
                { label: "TOTAL EARNED (ALL TIME)", value: `$${live.estimatedAnnualGain.toLocaleString()}`, change: "↑ 12.45%", icon: DollarSign, accent: false },
                { label: "AVG. CURRENT APY", value: `${live.currentApy}%`, change: "", icon: Gauge, accent: false },
                { label: "POTENTIAL AFTER AI", value: `${live.optimizedApy}%`, change: `↑ ${live.yieldIncreasePct}%`, icon: Plane, accent: true },
              ].map((item, index) => (
                <div
                  key={item.label}
                  data-testid={
                    index === 0
                      ? "kpi-portfolio"
                      : index === 2
                        ? "kpi-apy"
                        : index === 3
                          ? "kpi-yield"
                          : undefined
                  }
                  className="yb-card rounded-[14px] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.04em] text-[#a7b3be]">
                        {item.label}
                      </div>
                      <div className="mt-2 text-[22px] font-semibold text-white">{item.value}</div>
                      {item.change ? (
                        <div className="mt-1 text-[12px] text-[#2fe06d]">{item.change}</div>
                      ) : (
                        <div className="mt-1 text-[12px] text-[#d6dee6]"> </div>
                      )}
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${item.accent ? "bg-[#0d1b13] text-[#2fe06d]" : "bg-[#0d131a] text-[#d8e1e8]"}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <MiniSpark color={item.accent ? "#2fe06d" : "#2ad7c8"} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-[10px] xl:grid-cols-[276px_minmax(0,1fr)_298px]">
              <div data-testid="before-after-card" className="yb-card rounded-[14px] px-4 py-4">
                <div className="text-[12px] uppercase tracking-[0.04em] text-[#cfd8df]">
                  BEFORE vs AFTER OPTIMIZATION
                </div>
                <div className="mt-4 grid grid-cols-[1fr_42px_1fr] items-center gap-3">
                  <div className="rounded-[10px] border border-[#17351c] bg-[#0b1511] p-3">
                    <div className="text-[12px] text-[#d5dde6]">Before</div>
                    <div className="mt-2 text-[18px] font-semibold text-white">{live.currentApy}%</div>
                    <div className="mt-1 text-[11px] text-[#d5dde6]">Current APY</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#25303a] text-[#d8e0e8]">
                    →
                  </div>
                  <div className="rounded-[10px] border border-[#1e5d53] bg-[#0d1917] p-3">
                    <div className="text-[12px] text-[#8aeedc]">After</div>
                    <div className="mt-2 text-[18px] font-semibold text-[#25ddd0]">{live.optimizedApy}%</div>
                    <div className="mt-1 text-[11px] text-[#d5dde6]">AI Projected APY</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-[10px] bg-[#0d1811] p-2 text-[#2fe06d]">+{live.yieldIncreasePct}%<div className="mt-1 text-[#cad4dd]">Improve</div></div>
                  <div className="rounded-[10px] bg-[#0d1811] p-2 text-[#2fe06d]">+${live.estimatedAnnualGain.toLocaleString()}<div className="mt-1 text-[#cad4dd]">More per year</div></div>
                  <div className="rounded-[10px] bg-[#0d1811] p-2 text-[#2fe06d]">Lower<div className="mt-1 text-[#cad4dd]">Risk</div></div>
                </div>
              </div>

              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium text-white">AI DECISION LOG</div>
                  <button type="button" className="rounded-[10px] border border-[#24303a] px-3 py-1 text-[11px] text-[#d7e0e8]">
                    Why?
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {liveDecisions.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[13px] text-[#d9e2ea]">
                      <Check className="h-4 w-4 text-[#2fe06d]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[12px] text-[#cfd8e0]">
                  <span>Model: YieldBoost v2.1</span>
                  <span>Confidence: <span className="text-[#2fe06d]">{live.confidence}%</span></span>
                </div>
              </div>

              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium text-white">TOP OPPORTUNITIES</div>
                  <button type="button" className="rounded-[10px] border border-[#24303a] px-3 py-1 text-[11px] text-[#d7e0e8]">
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {liveOpportunities.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#26313b] bg-[#0b1218] text-white">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[13px] text-white">{item.name}</div>
                          <div className="mt-1 text-[12px] text-[#d1d9e1]">Est. APY <span className="text-[#2fe06d]">{item.apy}</span></div>
                        </div>
                      </div>
                      <div className="text-[12px] font-medium text-[#2fe06d]">↑ {item.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-[10px] xl:grid-cols-[276px_278px_minmax(0,1fr)]">
              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">TRANSACTION PROOF (LATEST)</div>
                {latestResult?.txHash ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[12px] text-[#dce4eb]">
                          <span className="truncate">{latestResult.txHash.slice(0, 10)}...{latestResult.txHash.slice(-6)}</span>
                          <button type="button" onClick={() => copyToClipboard(latestResult.txHash!, "dashTx")} className="text-[#9faab6] hover:text-white"><Copy className="h-3 w-3" />{copiedField === "dashTx" ? <span className="ml-1 text-[9px]">Copied</span> : null}</button>
                        </div>
                        <div className="mt-1 text-[11px] text-[#9faab6]">0G Galileo</div>
                        {latestResult.walletAddress ? (
                          <div className="mt-1 text-[11px] text-[#6fc7b9]">
                            Signer {latestResult.walletAddress.slice(0, 6)}...{latestResult.walletAddress.slice(-4)}
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-full border border-[#12453f] px-2 py-1 text-[9px] text-[#25d6c6]">Verified on 0G</div>
                    </div>
                    {latestResult.storageProof ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[12px] text-[#dce4eb]">
                            <span className="truncate">CID: {latestResult.storageProof.slice(0, 12)}...{latestResult.storageProof.slice(-4)}</span>
                            <button type="button" onClick={() => copyToClipboard(latestResult.storageProof!, "dashCid")} className="text-[#9faab6] hover:text-white"><Copy className="h-3 w-3" />{copiedField === "dashCid" ? <span className="ml-1 text-[9px]">Copied</span> : null}</button>
                          </div>
                          <div className="mt-1 text-[11px] text-[#9faab6]">0G Storage</div>
                        </div>
                        <div className="rounded-full border border-[#12453f] px-2 py-1 text-[9px] text-[#25d6c6]">Anchored</div>
                      </div>
                    ) : null}
                    {latestResult.proofRegistryTxHash ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[12px] text-[#dce4eb]">
                            <span className="truncate">Registry: {latestResult.proofRegistryTxHash.slice(0, 10)}...{latestResult.proofRegistryTxHash.slice(-6)}</span>
                            <button type="button" onClick={() => copyToClipboard(latestResult.proofRegistryTxHash!, "dashRegTx")} className="text-[#9faab6] hover:text-white"><Copy className="h-3 w-3" />{copiedField === "dashRegTx" ? <span className="ml-1 text-[9px]">Copied</span> : null}</button>
                          </div>
                          <div className="mt-1 text-[11px] text-[#9faab6]">ProofRegistry {latestResult.proofRegistryProofId ? `#${latestResult.proofRegistryProofId}` : ""}</div>
                        </div>
                        <div className="rounded-full border border-[#12453f] px-2 py-1 text-[9px] text-[#25d6c6]">On-chain</div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[12px] border border-dashed border-[#1b2b33] bg-[#091117] px-4 py-4 text-[12px] text-[#9faab6]">
                    No live proof has been recorded in this session yet. Run 1-click optimization to write a real 0G tx hash and ProofRegistry entry.
                  </div>
                )}
                {latestResult?.proofUrl ? (
                  <a
                    href={latestResult.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-[12px] text-[#25d6c6]"
                  >
                    View on 0G Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>

              <div data-testid="optimization-progress" className="yb-card rounded-[14px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">OPTIMIZATION PROGRESS</div>
                <div className="mt-5 flex items-center justify-between">
                  {[
                    { label: "Analyzing", done: true },
                    { label: "Optimizing", done: true },
                    { label: "Executing", active: true, step: "3" },
                    { label: "Done", step: "4" },
                  ].map((step, index) => (
                    <div key={step.label} className="relative flex flex-1 flex-col items-center">
                      {index < 3 ? (
                        <div className="absolute left-1/2 top-[18px] h-[2px] w-full bg-[#27423f]" />
                      ) : null}
                      <div
                        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-[13px] ${
                          step.done
                            ? "border-[#2ed86a] bg-[#12321c] text-[#2ed86a]"
                            : step.active
                              ? "yb-glow-border border-[#25d6c6] bg-[#0d2523] text-[#25d6c6]"
                              : "border-[#2b3640] bg-[#091117] text-[#d7dfe7]"
                        }`}
                      >
                        {step.done ? <CheckCheck className="h-4 w-4" /> : step.step}
                      </div>
                      <div className="mt-3 text-[12px] text-[#d8e1e8]">{step.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-[#d6dee6]">
                  <Zap className="h-4 w-4 text-[#f7b24c]" />
                  Executed in 8.42 seconds
                </div>
              </div>

              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">EXECUTING STRATEGY...</div>
                <div className="mt-4 space-y-2">
                  {executionSteps.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[13px] text-[#dce4eb]">
                      <Check className="h-4 w-4 text-[#2fe06d]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-[10px] xl:grid-cols-[1.18fr_1fr_1fr]">
              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">WHY 0G?</div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {whyOg.map((item) => (
                    <div key={item.title}>
                      <div className="flex items-center gap-2 text-[#24d9cb]">
                        <item.icon className="h-5 w-5" />
                        <div className="text-[11px] font-medium">{item.title}</div>
                      </div>
                      <div className="mt-2 text-[11px] text-[#d0d8e0]">{item.line1}</div>
                      <div className="text-[11px] text-[#9faab6]">{item.line2}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-[13px] text-[#d8e1e8]">The data layer for the AI-native Web3.</div>
              </div>

              <div data-testid="zerog-stats" className="yb-card rounded-[14px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-medium text-white">0G CHAIN STATS</div>
                    <div className="text-[10px] text-[#6b7a87]">source: 0g.ai network docs</div>
                  </div>
                  <a href={EXPLORER_BASE} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#25d6c6]">View on 0G Explorer <ExternalLink className="h-3 w-3" /></a>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {chainStats.map((item) => (
                    <div key={item.label}>
                      <div className="text-[10px] text-[#9faab6]">{item.label}</div>
                      <div className="mt-1 text-[13px] font-medium text-[#2fe06d]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="yb-card rounded-[14px] px-4 py-4">
                <div>
                  <div className="text-[12px] font-medium text-white">0G ECOSYSTEM IMPACT (30D)</div>
                  <div className="text-[10px] text-[#6b7a87]">source: 0g.ai network docs</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-5">
                  {impactStats.map((item) => (
                    <div key={item.label}>
                      <div className="text-[10px] text-[#9faab6]">{item.label}</div>
                      <div className="mt-1 text-[13px] font-medium text-[#2fe06d]">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-5">
                  <ImpactBars />
                  <ImpactLine path="M8 24C18 23 23 21 32 18C40 16 46 19 55 15C63 11 71 8 80 12C88 15 93 18 100 9" />
                  <ImpactLine path="M8 23C17 18 26 12 36 15C45 18 52 24 61 20C70 16 77 9 86 12C92 14 96 17 100 10" />
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#142028] pt-3 text-[11px] text-[#2fe06d]">
                  <ShieldCheck className="h-4 w-4" />
                  Secured by 0G. Verified by Zero-Knowledge.
                </div>
              </div>
            </div>

            <div className="yb-card rounded-[14px] px-4 py-3">
              <div className="grid gap-3 md:grid-cols-4">
                {footerItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-center gap-2 text-[12px] text-[#d7dfe7]">
                    <item.icon className="h-4 w-4 text-[#d7dfe7]" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside
            data-testid="right-agent-panel"
            className="yb-card rounded-[18px] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#1a6d66] bg-[#081717]">
                  <Bot className="h-8 w-8 text-[#22ddd0]" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-white">AI Agent</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[#2fe06d]">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#2fe06d]" />
                    Powered by 0G Compute Network
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#1b242d] bg-[#0a1117] text-[#d8e1e8]">
                  <Grid2X2 className="h-4 w-4" />
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#1b242d] bg-[#0a1117] text-[#d8e1e8]">
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3">
              <div className="pt-4">
                <AgentSideRail icon={MessageCircleMore} />
              </div>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#1b242d] bg-[#0b1117] px-4 py-4">
                <div className="text-[14px] text-[#edf3f8]">
                  Optimize my portfolio for the best
                  <br />
                  yield with low risk.
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                  <span>10:30 AM</span>
                  <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="pt-4">
                <AgentSideRail icon={Activity} />
              </div>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#1b242d] bg-[#0b1117] px-4 py-4">
                <div className="text-[15px] text-white">Analyzing your portfolio...</div>
                <div className="mt-4 space-y-3">
                  {agentChecklist.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[13px] text-[#d7e0e8]">
                      <Check className="h-4 w-4 text-[#2fe06d]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right text-[11px] text-[#a4b0bc]">10:30 AM</div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="pt-4">
                <AgentSideRail icon={CircleDashed} />
              </div>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#1b242d] bg-[#0b1117] px-4 py-4">
                <div className="text-[15px] text-white">Here&apos;s your optimal strategy:</div>
                <div className="mt-3 text-[14px] leading-7 text-[#e6edf3]">
                  You can increase your yield by
                  <br />
                  <span className="text-[16px] font-semibold text-[#2fe06d]">+{live.yieldIncreasePct}% (+${live.estimatedAnnualGain.toLocaleString()}/year)</span>
                  <br />
                  with low risk.
                </div>
                <button
                  type="button"
                  data-testid="execute-btn"
                  onClick={() => void runDashboardOptimization()}
                  disabled={!canOptimize}
                  className="yb-teal-button mt-5 flex w-full items-center justify-center gap-3 rounded-[12px] px-4 py-4 text-[16px] font-semibold text-[#071217]"
                >
                  <Zap className="h-5 w-5" />
                  {isOptimizing ? "Executing Optimization..." : "Execute Optimization"}
                </button>
                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                  <span>10:31 AM</span>
                  <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="pt-4">
                <AgentSideRail icon={Clock3} />
              </div>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#1b242d] bg-[#0b1117] px-4 py-4">
                <div className="text-[15px] text-white">Executing strategy...</div>
                <div className="mt-4 space-y-3">
                  {executionSteps.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[13px] text-[#d7e0e8]">
                      <Check className="h-4 w-4 text-[#2fe06d]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                  <span>10:31 AM</span>
                  <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
                </div>
              </div>
            </div>

            <div
              data-testid="optimization-result"
              className="mt-4 rounded-[16px] border border-[#1b242d] bg-[radial-gradient(circle_at_top_right,rgba(57,235,169,0.16),transparent_35%),linear-gradient(180deg,#0b1117_0%,#081015_100%)] px-4 py-5"
            >
              <div className="text-[15px] text-[#22ddd0]">
                Optimization Complete! 🎉
              </div>
              <div className="mt-3 text-[14px] text-[#ebf2f8]">Your new APY is now</div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="text-[64px] font-semibold leading-none text-[#68ff7a]">{live.optimizedApy}%</div>
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#68ff7a] shadow-[0_0_28px_rgba(104,255,122,0.26)]">
                  <CheckCheck className="h-10 w-10 text-[#68ff7a]" />
                </div>
              </div>
              <div className="mt-2 text-[13px] text-[#dbe4ec]">You&apos;re now earning more!</div>
              <button
                type="button"
                data-testid="agent-card-proof"
                onClick={() => setProofOpen(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#1a5b56] px-4 py-3 text-[14px] font-medium text-[#22ddd0]"
              >
                View on Explorer →
              </button>
              <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                <span>10:32 AM</span>
                <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3 px-1">
              <div className="text-[13px] text-[#d5dde6]">
                Built on 0G. Built for the Future.
              </div>
              <div className="text-[32px] font-semibold tracking-tight text-[#20d8ca]">0G</div>
            </div>
          </aside>
        </div>
      </section>

      <ProofModal
        open={proofOpen}
        onOpenChange={setProofOpen}
        cid={latestResult?.storageProof}
        txHash={latestResult?.txHash}
        walletAddress={latestResult?.walletAddress}
      />
    </>
  );
}
