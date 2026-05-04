"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef, lazy, Suspense, useCallback } from "react";
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
const ProofModal = lazy(() => import("@/components/modals/ProofModal"));
const OptimizationLoadingModal = lazy(() => import("@/components/modals/OptimizationLoadingModal"));
const HeroChart = lazy(() => import("@/components/dashboard/HeroChart"));
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  getAvailableWalletNetworks,
  getWalletNetworkConfig,
  WALLET_CONNECT_REQUEST_EVENT,
  WALLET_NETWORK_CHANGE_REQUEST_EVENT,
  type WalletNetworkKey,
} from "@/lib/wallet";
import { buildStrategyPlan } from "@/components/dashboard/strategy-plan";

import { MiniSpark, ImpactBars, ImpactLine, MetricIcon, AgentSideRail } from "@/components/dashboard/DashboardLazySections";

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

const footerItems = [
  { icon: Lock, label: "Secure" },
  { icon: ShieldCheck, label: "Non-Custodial" },
  { icon: Zap, label: "1-Click Execution" },
  { icon: Sparkles, label: "AI-Powered" },
] as const;

const walletNetworks = getAvailableWalletNetworks();
const ENTRY_MODE_STORAGE_KEY = "yb_entry_mode_selected";
const OPTIMIZATION_AUTO_DISMISS_PREFIX = "yb_optimization_auto_dismissed";

function formatPortfolioMetricValue(value: number, unit?: string) {
  const isNativeBalance = unit === "0G";
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: value > 0 && value < 1 ? 6 : 0,
    maximumFractionDigits: value > 0 && value < 1 ? 6 : 2,
  });

  return isNativeBalance ? `${formatted} ${unit}` : `$${formatted}`;
}

