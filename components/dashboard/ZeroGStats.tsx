"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Box, Cpu, ShieldCheck } from "lucide-react";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";

const whyZeroG = [
  {
    icon: Box,
    title: "AI-NATIVE STORAGE",
    line1: "Persistent agent state",
    line2: "Low-cost, high-throughput access",
  },
  {
    icon: ShieldCheck,
    title: "VERIFIABLE COMPUTE",
    line1: "ZK-backed execution trails",
    line2: "Trustless optimization proofs",
  },
  {
    icon: Cpu,
    title: "BUILT FOR AGENTS",
    line1: "Inference + orchestration ready",
    line2: "Designed for autonomous apps",
  },
] as const;

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

export default function ZeroGStats() {
  const { latestResult } = useYieldOptimizer();
  const [globalStats, setGlobalStats] = useState<{
    hasData: boolean;
    formatted: {
      users: string;
      computeJobs: string;
      tvl: string;
      recentJobs24h: string;
      protocols: string;
    };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/stats/global", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setGlobalStats(data);
        }
      } catch {
        if (!cancelled) {
          setGlobalStats(null);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [latestResult]);

  const chainStats = useMemo(
    () => [
      { label: "Wallets Optimized", value: globalStats?.formatted.users ?? "0" },
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
      { label: "Confidence", value: `${latestResult?.confidence ?? 96}%` },
      { label: "Projected APY", value: `${latestResult?.optimized_apy ?? 0}%` },
      { label: "Annual Gain", value: latestResult ? `$${latestResult.estimatedAnnualGain.toLocaleString()}` : "$0" },
    ],
    [latestResult],
  );

  return (
    <section
      data-testid="zerog-stats"
      className="grid gap-[10px] xl:grid-cols-[1.18fr_1fr_1fr]"
    >
      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="text-[12px] font-medium text-white">WHY 0G NETWORK?</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {whyZeroG.map((item) => (
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

      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] font-medium text-white">0G NETWORK STATS</div>
          <a
            href="https://chainscan-galileo.0g.ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#25d6c6]"
          >
            View on 0G Explorer
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {chainStats.map((stat) => (
            <div key={stat.label}>
              <div className="text-[10px] text-[#9faab6]">{stat.label}</div>
              <div className="mt-1 text-[13px] font-medium text-[#2fe06d]">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="text-[12px] font-medium text-white">0G NETWORK IMPACT (30D)</div>
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
        <div className="mt-3 flex items-center gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3 text-[11px] text-[#2fe06d]">
          <ShieldCheck className="h-4 w-4" />
          Secured by 0G Network. Verified by Zero-Knowledge.
        </div>
      </div>
    </section>
  );
}
