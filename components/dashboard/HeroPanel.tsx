import { ArrowUpRight, Bell, DatabaseZap, ShieldCheck, Sparkles, Zap } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { decisionBullets, topLineStats, topOpportunities, transactionProofs, yieldSeries } from "@/lib/mock-data";
import type { OptimizationResult } from "@/lib/optimizations";
import OptimizationProgress from "@/components/agent/OptimizationProgress";
import YieldChart from "@/components/agent/YieldChart";

interface HeroPanelProps {
  snapshot: OptimizationResult;
  onOpenProof: () => void;
}

export default function HeroPanel({
  snapshot,
  onOpenProof,
}: HeroPanelProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <div className="surface-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-1 text-xs text-[var(--text-soft)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
              GM, Builder! Your AI agent is working 24/7.
            </div>
            <h1 className="mt-5 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight md:text-6xl">
              Stop letting your crypto sit idle.
              <span className="text-gradient"> Let AI make it earn.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg">
              Autonomous. On-chain. Profitable. Optimized with low-risk heuristics and proof anchored to 0G.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              data-testid="risk-profile"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Moderate Risk
            </button>
            <button
              type="button"
              data-testid="alerts-button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-[var(--text-soft)]"
            >
              <Bell className="h-4 w-4" />
              Alerts
            </button>
            <a
              href="/agent"
              data-testid="boost-yield-cta"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#00c9b1,#13d4ff)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              <Zap className="h-4 w-4" />
              Boost My Yield Now
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Estimated Yield Increase
              </p>
              <div className="mt-3 text-4xl font-semibold text-[var(--accent-green)]">
                <AnimatedCounter value={snapshot.yield_increase_pct} suffix="%" decimals={2} />
              </div>
              <p className="mt-2 text-sm text-[var(--accent-green)]">
                +${snapshot.estimatedAnnualGain.toLocaleString()} / year
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(0,201,177,0.14),rgba(9,20,29,0.55))] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Projected APY
              </p>
              <div className="mt-3 text-4xl font-semibold text-white">
                <AnimatedCounter value={snapshot.optimized_apy} suffix="%" decimals={2} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Current APY: {snapshot.current_apy}%
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(0,201,177,0.28),transparent_34%),linear-gradient(180deg,rgba(11,19,27,0.82),rgba(6,11,17,0.96))] p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Projected APY after optimization</p>
                <p className="mt-1 text-3xl font-semibold text-white">{snapshot.optimized_apy}%</p>
              </div>
              <p className="text-sm text-[var(--text-soft)]">{snapshot.current_apy}% today</p>
            </div>
            <div className="mt-4">
              <YieldChart data={yieldSeries} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-5">
          {topLineStats.map((stat) => (
            <article
              key={stat.label}
              className="surface-inset rounded-[20px] p-4"
            >
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">{stat.label}</p>
              <p className="mt-2 text-xs text-[var(--accent-green)]">{stat.sublabel}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(0,201,177,0.12),rgba(6,13,20,0.72))] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-[var(--border-strong)] bg-[rgba(0,201,177,0.08)] p-3 text-[var(--accent-teal)]">
                  <DatabaseZap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">0G Storage Status</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Your portfolio data is securely synced to 0G Storage
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="open-proof-secondary"
                onClick={onOpenProof}
                className="text-sm font-semibold text-[var(--accent-teal)]"
              >
                Inspect
              </button>
            </div>

            <div className="mt-4 rounded-full bg-white/8 p-1">
              <div className="h-3 rounded-full bg-[linear-gradient(90deg,#00c9b1,#63d8ff)]" style={{ width: "98.4%" }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-[var(--text-soft)]">
              <span>Synchronizing...</span>
              <span>98.4%</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-5">
            <div className="flex items-center gap-2 text-[var(--accent-green)]">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">Secured by 0G</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Decentralized storage receipt, explorer-ready proof, and verifiable execution output for every AI decision.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">AI Decision Log</p>
              <span className="text-xs text-[var(--accent-teal)]">Why?</span>
            </div>
            <div className="mt-4 space-y-3">
              {decisionBullets.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-[var(--text-soft)]">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent-green)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
              <span>Model: YieldBoost v2.1</span>
              <span>Confidence: {snapshot.confidence}%</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">Top Opportunities</p>
                <a
                  href="/opportunities"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-teal)]"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-4 space-y-4">
                {topOpportunities.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">Est. APY {item.apy}</p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--accent-green)]">↑ {item.change}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="font-semibold text-white">Transaction Proof (latest)</p>
              <div className="mt-4 space-y-4">
                {transactionProofs.map((item) => (
                  <div key={item.hash} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.hash}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {item.network} · {item.age}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-teal)]">
                      0G Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <OptimizationProgress progress="executing" executionSeconds={snapshot.executionSeconds} />
        </div>
      </div>

      <div className="surface-panel rounded-[32px] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-1 text-xs text-[var(--accent-teal)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              AI Agent
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
              Powered by 0G Compute Network
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              The agent keeps simulating low-risk paths, checking idle assets, and preparing the next executable strategy.
            </p>
          </div>
        </div>

        <div className="chat-grid mt-6 rounded-[28px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
          <div className="ml-auto max-w-[88%] rounded-[22px] border border-white/10 bg-[rgba(10,22,32,0.9)] px-4 py-3 text-sm leading-7 text-white">
            Optimize my portfolio for the best yield with low risk.
          </div>

          <div className="mt-4 max-w-[92%] rounded-[22px] border border-[var(--border-strong)] bg-[rgba(0,201,177,0.08)] px-4 py-4 text-sm text-[var(--text-soft)]">
            <p className="font-semibold text-white">Analyzing your portfolio...</p>
            <div className="mt-3 space-y-3">
              {[
                "Scanning wallet & balances",
                "Detecting idle assets",
                "Finding best yield opportunities",
                "Simulating strategies",
                "Checking risk & slippage",
              ].map((task) => (
                <div key={task} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-green)]" />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 max-w-[92%] rounded-[24px] border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(0,201,177,0.16),rgba(8,18,26,0.62))] p-5">
            <p className="text-sm font-semibold text-white">Optimization Complete!</p>
            <p className="mt-3 text-6xl font-semibold text-[var(--accent-green)]">
              {snapshot.optimized_apy}%
            </p>
            <p className="mt-3 text-sm text-[var(--text-soft)]">Your new APY is now live and earning more.</p>
            <button
              type="button"
              data-testid="agent-card-proof"
              onClick={onOpenProof}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-[var(--accent-teal)]"
            >
              View on Explorer
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
