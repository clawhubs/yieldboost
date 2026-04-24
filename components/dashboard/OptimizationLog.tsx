"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import PulsingDot from "@/components/ui/PulsingDot";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import type { FeedState, OptimizationFeedItem } from "@/lib/optimizations";

const tabs = [
  { key: "all", label: "ALL", testId: "tab-all" },
  { key: "optimizing", label: "OPTIMIZING", testId: "tab-optimizing" },
  { key: "complete", label: "COMPLETE", testId: "tab-complete" },
  { key: "analyzing", label: "ANALYZING", testId: "tab-analyzing" },
] as const;

function ReasoningReveal({
  active,
  text,
}: {
  active: boolean;
  text: string;
}) {
  const [visibleText, setVisibleText] = useState(active ? text : "");

  useEffect(() => {
    if (!active) {
      setVisibleText("");
      return;
    }

    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 6;
      setVisibleText(text.slice(0, frame));
      if (frame >= text.length) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [active, text]);

  return (
    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
      {active ? visibleText : ""}
    </p>
  );
}

function statusTone(status: FeedState) {
  if (status === "complete") return "text-[var(--accent-green)]";
  if (status === "optimizing") return "text-[var(--accent-teal)]";
  return "text-[var(--accent-amber)]";
}

function filterItems(
  tab: string,
  items: OptimizationFeedItem[],
  isOptimizing: boolean,
) {
  if (tab === "all") return items;
  if (tab === "complete") return items.filter((item) => item.status === "complete");

  if (tab === "analyzing") {
    return isOptimizing
      ? [
          {
            id: "live-analyzing",
            protocol: "Wallet scan in progress",
            beforeApy: 0,
            afterApy: 0,
            confidence: 0,
            status: "analyzing",
            proofBadge: "Compute simulation live",
            reasoning:
              "YieldBoost is currently scanning wallet balances, APY drift, and slippage boundaries.",
            timestamp: "now",
          } satisfies OptimizationFeedItem,
        ]
      : [];
  }

  if (tab === "optimizing") {
    return isOptimizing
      ? [
          {
            id: "live-optimizing",
            protocol: "Route simulation in progress",
            beforeApy: 0,
            afterApy: 0,
            confidence: 0,
            status: "optimizing",
            proofBadge: "Routing candidate",
            reasoning:
              "YieldBoost is simulating low-risk routes and preparing the best proof-ready destination.",
            timestamp: "now",
          } satisfies OptimizationFeedItem,
        ]
      : [];
  }

  return items;
}

function mapOptimizationToFeedItem(
  item: {
    current_apy: number;
    optimized_apy: number;
    confidence: number;
    recommended: string;
    reasoning?: string;
    storageProof?: string;
    txHash?: string;
    timestamp: string;
  },
  index: number,
): OptimizationFeedItem {
  return {
    id: `live-${item.timestamp}-${index}`,
    protocol: item.recommended,
    beforeApy: item.current_apy,
    afterApy: item.optimized_apy,
    confidence: item.confidence,
    status: (item.txHash ? "complete" : "optimizing") as FeedState,
    proofBadge: item.storageProof
      ? `0G ${item.storageProof.slice(0, 8)}...`
      : "Waiting storage sync",
    reasoning:
      item.reasoning ??
      "YieldBoost produced this recommendation and is waiting for the reasoning stream.",
    timestamp: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function FeedCard({
  expanded,
  item,
  onToggle,
}: {
  expanded: boolean;
  item: OptimizationFeedItem;
  onToggle: () => void;
}) {
  return (
    <article
      data-testid="optimization-card"
      className="yb-soft-card rounded-[22px] p-4 transition hover:border-[rgba(0,201,177,0.28)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{item.protocol}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{item.timestamp}</p>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${statusTone(item.status)}`}>
          {item.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Before APY</p>
          <p className="mt-2 text-lg font-semibold text-white">{item.beforeApy}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">After APY</p>
          <p className="mt-2 text-lg font-semibold text-[var(--accent-teal)]">{item.afterApy}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Confidence</p>
          <p className="mt-2 text-lg font-semibold text-white">{item.confidence}%</p>
        </div>
        <div className="glass-accent flex items-center gap-2 rounded-full px-3 py-2 text-xs text-[var(--accent-teal)]">
          <ShieldCheck className="h-4 w-4" />
          {item.proofBadge}
        </div>
      </div>

      <button
        type="button"
        data-testid={`optimization-expand-${item.id}`}
        onClick={onToggle}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-white"
      >
        Reasoning
        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      <ReasoningReveal active={expanded} text={item.reasoning} />
    </article>
  );
}

export default function OptimizationLog() {
  const { optimizations, isOptimizing } = useYieldOptimizer();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [expandedId, setExpandedId] = useState<string>("");
  const deferredTab = useDeferredValue(activeTab);
  const feedItems = useMemo(
    () => optimizations.map((item, index) => mapOptimizationToFeedItem(item, index)),
    [optimizations],
  );

  const items = useMemo(
    () => filterItems(deferredTab, feedItems, isOptimizing),
    [deferredTab, feedItems, isOptimizing],
  );

  return (
    <section className="surface-panel rounded-[28px] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
              AI Decision Log
            </h2>
            <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-teal)]">
              {items.length}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-[var(--accent-green)]">
              <PulsingDot />
              Live
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Track optimization state, before-and-after APY, and the reasoning stream behind each move.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-testid={tab.testId}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] transition ${
                activeTab === tab.key
                  ? "glass-accent border-[rgba(0,201,177,0.28)] text-[var(--accent-teal)]"
                  : "glass-inset border-[rgba(255,255,255,0.07)] text-[var(--text-muted)] hover:border-[rgba(255,255,255,0.14)] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {optimizations.length === 0 && !isOptimizing ? (
          <p className="text-sm text-[var(--text-muted)] animate-pulse">
            Waiting for first optimization...
          </p>
        ) : null}
        {items.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId((current) => (current === item.id ? "" : item.id))}
          />
        ))}
      </div>
    </section>
  );
}
