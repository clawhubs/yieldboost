"use client";

import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";

export default function KPIGrid() {
  const { optimizations } = useYieldOptimizer();
  const { portfolio } = usePortfolio();
  const latest = optimizations[0];
  const kpiCards = [
    {
      label: "ESTIMATED YIELD INCREASE",
      value: latest?.yield_increase_pct ?? 0,
      prefix: "+",
      suffix: "%",
      accent: "text-[var(--accent-green)]",
      testId: "kpi-yield",
    },
    {
      label: "PROJECTED APY",
      value: latest?.optimized_apy ?? portfolio?.currentAPY ?? 0,
      suffix: "%",
      accent: "text-white",
      testId: "kpi-apy",
    },
    {
      label: "TOTAL PORTFOLIO",
      value: portfolio?.totalUSD ?? 0,
      prefix: "$",
      decimals: 2,
      accent: "text-white",
      testId: "kpi-portfolio",
    },
    {
      label: "LIVE STRATEGIES",
      value: optimizations.length,
      accent: "text-white",
      testId: "kpi-strategies",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map((item) => (
        <article
          key={item.label}
          data-testid={item.testId}
          className="surface-panel rounded-[24px] p-5"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
            {item.label}
          </p>
          <div className={`mt-4 text-3xl font-semibold ${item.accent}`}>
            <AnimatedCounter
              value={item.value}
              prefix={item.prefix}
              suffix={item.suffix}
              decimals={item.decimals}
            />
          </div>
          <p className="mt-3 text-sm text-[var(--text-soft)]">
            Optimized live across AI-assisted DeFi positions.
          </p>
        </article>
      ))}
    </section>
  );
}
