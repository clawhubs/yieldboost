"use client";

import { useState, useMemo, useEffect } from "react";
import { Box, Disc3, Globe, HeartHandshake } from "lucide-react";
import ProofModal from "@/components/modals/ProofModal";
import { proofDetails } from "@/lib/mock-data";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import { usePortfolio } from "@/hooks/usePortfolio";
import DashboardHeader from "./DashboardHeader";
import DashboardHero from "./DashboardHero";
import DashboardStatsGrid from "./DashboardStatsGrid";
import DashboardProofBanner from "./DashboardProofBanner";
import DashboardKPIRow from "./DashboardKPIRow";
import DashboardMiddleCards from "./DashboardMiddleCards";
import DashboardProofRow from "./DashboardProofRow";
import DashboardEcosystem from "./DashboardEcosystem";
import DashboardAgentPanel from "./DashboardAgentPanel";
import type { GlobalStatsData } from "./types";

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

export default function DashboardView() {
  const [proofOpen, setProofOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { latestResult } = useYieldOptimizer();
  const { portfolio } = usePortfolio();
  const [globalStats, setGlobalStats] = useState<GlobalStatsData | null>(null);

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
    return () => { cancelled = true; };
  }, [latestResult]);

  async function copyToClipboard(value: string, field: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1400);
  }

  const liveDecisions = useMemo(() => {
    if (!latestResult) return decisionItems as readonly string[];
    const gain = latestResult.estimatedAnnualGain.toLocaleString();
    return [
      `${latestResult.recommended} selected with ${latestResult.confidence}% confidence`,
      `APY lift ${latestResult.current_apy}% → ${latestResult.optimized_apy}% (+${latestResult.yield_increase_pct}%)`,
      `Projected annual gain +$${gain} on $${latestResult.totalPortfolio.toLocaleString()} portfolio`,
      latestResult.proofRegistryProofId
        ? `ProofRegistry entry #${latestResult.proofRegistryProofId} recorded on 0G Galileo`
        : `Proof anchored to 0G Storage (CID ${latestResult.storageProof?.slice(0, 10) ?? "pending"}…)`,
    ];
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
    const totalPortfolio = latestResult?.totalPortfolio ?? portfolio?.totalUSD ?? 24570.25;
    const currentApy = latestResult?.current_apy ?? 12.38;
    const optimizedApy = latestResult?.optimized_apy ?? 23.84;
    const yieldIncreasePct = latestResult?.yield_increase_pct ?? 23.61;
    const estimatedAnnualGain = latestResult?.estimatedAnnualGain ?? 2356.41;
    const confidence = latestResult?.confidence ?? 96;
    return { totalPortfolio, currentApy, optimizedApy, yieldIncreasePct, estimatedAnnualGain, confidence };
  }, [latestResult, portfolio]);

  return (
    <>
      <section className="animate-fade-in-up p-[10px] md:h-full">
        <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="min-w-0 space-y-[10px]">
            <DashboardHeader />
            <DashboardHero latestResult={latestResult} live={live} />
            <DashboardStatsGrid globalStats={globalStats} />
            <DashboardProofBanner onOpenProof={() => setProofOpen(true)} />
            <DashboardKPIRow live={live} />
            <DashboardMiddleCards
              live={live}
              liveDecisions={liveDecisions}
              liveOpportunities={liveOpportunities}
            />
            <DashboardProofRow
              latestResult={latestResult}
              copiedField={copiedField}
              copyToClipboard={copyToClipboard}
            />
            <DashboardEcosystem />
          </div>
          <DashboardAgentPanel
            live={live}
            onOpenProof={() => setProofOpen(true)}
          />
        </div>
      </section>

      <ProofModal
        open={proofOpen}
        onOpenChange={setProofOpen}
        cid={latestResult?.storageProof ?? proofDetails.cid}
        txHash={latestResult?.txHash ?? proofDetails.txHash}
      />
    </>
  );
}