function formatProofId(value: string | undefined) {
  if (!value) return "pending";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export default function DashboardView() {
  const [proofOpen, setProofOpen] = useState(false);
  const [entryModeOpen, setEntryModeOpen] = useState(false);
  const [optimizationModalMinimized, setOptimizationModalMinimized] = useState(false);
  const [optimizationModalDismissed, setOptimizationModalDismissed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const { latestResult, optimize, isOptimizing, progress, streamingText } = useYieldOptimizer();
  const { portfolio, networkKey, loading, judgeMode } = usePortfolio();
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const walletMenuRef = useRef<HTMLDivElement | null>(null);
  const [globalStats, setGlobalStats] = useState<{
    hasData: boolean;
    formatted: { users: string; computeJobs: string; tvl: string; recentJobs24h: string; protocols: string };
  } | null>(null);

  useEffect(() => {
    if (isOptimizing) {
      setOptimizationModalDismissed(false);
      setOptimizationModalMinimized(false);
    }
  }, [isOptimizing]);

  useEffect(() => {
    if (judgeMode || typeof window === "undefined") return;
    const alreadySelected = window.localStorage.getItem(ENTRY_MODE_STORAGE_KEY);
    if (!alreadySelected) {
      setEntryModeOpen(true);
    }
  }, [judgeMode]);

  function enterUserMode() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ENTRY_MODE_STORAGE_KEY, "user");
    }
    setEntryModeOpen(false);
  }

  function markJudgeModeSelected() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ENTRY_MODE_STORAGE_KEY, "judge");
    }
  }

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

  useEffect(() => {
    if (!alertsOpen && !walletMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!alertsRef.current?.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
      if (!walletMenuRef.current?.contains(event.target as Node)) {
        setWalletMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAlertsOpen(false);
        setWalletMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [alertsOpen, walletMenuOpen]);

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

  const portfolioWalletLabel = portfolio?.walletAddress
    ? `${portfolio.walletAddress.slice(0, 6)}...${portfolio.walletAddress.slice(-4)}`
    : "wallet connected";
  const walletConnected = Boolean(portfolio?.walletAddress);
  const hasDetectedAssets = Object.keys(livePortfolio).length > 0;
  const canOptimize = !judgeMode && walletConnected && hasDetectedAssets && !loading && !isOptimizing;
  const walletDisconnected = !walletConnected && !judgeMode;
  const optimizationUnavailable = !canOptimize && !isOptimizing;
  const optimizationCtaClassName = optimizationUnavailable
    ? "yb-muted-button cursor-not-allowed text-[#d7dfe6]"
    : "yb-teal-button text-[#051015]";
  const optimizationCtaSubtitleClassName = optimizationUnavailable ? "text-[#b8c2cb]" : "text-[#0b4340]";
  const walletStatusLabel = latestResult
    ? `Live · ${new Date(latestResult.timestamp).toLocaleTimeString()}`
    : portfolio?.source === "wallet_proof_fallback"
      ? `Proof-backed demo snapshot · ${portfolioWalletLabel}`
    : hasDetectedAssets
      ? `Wallet live · ${portfolioWalletLabel}`
      : walletConnected
        ? "Wallet connected · no supported balance detected"
        : "Awaiting live wallet data";
  const walletStatusTone = latestResult || hasDetectedAssets ? "text-[#22e070]" : "text-[#d9a441]";

  function handleWalletButtonClick() {
    if (!walletConnected && !judgeMode) {
      window.dispatchEvent(
        new CustomEvent(WALLET_CONNECT_REQUEST_EVENT, {
          detail: { networkKey },
        }),
      );
      return;
    }

    setWalletMenuOpen((open) => !open);
  }

  async function runDashboardOptimization() {
    if (!canOptimize) return;
    await optimize(livePortfolio, "Optimize my portfolio for best yield with low risk");
  }

  const live = useMemo(() => {
    // Always prioritize portfolio API data for totalPortfolio
    const totalPortfolio = portfolio?.totalUSD ?? 0;
    const currentApy = portfolio?.currentAPY ?? latestResult?.current_apy ?? 0;
    const optimizedApy = latestResult?.optimized_apy ?? currentApy;
    const relativeApyLiftPct =
      currentApy > 0 && optimizedApy > currentApy
        ? Number((((optimizedApy - currentApy) / currentApy) * 100).toFixed(2))
        : 0;
    const yieldIncreasePct = latestResult ? relativeApyLiftPct : 0;
    const estimatedAnnualGain = latestResult?.estimatedAnnualGain ?? 0;
    const confidence = latestResult?.confidence ?? 0;
    return { totalPortfolio, currentApy, optimizedApy, yieldIncreasePct, estimatedAnnualGain, confidence };
  }, [latestResult, portfolio]);
  const portfolioMetricValue = formatPortfolioMetricValue(
    live.totalPortfolio,
    portfolio?.displayUnit,
  );
  const portfolioMetricLabel =
    portfolio?.displayUnit === "0G" ? "TOTAL 0G BALANCE" : "TOTAL PORTFOLIO VALUE";
  const activeNetwork = walletNetworks.find((item) => item.key === networkKey) ?? walletNetworks[0];
  const activeExplorerBase = getWalletNetworkConfig(networkKey).explorerBase;
  const latestExplorerLink = latestResult?.proofRegistryExplorerUrl ?? latestResult?.proofUrl ?? activeExplorerBase;
  const latestExplorerLabel = latestResult?.proofRegistryExplorerUrl
    ? "Open latest anchor tx"
    : latestResult?.proofUrl
      ? "Open latest proof tx"
      : "Open 0G Explorer";
  const hasProofReceipt = Boolean(
    latestResult?.storageProof ||
      latestResult?.txHash ||
      latestResult?.proofRegistryTxHash ||
      latestResult?.proofRegistryExplorerUrl,
  );
  const zkComplianceLink =
    latestResult?.zkCompliance?.proofRegistryExplorerUrl ??
    latestResult?.zkCompliance?.explorerUrl;
  const integrityAudit = latestResult?.integrityAudit;
  const auditApproved = integrityAudit?.status === "APPROVED";

  const liveDecisions = useMemo(() => {
    if (!latestResult) return decisionItems as readonly string[];
    const gain = latestResult.estimatedAnnualGain.toLocaleString();
    const bullets: string[] = [
      `${latestResult.recommended} selected with ${latestResult.confidence}% confidence`,
      `APY lift ${latestResult.current_apy}% → ${latestResult.optimized_apy}% (+${latestResult.yield_increase_pct}%)`,
      latestResult.integrityAudit
        ? `Integrity Auditor: ${latestResult.integrityAudit.status === "APPROVED" ? "Approved" : "Rejected"}`
        : "Integrity Auditor: pending proof sync",
      `Projected annual gain +$${gain} on ${portfolioMetricValue} portfolio`,
      latestResult.proofRegistryProofId
        ? `ProofRegistry entry #${latestResult.proofRegistryProofId} recorded on ${activeNetwork.label}`
        : `Proof anchored to 0G Storage (CID ${latestResult.storageProof?.slice(0, 10) ?? "pending"}…)`,
    ];
    return bullets;
  }, [activeNetwork.label, latestResult, portfolioMetricValue]);

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

  const statusTimeLabel = latestResult
    ? new Date(latestResult.timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Live now";

  const optimizationNotification = latestResult
    ? {
        title: "Optimization succeeded",
        message: `${latestResult.recommended} raised APY from ${latestResult.current_apy}% to ${latestResult.optimized_apy}%.`,
        gain: `+$${latestResult.estimatedAnnualGain.toLocaleString()} / year`,
        timestamp: statusTimeLabel,
      }
    : null;
  const notificationCount = optimizationNotification ? 1 : 0;

  const syncPct = latestResult?.storageProof ? 100 : latestResult ? 62 : portfolio?.tokens?.length ? 98.4 : 0;
  const chainStats = useMemo(
    () => [
      { label: "Proof Wallets", value: globalStats?.formatted.users ?? "0" },
      { label: "Compute Jobs", value: globalStats?.formatted.computeJobs ?? "0" },
      { label: "Tracked TVL", value: globalStats?.formatted.tvl ?? "$0" },
      { label: "Jobs (24h)", value: globalStats?.formatted.recentJobs24h ?? "0" },
      { label: "Protocols", value: globalStats?.formatted.protocols ?? "0" },
      { label: "Proof Coverage", value: globalStats?.hasData ? "100%" : "0%" },
    ],
    [globalStats],
  );
  const impactStats = useMemo(
    () => [
      { label: "Confidence", value: `${live.confidence}%` },
      { label: "Projected APY", value: `${live.optimizedApy}%` },
      { label: "Annual Gain", value: `$${live.estimatedAnnualGain.toLocaleString()}` },
    ],
    [live],
  );
  const progressSteps = [
    { label: "Analyzing", key: "analyzing" },
    { label: "Optimizing", key: "optimizing" },
    { label: "Executing", key: "executing" },
    { label: "Anchoring", key: "anchoring" },
    { label: "Done", key: "done" },
  ] as const;
  const activeProgressIndex = progressSteps.findIndex((step) => step.key === progress);
  const optimizationAutoDismissKey = useMemo(() => {
    if (!latestResult) return null;
    const wallet = latestResult.walletAddress ?? portfolio?.walletAddress ?? "no-wallet";
    const proofKey =
      latestResult.proofRegistryTxHash ??
      latestResult.storageProof ??
      latestResult.timestamp;

    if (!proofKey) return null;
    return `${OPTIMIZATION_AUTO_DISMISS_PREFIX}:${networkKey}:${wallet.toLowerCase()}:${proofKey}`;
  }, [latestResult, networkKey, portfolio?.walletAddress]);
  const integrityStackVerified = Boolean(
    latestResult?.storageProof &&
      latestResult?.proofRegistryTxHash &&
      latestResult.integrityLayers?.sovereignMemory &&
      latestResult.integrityLayers?.zkReasoning &&
      latestResult.integrityLayers?.governance &&
      latestResult.integrityLayers?.neuralHandshake &&
      latestResult.integrityLayers?.zkCompliance,
  );
  const hasOptimizationProgress = isOptimizing || (progress === "done" && !integrityStackVerified);
  const showOptimizationModal =
    hasOptimizationProgress && !optimizationModalDismissed && !optimizationModalMinimized;
  const showOptimizationProgressChip =
    hasOptimizationProgress && !optimizationModalDismissed && optimizationModalMinimized;
  const strategyPlan = useMemo(() => buildStrategyPlan(latestResult), [latestResult]);

  const dismissOptimizationProgress = useCallback(() => {
    setOptimizationModalDismissed(true);
    setOptimizationModalMinimized(false);
    if (typeof window !== "undefined" && optimizationAutoDismissKey) {
      window.sessionStorage.setItem(optimizationAutoDismissKey, "true");
    }
  }, [optimizationAutoDismissKey]);

  useEffect(() => {
    if (isOptimizing || !optimizationAutoDismissKey || typeof window === "undefined") return;
    if (window.sessionStorage.getItem(optimizationAutoDismissKey) === "true") {
      setOptimizationModalDismissed(true);
      setOptimizationModalMinimized(false);
    }
  }, [isOptimizing, optimizationAutoDismissKey]);

  useEffect(() => {
    if (isOptimizing || progress !== "done" || optimizationModalDismissed) return;
    const timer = window.setTimeout(() => {
      dismissOptimizationProgress();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [dismissOptimizationProgress, isOptimizing, optimizationModalDismissed, progress]);

  useEffect(() => {
    if (!integrityStackVerified) return;
    dismissOptimizationProgress();
  }, [dismissOptimizationProgress, integrityStackVerified]);

  return (
    <>
      <section className="animate-fade-in-up p-[10px] md:h-full">
        <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="min-w-0 space-y-[10px]">
            <header className="flex flex-col gap-3 rounded-[18px] border border-[#141c23] bg-[#060c11] px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white">GM, Builder! 👋</div>
                <div className="mt-1 text-[12px] text-[#9daab6]">
                  Your AI agent is working 24/7 to grow your wealth.
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                <div ref={walletMenuRef} className="relative flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={handleWalletButtonClick}
                    className="flex h-[46px] w-full min-w-0 items-center gap-3 rounded-[12px] border border-[#1b242d] bg-[#0a1117] px-4 text-left transition hover:border-[#2ad7c8]/40 sm:w-auto sm:min-w-[220px]"
                  >
                    <Wallet2 className="h-4 w-4 text-[#d9e1e8]" />
                    <div>
                      <div className="text-[11px] text-[#d9e1e8]">Wallet</div>
                      <div className="mt-0.5 text-[12px] font-medium text-[#2ad7c8]">
                        {portfolio?.walletAddress ? portfolioWalletLabel : "Connect Wallet"}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-[#d9e1e8]" />
                  </button>

                  {walletMenuOpen ? (
                    <div className="absolute right-0 top-[54px] z-20 w-full min-w-[220px] rounded-[16px] border border-[#17313a] bg-[#081117] p-2 shadow-[0_18px_44px_rgba(0,0,0,0.45)] sm:w-[220px]">
                      <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.12em] text-[#87a0ad]">
                        Choose Network
                      </div>
                      <div className="space-y-2">
                        {walletNetworks.map((network) => (
                          <button
                            key={network.key}
                            type="button"
                            disabled={!network.enabled}
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent(WALLET_NETWORK_CHANGE_REQUEST_EVENT, {
                                  detail: { networkKey: network.key as WalletNetworkKey },
                                }),
                              );
                              setWalletMenuOpen(false);
                            }}
                            className={`flex w-full items-start justify-between rounded-[12px] border px-3 py-3 text-left transition ${
                              network.key === networkKey
                                ? "border-[rgba(0,201,177,0.35)] bg-[rgba(0,201,177,0.08)]"
                                : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(0,201,177,0.25)]"
                            } ${!network.enabled ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            <div>
                              <div className="text-[13px] font-semibold text-white">
                                {network.key === "testnet" ? "Testnet" : "Mainnet"}
                              </div>
                              <div className="mt-1 text-[11px] text-[#8ea1af]">
                                {network.enabled ? network.chainName : "Set env first"}
                              </div>
                            </div>
                            <div className="rounded-full border border-[#21453f] px-2 py-1 text-[10px] font-semibold text-[#2ad7c8]">
                              {network.key === activeNetwork.key ? "Current" : "Open"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div ref={alertsRef} className="relative">
                  <button
                    type="button"
                    data-testid="alerts-button"
                    aria-expanded={alertsOpen}
                    aria-label="Optimization notifications"
                    onClick={() => setAlertsOpen((open) => !open)}
                    className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-[#1b242d] bg-[#0a1117] text-white transition hover:border-[#2ad7c8]/50"
                  >
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1cdad0] px-1 text-[9px] font-semibold text-[#061015]">
                        {notificationCount}
                      </span>
                    ) : null}
                  </button>

                  {alertsOpen ? (
                    <div
                      data-testid="optimization-notification-panel"
                      className="absolute right-0 top-[54px] z-20 w-[min(320px,calc(100vw-32px))] rounded-[16px] border border-[#17313a] bg-[#081117] p-3 shadow-[0_18px_44px_rgba(0,0,0,0.45)] sm:w-[320px]"
                    >
                      <div className="flex items-start justify-between gap-3 rounded-[12px] border border-[#16353a] bg-[linear-gradient(135deg,rgba(34,221,208,0.12),rgba(8,17,23,0.96))] p-3">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#1f5d53] bg-[#0b1b1a] text-[#28decf]">
                            <Check className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-white">
                              {optimizationNotification?.title ?? "No notifications yet"}
                            </div>
                            <div className="mt-1 text-[12px] leading-5 text-[#cdd8e1]">
                              {optimizationNotification?.message ?? "Run an optimization to get a success notification here."}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="rounded-full border border-[#21453f] bg-[#0b1a18] px-2 py-1 text-[#29de74]">
                                {optimizationNotification?.gain ?? "Waiting for first run"}
                              </span>
                              <span className="text-[#8ea1af]">
                                {optimizationNotification ? `Synced ${optimizationNotification.timestamp}` : "Standby"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 px-1">
                        <div className="text-[11px] text-[#8ea1af]">
                          {latestResult?.storageProof
                            ? `CID ${latestResult.storageProof.slice(0, 10)}...`
                            : "Proof receipt will appear after execution"}
                        </div>
                        {latestResult?.proofUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAlertsOpen(false);
                              setProofOpen(true);
                            }}
                            className="text-[11px] font-semibold text-[#2ad7c8]"
                          >
                            View proof
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  data-testid="boost-yield-cta"
                  onClick={() => void runDashboardOptimization()}
                  disabled={!canOptimize}
                  aria-busy={isOptimizing}
                  className={`${optimizationCtaClassName} flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] px-5 text-left transition sm:w-auto sm:min-w-[248px]`}
                >
                  {isOptimizing ? <CircleDashed className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  <div>
                    <div className="text-[14px] font-semibold">
                      {isOptimizing
                        ? "Optimization Running..."
                        : judgeMode
                          ? "Judge Snapshot Active"
                          : walletDisconnected
                            ? "Connect Wallet to Optimize"
                            : "Boost My Yield Now"}
                    </div>
                    <div className={`text-[11px] ${optimizationCtaSubtitleClassName}`}>
                      {isOptimizing
                        ? "Popup optimizer sedang berjalan"
                        : judgeMode
                          ? "Read-only review on the latest proof-backed result"
                          : walletDisconnected
                            ? "Connect a wallet first to unlock live optimization"
                            : "1-Click AI Optimization"}
                    </div>
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
                        <span className={walletStatusTone}>
                          {walletStatusLabel}
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

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="sm:border-r sm:border-[#182028] sm:pr-4">
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[#a9b5c0]">
                        Relative APY Lift
                      </div>
                      <div className="mt-2 text-[26px] font-semibold text-[#22e070]">+{live.yieldIncreasePct}%</div>
                      <div className="mt-1 text-[13px] text-[#29e072]">
                        <span className="text-[#d8e1e9]">vs current APY baseline</span>
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

                <Suspense fallback={<div className="h-[176px] animate-pulse bg-[#0a1218] rounded-lg" />}>
                  <HeroChart
                    hasData={Boolean(latestResult || hasDetectedAssets)}
                    mode={judgeMode || portfolio?.source === "wallet_proof_fallback" ? "snapshot" : "live"}
                  />
                </Suspense>
              </div>
            </div>

            <div className="grid gap-[10px] xl:grid-cols-5">
              {(() => {
                const hasData = globalStats?.hasData ?? false;
                const dash = "—";
                const cards = [
                  { icon: Users, value: globalStats?.formatted.users ?? dash, label: "Proof Wallets", sublabel: hasData ? "Unique wallets with stored 0G proof" : "Awaiting first optimization" },
                  { icon: DollarSign, value: globalStats?.formatted.tvl ?? dash, label: "Historical Proof TVL", sublabel: hasData ? "From stored 0G proof records, not live wallet balance" : "Awaiting first optimization" },
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
                    <div className="text-[13px] text-white">
                      {latestResult?.storageProof
                        ? "Latest optimization proof is synchronized to 0G Storage"
                        : latestResult?.proofStatusDetail
                          ? "Latest optimization finished, but proof sync is currently blocked"
                        : "Wallet data is ready for the next 0G proof write"}
                    </div>
                    <div className="mt-1 text-[11px] text-[#a8b4bf]">
                      {latestResult?.storageProof
                        ? `Last synced: ${statusTimeLabel} to 0G Storage`
                        : latestResult?.proofStatusDetail
                          ? latestResult.proofStatusDetail
                        : portfolio?.tokens?.length
                          ? `Wallet snapshot live for ${portfolioWalletLabel}`
                          : "Waiting for the first live wallet snapshot"}
                    </div>
                    {integrityAudit ? (
                      <div
                        data-testid="integrity-auditor-indicator"
                        className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          auditApproved
                            ? "border-[#12453f] bg-[#0b1a18] text-[#2fe06d]"
                            : "border-[#553034] bg-[#1a0c0e] text-[#ff9a9a]"
                        }`}
                      >
                        Integrity Auditor: {auditApproved ? "Approved" : "Rejected"}
                        <span className="font-medium text-[#cfd9e1]">
                          {auditApproved ? "Logic Guardrail passed" : "Proof write blocked"}
                        </span>
                      </div>
                    ) : null}
                    {latestResult?.zkCompliance ? (
                      <div
                        data-testid="zk-compliance-report"
                        className="mt-2 text-[11px] text-[#d7e0e8]"
                      >
                        Last Strategy Execution: {latestResult.zkCompliance.policyCompliantPct}% Policy Compliant (Proof ID:{" "}
                        {zkComplianceLink ? (
                          <a
                            href={zkComplianceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[#22ddd0] underline decoration-[rgba(34,221,208,0.45)] underline-offset-2 transition hover:text-white"
                          >
                            {formatProofId(latestResult.zkCompliance.proofId)}
                          </a>
                        ) : (
                          formatProofId(latestResult.zkCompliance.proofId)
                        )}
                        )
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between text-[13px] text-[#d8e1e9]">
                    <span>{latestResult ? "Synchronized" : "Preparing proof sync"}</span>
                    <span>{syncPct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-[12px] rounded-full bg-[#0c141b] p-[2px]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#22ddd0_0%,#18aeb8_100%)]"
                      style={{ width: `${syncPct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProofOpen(true)}
                  data-testid="view-proof-banner"
                  className="flex w-full items-center gap-3 rounded-[14px] border border-[#173832] bg-[#081313] px-4 py-3 text-left xl:w-auto"
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
                  {
                    label: "TOTAL PORTFOLIO VALUE",
                    value: portfolioMetricValue,
                    change: portfolio?.tokens?.length ? `Wallet live · ${portfolioWalletLabel}` : "Waiting for wallet sync",
                    icon: Wallet2,
                    accent: false,
                  },
                  {
                    label: "PROJECTED ANNUAL GAIN",
                    value: `$${live.estimatedAnnualGain.toLocaleString()}`,
                    change: latestResult ? "Based on the latest proof-backed route" : "Calculated from the active portfolio snapshot",
                    icon: DollarSign,
                    accent: false,
                  },
                  {
                    label: "AVG. CURRENT APY",
                    value: `${live.currentApy}%`,
                    change: latestResult ? `Last executed at ${statusTimeLabel}` : "Current wallet baseline",
                    icon: Gauge,
                    accent: false,
                  },
                  {
                    label: "POTENTIAL AFTER AI",
                    value: `${live.optimizedApy}%`,
                    change: `↑ ${live.yieldIncreasePct}% relative lift`,
                    icon: Plane,
                    accent: true,
                  },
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
                        {index === 0 ? portfolioMetricLabel : item.label}
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
                <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-3">
                  <div className="rounded-[10px] bg-[#0d1811] p-2 text-[#2fe06d]">+{live.yieldIncreasePct}%<div className="mt-1 text-[#cad4dd]">Relative lift</div></div>
                  <div className="rounded-[10px] bg-[#0d1811] p-2 text-[#2fe06d]">+${live.estimatedAnnualGain.toLocaleString()}<div className="mt-1 text-[#cad4dd]">More per year</div></div>
                  <div className="rounded-[10px] bg-[#0d1811] p-2 text-[#2fe06d]">Lower<div className="mt-1 text-[#cad4dd]">Risk</div></div>
                </div>
              </div>

              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-medium text-white">AI DECISION LOG</div>
                  <Link href="/analytics" className="rounded-[10px] border border-[#24303a] px-3 py-1 text-[11px] text-[#d7e0e8]">
                    Why?
                  </Link>
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
                  <Link href="/opportunities" className="rounded-[10px] border border-[#24303a] px-3 py-1 text-[11px] text-[#d7e0e8]">
                    View all
                  </Link>
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
                        <div className="mt-1 text-[11px] text-[#9faab6]">{activeNetwork.label}</div>
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
                    {latestResult?.proofStatusDetail
                      ? `Latest optimization completed, but proof sync is blocked: ${latestResult.proofStatusDetail}`
                      : "No live proof has been recorded in this session yet. Run 1-click optimization to write a real 0G tx hash and ProofRegistry entry."}
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
	                  {progressSteps.map((step, index) => {
	                    const done = progress === "done" || index < activeProgressIndex;
	                    const active = index === activeProgressIndex && progress !== "done";

	                    return (
	                    <div key={step.label} className="relative flex flex-1 flex-col items-center">
	                      {index < progressSteps.length - 1 ? (
	                        <div className="absolute left-1/2 top-[18px] h-[2px] w-full bg-[#27423f]" />
	                      ) : null}
	                      <div
	                        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-[13px] ${
	                          done
	                            ? "border-[#2ed86a] bg-[#12321c] text-[#2ed86a]"
	                            : active
	                              ? "yb-glow-border border-[#25d6c6] bg-[#0d2523] text-[#25d6c6]"
	                              : "border-[#2b3640] bg-[#091117] text-[#d7dfe7]"
	                        }`}
	                      >
	                        {done ? <CheckCheck className="h-4 w-4" /> : index + 1}
	                      </div>
	                      <div className="mt-3 text-[12px] text-[#d8e1e8]">{step.label}</div>
	                    </div>
	                  )})}
	                </div>
	                <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-[#d6dee6]">
	                  <Zap className="h-4 w-4 text-[#f7b24c]" />
	                  Executed in {(latestResult?.executionSeconds ?? 8.42).toFixed(2)} seconds
	                </div>
	              </div>

              <div className="yb-card rounded-[14px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">PROPOSED EXECUTION PLAN</div>
                <div className="mt-1 text-[11px] text-[#9faab6]">
                  Proof-backed recommendation flow, not an automatic on-chain trade.
                </div>
                <div className="mt-4 space-y-2">
                  {strategyPlan.map((item) => (
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
	                    <div className="text-[10px] text-[#6b7a87]">source: live app runtime</div>
	                  </div>
                  <a href={latestExplorerLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#25d6c6]">{latestExplorerLabel} <ExternalLink className="h-3 w-3" /></a>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
	                  <div className="text-[10px] text-[#6b7a87]">source: optimizer activity and proof history</div>
	                </div>
                <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
                  {impactStats.map((item) => (
                    <div key={item.label}>
                      <div className="text-[10px] text-[#9faab6]">{item.label}</div>
                      <div className="mt-1 text-[13px] font-medium text-[#2fe06d]">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-5 sm:grid-cols-3">
                  <ImpactBars />
                  <ImpactLine path="M8 24C18 23 23 21 32 18C40 16 46 19 55 15C63 11 71 8 80 12C88 15 93 18 100 9" />
                  <ImpactLine path="M8 23C17 18 26 12 36 15C45 18 52 24 61 20C70 16 77 9 86 12C92 14 96 17 100 10" />
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#142028] pt-3 text-[11px] text-[#2fe06d]">
                  <ShieldCheck className="h-4 w-4" />
                  Secured by 0G. Verified by Zero-Knowledge.
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3 md:hidden">
                  {footerItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-center gap-2 rounded-[11px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[11px] text-[#d7dfe7]"
                    >
                      <item.icon className="h-4 w-4 text-[#d7dfe7]" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden yb-card rounded-[14px] px-4 py-3 md:block">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                <Link href="/watchlist" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#1b242d] bg-[#0a1117] text-[#d8e1e8]">
                  <Grid2X2 className="h-4 w-4" />
                </Link>
                <Link href="/agent" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#1b242d] bg-[#0a1117] text-[#d8e1e8]">
                  <Expand className="h-4 w-4" />
                </Link>
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
                  <span>{statusTimeLabel}</span>
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
                <div className="mt-4 text-right text-[11px] text-[#a4b0bc]">{statusTimeLabel}</div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="pt-4">
                <AgentSideRail icon={CircleDashed} />
              </div>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#1b242d] bg-[#0b1117] px-4 py-4">
                <div className="text-[15px] text-white">
                  {streamingText ? "Latest recommendation:" : "Here's your optimal strategy:"}
                </div>
                <div className="mt-3 text-[14px] leading-7 text-[#e6edf3]">
                  {streamingText ? (
                    streamingText
                  ) : (
                    <>
                      You can increase your yield by
                      <br />
                      <span className="text-[16px] font-semibold text-[#2fe06d]">+{live.yieldIncreasePct}% relative APY lift (+${live.estimatedAnnualGain.toLocaleString()}/year)</span>
                      <br />
                      with low risk.
                    </>
                  )}
                </div>
                <button
                  type="button"
                  data-testid="execute-btn"
                  onClick={() => void runDashboardOptimization()}
                  disabled={!canOptimize}
                  aria-busy={isOptimizing}
                  className={`${optimizationCtaClassName} mt-5 flex w-full items-center justify-center gap-3 rounded-[12px] px-4 py-4 text-[16px] font-semibold transition`}
                >
                  {isOptimizing ? <CircleDashed className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                  {isOptimizing
                    ? "Optimization In Progress..."
                    : judgeMode
                      ? "Judge snapshot is read-only"
                      : walletDisconnected
                        ? "Connect Wallet to Continue"
                        : "Execute Optimization"}
                </button>
                {judgeMode ? (
                  <div className="mt-3 text-[12px] leading-5 text-[#8eced3]">
                    Judge mode is read-only. It shows the latest recorded proof-backed snapshot and receipt for review. Exit judge mode from the sidebar to run a fresh optimization as a normal user.
                  </div>
                ) : null}
                {walletConnected && !hasDetectedAssets ? (
                  <div className="mt-3 text-[12px] leading-5 text-[#d3ac62]">
                    Wallet is connected, but the current RPC snapshot only surfaces supported on-chain balances. If the native balance is still zero or assets are not indexed yet, the optimizer will wait for a real position to evaluate.
                  </div>
                ) : null}
                {!walletConnected && !judgeMode ? (
                  <div className="mt-3 text-[12px] leading-5 text-[#8eced3]">
                    No wallet is connected yet. Use the sidebar to connect normally or open judge mode for the read-only review snapshot.
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                  <span>{statusTimeLabel}</span>
                  <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="pt-4">
                <AgentSideRail icon={Clock3} />
              </div>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#1b242d] bg-[#0b1117] px-4 py-4">
                <div className="text-[15px] text-white">
                  {progress === "done" ? "Proof-backed execution plan ready" : "Preparing proof-backed execution plan..."}
                </div>
                <div className="mt-1 text-[12px] text-[#9faab6]">
                  Recommendation summary only. No automatic swap or staking transaction is executed here.
                </div>
                <div className="mt-4 space-y-3">
                  {strategyPlan.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[13px] text-[#d7e0e8]">
                      <Check className="h-4 w-4 text-[#2fe06d]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                  <span>{statusTimeLabel}</span>
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
              <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[48px] font-semibold leading-none text-[#68ff7a] sm:text-[64px]">{live.optimizedApy}%</div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#68ff7a] shadow-[0_0_28px_rgba(104,255,122,0.26)] sm:h-24 sm:w-24">
                  <CheckCheck className="h-8 w-8 text-[#68ff7a] sm:h-10 sm:w-10" />
                </div>
              </div>
              <div className="mt-2 text-[13px] text-[#dbe4ec]">
                {latestResult?.storageProof
                  ? `Proof stored as ${latestResult.storageProof.slice(0, 12)}...`
                  : "Run the optimizer to create the first proof-backed result."}
              </div>
              <button
                type="button"
                data-testid="agent-card-proof"
                onClick={() => setProofOpen(true)}
                disabled={!hasProofReceipt}
                className={
                  hasProofReceipt
                    ? "mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#1a5b56] px-4 py-3 text-[14px] font-medium text-[#22ddd0]"
                    : "mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] font-medium text-[#7c8a96]"
                }
              >
                {hasProofReceipt ? "Open proof details" : "Proof sync pending"}
              </button>
              <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
                <span>{statusTimeLabel}</span>
                <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-[13px] text-[#d5dde6]">
                Built on 0G. Built for the Future.
              </div>
              <div className="text-[32px] font-semibold tracking-tight text-[#20d8ca]">0G</div>
            </div>
          </aside>
        </div>
      </section>

      <Suspense fallback={null}>
        <OptimizationLoadingModal
          open={showOptimizationModal}
          progress={progress}
          streamingText={streamingText}
          walletLabel={portfolio?.walletAddress ? portfolioWalletLabel : "Wallet not connected"}
          portfolioValue={portfolioMetricValue}
          integrityLayers={latestResult?.integrityLayers}
          onMinimize={() => setOptimizationModalMinimized(true)}
          onClose={() => {
            if (progress === "done") {
              dismissOptimizationProgress();
            }
          }}
        />
      </Suspense>

      {showOptimizationProgressChip ? (
        <button
          type="button"
          data-testid="optimization-progress-chip"
          onClick={() => setOptimizationModalMinimized(false)}
          className="fixed bottom-4 right-4 z-[55] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-[18px] border border-[rgba(42,215,200,0.28)] bg-[rgba(5,12,17,0.94)] px-4 py-3 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur md:bottom-6 md:right-6"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2ad7c8]/35 bg-[#07191a] text-[#22ddd0]">
            {progress === "done" ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <CircleDashed className="h-4 w-4 animate-spin" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-white">
              {progress === "done" ? "Primary proof ready" : "Optimization running"}
            </span>
            <span className="block truncate text-[11px] text-[#8fa3b0]">
              {progress === "done"
                ? "Open progress to review receipt and background sync."
                : "Open progress to see ProofRegistry, memory, ZK, and compliance steps."}
            </span>
          </span>
        </button>
      ) : null}

      {entryModeOpen ? (
        <div
          data-testid="entry-mode-modal"
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-3 backdrop-blur-md sm:items-center sm:px-4 sm:py-6"
        >
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-[24px] border border-[rgba(42,215,200,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(34,221,208,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(31,225,123,0.14),transparent_32%),linear-gradient(180deg,#071018_0%,#04080d_100%)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[30px] sm:p-7"
        >
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#22ddd0]/10 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-[#1fe17b]/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2ad7c8]/25 bg-[#092022] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#7feee4]">
              <Zap className="h-3.5 w-3.5" />
              Choose your path
            </div>
            <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[1fr_0.8fr] lg:items-end">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-[25px] font-semibold leading-tight text-white sm:text-[42px]">
                  Welcome to YieldBoost AI
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#b8c7d4] sm:mt-3 sm:text-[15px] sm:leading-6">
                  Pick the review surface you need. Judges can inspect the proof-backed 0G snapshot instantly, while users can continue into the normal dashboard and connect a wallet only when ready.
                </p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] leading-5 text-[#94a8b6] sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-[12px]">
                Mainnet-first proof trail, 0G Storage CIDs, ProofRegistry anchors, and integrity memory are available from Judge Mode.
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
              <Link
                href="/judge"
                data-testid="entry-judge-mode"
                onClick={markJudgeModeSelected}
                className="group rounded-[20px] border border-[#2ad7c8]/35 bg-[linear-gradient(135deg,rgba(34,221,208,0.18),rgba(8,24,28,0.76))] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#7feee4] hover:shadow-[0_18px_55px_rgba(34,221,208,0.18)] sm:rounded-[24px] sm:p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#2ad7c8]/35 bg-[#06191b] text-[#22ddd0] sm:h-12 sm:w-12 sm:rounded-[16px]">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="mt-3 text-[18px] font-semibold text-white sm:mt-5 sm:text-[20px]">Judge Mode</div>
                <p className="mt-1.5 text-[12px] leading-5 text-[#aec0cd] sm:mt-2 sm:text-[13px] sm:leading-6">
                  Open the read-only review route with the latest stored proof, 0G evidence anchors, and verifier-friendly audit trail.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[#7feee4] sm:mt-5 sm:text-[12px]">
                  <span>Review proof</span>
                  <ExternalLink className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>

              <button
                type="button"
                data-testid="entry-user-mode"
                onClick={enterUserMode}
                className="group rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(7,13,18,0.9))] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#3b4b58] hover:shadow-[0_18px_55px_rgba(0,0,0,0.25)] sm:rounded-[24px] sm:p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/12 bg-[#0b1218] text-[#dce7ef] sm:h-12 sm:w-12 sm:rounded-[16px]">
                  <UserRound className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="mt-3 text-[18px] font-semibold text-white sm:mt-5 sm:text-[20px]">User Mode</div>
                <p className="mt-1.5 text-[12px] leading-5 text-[#aec0cd] sm:mt-2 sm:text-[13px] sm:leading-6">
                  Continue to the normal dashboard. No wallet is required until you decide to connect and run a live optimization.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[#dce7ef] sm:mt-5 sm:text-[12px]">
                  <span>Enter dashboard</span>
                  <CheckCheck className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        </div>
        </div>
      ) : null}

      <Suspense fallback={null}>
        <ProofModal
          open={proofOpen}
          onOpenChange={setProofOpen}
          cid={latestResult?.storageProof}
          txHash={latestResult?.txHash}
          blockNumber={latestResult?.blockNumber}
          explorerUrl={latestResult?.proofUrl}
          timestamp={latestResult?.timestamp}
          walletAddress={latestResult?.walletAddress}
          proofRegistryAddress={latestResult?.proofRegistryAddress}
          proofRegistryTxHash={latestResult?.proofRegistryTxHash}
          proofRegistryProofId={latestResult?.proofRegistryProofId}
          proofRegistryExplorerUrl={latestResult?.proofRegistryExplorerUrl}
          integrityAudit={latestResult?.integrityAudit}
          mintPortfolio={livePortfolio}
          networkKey={networkKey}
          showMintAction={!judgeMode}
          decision={latestResult ? {
            current_apy: latestResult.current_apy,
            optimized_apy: latestResult.optimized_apy,
            recommended: latestResult.recommended,
            reasoning: latestResult.reasoning,
            yield_increase_pct: latestResult.yield_increase_pct,
            estimatedAnnualGain: latestResult.estimatedAnnualGain,
            confidence: latestResult.confidence,
          } : undefined}
        />
      </Suspense>
    </>
  );
}
