"use client";

import Link from "next/link";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownWideNarrow,
  Database,
  Filter,
  Sparkles,
  Wallet2,
} from "lucide-react";
import AgentCard from "./AgentCard";

const ProofModal = lazy(() => import("@/components/modals/ProofModal"));

interface Strategy {
  tokenId: number;
  encryptedUri: string;
  contentHash: string;
  apy: number;
  currentApy?: number | null;
  yieldIncreasePct?: number | null;
  estimatedAnnualGain?: number | null;
  confidence?: number | null;
  recommended?: string | null;
  reasoning?: string | null;
  storageProof?: string | null;
  txHash?: string | null;
  proofUrl?: string | null;
  proofRegistryProofId?: string | null;
  proofRegistryTxHash?: string | null;
  proofRegistryExplorerUrl?: string | null;
  timestamp: string;
  creator: string;
  verified: boolean;
  owner: string;
  sourceLabel?: string | null;
}

type FilterMode = "all" | "latest" | "verified" | "unique";
type SortMode = "latest" | "apy" | "gain";

function getRouteSignature(strategy: Strategy) {
  return [
    strategy.recommended ?? "unknown",
    strategy.apy.toFixed(2),
    strategy.owner.toLowerCase(),
  ].join("|");
}

function sortStrategies(strategies: Strategy[], sortMode: SortMode) {
  const copy = [...strategies];
  copy.sort((left, right) => {
    if (sortMode === "apy") {
      return right.apy - left.apy;
    }
    if (sortMode === "gain") {
      return (right.estimatedAnnualGain ?? 0) - (left.estimatedAnnualGain ?? 0);
    }
    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
  return copy;
}

export default function AgentGallery() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    async function loadStrategies() {
      try {
        setLoading(true);
        const response = await fetch("/api/agent/list", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load strategies");
        }
        const data = await response.json();
        if (data.success) {
          setStrategies(Array.isArray(data.strategies) ? data.strategies : []);
          setEmptyMessage(data.message ?? null);
          setInfoMessage(data.source === "proof_fallback" ? data.message ?? null : null);
          setSource(data.source ?? null);
        } else {
          setError(data.error || "Failed to load strategies");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void loadStrategies();
  }, []);

  const sortedStrategies = useMemo(
    () => sortStrategies(strategies, sortMode),
    [sortMode, strategies],
  );

  const filteredStrategies = useMemo(() => {
    if (filterMode === "all") {
      return sortedStrategies;
    }

    if (filterMode === "latest") {
      return sortedStrategies.slice(0, 3);
    }

    if (filterMode === "verified") {
      return sortedStrategies.filter((strategy) => strategy.verified);
    }

    const seen = new Set<string>();
    return sortedStrategies.filter((strategy) => {
      const signature = getRouteSignature(strategy);
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
  }, [filterMode, sortedStrategies]);

  const stats = useMemo(() => {
    const latest = sortedStrategies[0] ?? null;
    const uniqueRoutes = new Set(sortedStrategies.map(getRouteSignature)).size;
    const verifiedCount = sortedStrategies.filter((strategy) => strategy.verified).length;
    const topApy = sortedStrategies[0]?.apy ?? 0;

    return {
      latest,
      total: sortedStrategies.length,
      uniqueRoutes,
      verifiedCount,
      topApy,
    };
  }, [sortedStrategies]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-[28px] border border-[#142028] bg-[radial-gradient(circle_at_top,rgba(34,221,208,0.12),transparent_38%),#070d12]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#22ddd0] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">Loading live agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-[28px] border border-[#1a222a] bg-[#070d12]">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Agent gallery could not load the active proof source.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[12px] text-[#d6dee6] transition hover:border-[rgba(34,221,208,0.28)] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
            <Link
              href="/agent"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-4 py-2 text-[12px] text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.32)] hover:text-white"
            >
              Open boost flow
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-[28px] border border-[#1a222a] bg-[#070d12]">
        <div className="max-w-md text-center">
          <p className="text-sm text-[var(--text-muted)]">
            {emptyMessage ?? "No agents minted yet"}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {emptyMessage
              ? "Run a real optimization first so this wallet has proof-backed agent data."
              : "Complete an optimization to mint your first agent"}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[12px] text-[#d6dee6] transition hover:border-[rgba(34,221,208,0.28)] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
            <Link
              href="/agent"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-4 py-2 text-[12px] text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.32)] hover:text-white"
            >
              Run optimization first
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-[28px] border border-[#16222c] bg-[radial-gradient(circle_at_top_left,rgba(34,221,208,0.14),transparent_32%),linear-gradient(180deg,#091017_0%,#050a10_100%)] p-5 shadow-[0_28px_60px_rgba(0,0,0,0.24)] sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#8be9e0]">
                <Database className="h-3.5 w-3.5" />
                Live agent inventory
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-white sm:text-[34px]">
                Real strategies, real proof history, better separation per run.
              </h2>
              <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#9fb0be]">
                Gallery ini sekarang membaca data asli dari contract NFT atau proof optimization wallet yang sedang connect, lalu memisahkan route berdasarkan waktu, gain, dan status verifikasi.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border border-[#182733] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8398a7]">Visible Agents</div>
                <div className="mt-2 text-[28px] font-semibold text-white">{filteredStrategies.length}</div>
              </div>
              <div className="rounded-[20px] border border-[#182733] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8398a7]">Unique Routes</div>
                <div className="mt-2 text-[28px] font-semibold text-white">{stats.uniqueRoutes}</div>
              </div>
              <div className="rounded-[20px] border border-[#182733] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8398a7]">Verified</div>
                <div className="mt-2 text-[28px] font-semibold text-white">{stats.verifiedCount}</div>
              </div>
              <div className="rounded-[20px] border border-[#182733] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8398a7]">Top APY</div>
                <div className="mt-2 text-[28px] font-semibold text-[#68ff7a]">{stats.topApy.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {source === "proof_fallback" && infoMessage ? (
            <div className="rounded-[18px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.06)] px-4 py-3 text-[13px] text-[#d6eef0]">
              {infoMessage}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[22px] border border-[#16232d] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#88a0af]">
                <Wallet2 className="h-3.5 w-3.5" />
                Latest agent snapshot
              </div>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[23px] font-semibold text-white">
                    {stats.latest?.recommended ?? `Strategy #${stats.latest?.tokenId ?? 0}`}
                  </div>
                  <div className="mt-2 text-[14px] text-[#a4b5c2]">
                    {stats.latest
                      ? `Last proof synced ${new Date(stats.latest.timestamp).toLocaleString()}`
                      : "No latest strategy found"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[13px]">
                  <div className="rounded-[16px] border border-[#1a2b36] bg-[#081017] px-3 py-2 text-white">
                    APY {stats.latest?.apy.toFixed(2) ?? "0.00"}%
                  </div>
                  <div className="rounded-[16px] border border-[#1a2b36] bg-[#081017] px-3 py-2 text-white">
                    Gain ${stats.latest?.estimatedAnnualGain?.toLocaleString() ?? 0}
                  </div>
                  <div className="rounded-[16px] border border-[#1a2b36] bg-[#081017] px-3 py-2 text-white">
                    Proof #{stats.latest?.proofRegistryProofId ?? "local"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#16232d] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#88a0af]">
                <Sparkles className="h-3.5 w-3.5" />
                Active controls
              </div>
              <div className="mt-3 grid gap-2 text-[13px] text-[#d4dee6]">
                <div>Filter: <span className="text-white">{filterMode}</span></div>
                <div>Sort: <span className="text-white">{sortMode}</span></div>
                <div>Total records: <span className="text-white">{stats.total}</span></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[22px] border border-[#16232d] bg-[rgba(255,255,255,0.02)] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#88a0af]">
                <Filter className="h-3.5 w-3.5" />
                Filter agents
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {([
                  { key: "all", label: "All Records" },
                  { key: "latest", label: "Latest 3" },
                  { key: "verified", label: "Verified Only" },
                  { key: "unique", label: "Unique Routes" },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilterMode(item.key)}
                    className={`rounded-full border px-3 py-2 text-[12px] transition ${
                      filterMode === item.key
                        ? "border-[#2ad7c8] bg-[rgba(34,221,208,0.12)] text-white"
                        : "border-[#24323d] bg-[#091117] text-[#9cb0be] hover:border-[#2ad7c8]/40 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-[220px]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#88a0af]">
                <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                Sort strategy cards
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  { key: "latest", label: "Latest" },
                  { key: "apy", label: "Top APY" },
                  { key: "gain", label: "Top Gain" },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSortMode(item.key)}
                    className={`rounded-[14px] border px-3 py-2 text-[12px] transition ${
                      sortMode === item.key
                        ? "border-[#2ad7c8] bg-[rgba(34,221,208,0.12)] text-white"
                        : "border-[#24323d] bg-[#091117] text-[#9cb0be] hover:border-[#2ad7c8]/40 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredStrategies.map((strategy, index) => (
              <AgentCard
                key={`${strategy.tokenId}-${strategy.timestamp}`}
                tokenId={strategy.tokenId}
                apy={strategy.apy}
                currentApy={strategy.currentApy}
                yieldIncreasePct={strategy.yieldIncreasePct}
                estimatedAnnualGain={strategy.estimatedAnnualGain}
                confidence={strategy.confidence}
                recommended={strategy.recommended}
                proofRegistryProofId={strategy.proofRegistryProofId}
                sourceLabel={strategy.sourceLabel}
                latest={index === 0 && sortMode === "latest"}
                creator={strategy.creator}
                verified={strategy.verified}
                timestamp={strategy.timestamp}
                owner={strategy.owner}
                onClick={() => setSelectedStrategy(strategy)}
              />
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <ProofModal
          open={Boolean(selectedStrategy)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStrategy(null);
            }
          }}
          cid={selectedStrategy?.storageProof ?? selectedStrategy?.encryptedUri}
          txHash={selectedStrategy?.txHash ?? selectedStrategy?.contentHash}
          explorerUrl={selectedStrategy?.proofUrl ?? undefined}
          timestamp={selectedStrategy?.timestamp}
          walletAddress={selectedStrategy?.owner}
          proofRegistryTxHash={selectedStrategy?.proofRegistryTxHash ?? undefined}
          proofRegistryProofId={selectedStrategy?.proofRegistryProofId ?? undefined}
          proofRegistryExplorerUrl={selectedStrategy?.proofRegistryExplorerUrl ?? undefined}
          decision={
            selectedStrategy
              ? {
                  current_apy: selectedStrategy.currentApy ?? selectedStrategy.apy,
                  optimized_apy: selectedStrategy.apy,
                  recommended:
                    selectedStrategy.recommended ??
                    `Strategy #${selectedStrategy.tokenId}`,
                  reasoning: selectedStrategy.reasoning ?? undefined,
                }
              : undefined
          }
        />
      </Suspense>
    </>
  );
}
