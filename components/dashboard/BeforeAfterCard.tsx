"use client";

import { ArrowRight } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";

export default function BeforeAfterCard() {
  const { optimizations } = useYieldOptimizer();
  const { portfolio } = usePortfolio();
  const latest = optimizations[0];
  const beforeApy = portfolio?.currentAPY ?? 12.38;
  const afterApy = latest?.optimized_apy ?? 23.84;
  const yieldIncreasePct = latest?.yield_increase_pct ?? 23.61;
  const annualGain = latest?.estimatedAnnualGain ?? latest?.yield_increase ?? 2356.41;

  return (
    <article
      data-testid="before-after-card"
      className="surface-panel rounded-[28px] p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--text-muted)]">
            Before vs After Optimization
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            Yield upgrade with lower risk skew
          </h2>
        </div>
        <span className="rounded-full border border-[rgba(97,242,159,0.28)] bg-[rgba(97,242,159,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-green)]">
          +{yieldIncreasePct}% Yield Increase
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="surface-inset rounded-[24px] p-5">
          <p className="text-sm text-[var(--text-muted)]">Before</p>
          <div className="mt-2 text-4xl font-semibold text-[var(--accent-danger)]">
            <AnimatedCounter value={beforeApy} suffix="%" decimals={2} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Current APY</p>
        </div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[rgba(0,201,177,0.09)] text-[var(--accent-teal)]">
          <ArrowRight className="h-5 w-5" />
        </div>

        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(0,201,177,0.16),rgba(97,242,159,0.08))] p-5">
          <p className="text-sm text-[var(--text-muted)]">After</p>
          <div className="mt-2 text-4xl font-semibold text-[var(--accent-teal)]">
            <AnimatedCounter value={afterApy} suffix="%" decimals={2} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-soft)]">AI Projected APY</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="surface-inset rounded-[22px] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Improve
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--accent-green)]">
            <AnimatedCounter value={yieldIncreasePct} prefix="+" suffix="%" decimals={2} />
          </p>
        </div>
        <div className="surface-inset rounded-[22px] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            More per year
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            <AnimatedCounter value={annualGain} prefix="$" decimals={2} />
          </p>
        </div>
        <div className="surface-inset rounded-[22px] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Risk posture
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--accent-teal)]">
            Lower
          </p>
        </div>
      </div>
    </article>
  );
}
