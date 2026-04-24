"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bot, ShieldCheck, Sparkles } from "lucide-react";
import AgentPanel from "@/components/agent/AgentPanel";
import OptimizationProgress from "@/components/agent/OptimizationProgress";
import YieldChart from "@/components/agent/YieldChart";
import ZeroGStats from "@/components/dashboard/ZeroGStats";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import { buildOptimizationSnapshot, createYieldSeries } from "@/lib/optimizations";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function AgentView() {
  const { latestResult, progress } = useYieldOptimizer();
  const { portfolio } = usePortfolio();
  const baseSnapshot = useMemo(
    () => buildOptimizationSnapshot(
      Object.fromEntries((portfolio?.tokens ?? []).map((token) => [token.symbol, token.valueUSD])),
    ),
    [portfolio],
  );
  const currentApy = latestResult?.current_apy ?? portfolio?.currentAPY ?? baseSnapshot.current_apy;
  const projectedApy = latestResult?.optimized_apy ?? baseSnapshot.optimized_apy;
  const yieldSeries = useMemo(
    () => createYieldSeries(currentApy, projectedApy),
    [currentApy, projectedApy],
  );

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-[10px] p-[10px]"
    >
      <motion.header
        variants={item}
        className="yb-card flex flex-col gap-3 rounded-[18px] px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
      >
        <div className="max-w-3xl">
          <div
            className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#21d8c8]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Agent
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[42px]">
            Run autonomous yield optimization with
            <span className="text-[#22ddd0]"> proof-backed confidence.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
            Simulate, score, and execute the best low-risk path while 0G Compute and 0G Storage handle verifiable execution output.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
          <div className="glass-accent rounded-[14px] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="glass-inset flex h-10 w-10 items-center justify-center rounded-full text-[#2fe06d]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#8fb19d]">Projected APY</p>
                <p className="mt-1 text-[23px] font-semibold text-white">{projectedApy}%</p>
              </div>
            </div>
          </div>
          <div className="glass-inset rounded-[14px] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="glass-inset flex h-10 w-10 items-center justify-center rounded-full text-[#22ddd0]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#a7b3be]">Execution Mode</p>
                <p className="mt-1 text-[14px] font-medium text-white">Low-risk autonomous</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1fr)_388px]">
        <motion.div variants={item} className="space-y-[10px]">
          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#9faab6]">
                  Yield Trajectory
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-[30px] font-semibold text-white">
                  From {currentApy}% to {projectedApy}%
                </h2>
                <p className="mt-2 text-[13px] text-[#a7b3be]">
                  Live simulation of the route selected by the 0G Network optimizer.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-accent rounded-[10px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
                  30 points
                </span>
                <span className="glass-inset rounded-[10px] px-3 py-1 text-[11px] text-[#d8e1e8]">
                  0G Network verified
                </span>
              </div>
            </div>
            <div className="glass-inset mt-5 rounded-[16px] border-[rgba(0,201,177,0.12)] bg-[radial-gradient(circle_at_top_right,rgba(34,221,208,0.10),transparent_40%)] px-4 py-4">
              <YieldChart data={yieldSeries} />
            </div>
          </section>

          <OptimizationProgress
            progress={progress}
            executionSeconds={latestResult?.executionSeconds ?? baseSnapshot.executionSeconds}
          />

          <ZeroGStats />
        </motion.div>

        <motion.div variants={item} className="min-w-0">
          <AgentPanel />
        </motion.div>
      </div>
    </motion.section>
  );
}
