"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, CircleDashed, ShieldCheck, Wallet2, Zap } from "lucide-react";
import { useEffect } from "react";
import type { OptimizationState } from "@/lib/optimizations";

interface OptimizationLoadingModalProps {
  open: boolean;
  progress: OptimizationState;
  streamingText: string;
  walletLabel: string;
  portfolioValue: string;
}

const progressSteps = [
  { key: "analyzing", label: "Analyzing wallet", percent: 28 },
  { key: "optimizing", label: "Computing best route", percent: 62 },
  { key: "executing", label: "Writing proof to 0G", percent: 88 },
  { key: "done", label: "Optimization complete", percent: 100 },
] as const;

const progressCopy: Record<OptimizationState, { title: string; message: string; helper: string }> = {
  analyzing: {
    title: "Reading your live 0G wallet",
    message: "YieldBoost is checking supported balances, current APY, and idle capital before building the route.",
    helper: "This usually takes only a few seconds.",
  },
  optimizing: {
    title: "Simulating the best yield route",
    message: "The optimizer is comparing protocols, APY lift, and risk so the result stays real instead of demo data.",
    helper: "You can wait here while the agent streams its recommendation.",
  },
  executing: {
    title: "Anchoring the result on 0G",
    message: "The optimization output is being stored to 0G Storage and linked to the proof flow.",
    helper: "Please keep this tab open until the proof write finishes.",
  },
  done: {
    title: "Optimization finished",
    message: "The fresh optimization result is ready and the UI is syncing the latest proof-backed snapshot.",
    helper: "The popup will close automatically.",
  },
};

function getStreamingFallback(progress: OptimizationState) {
  switch (progress) {
    case "analyzing":
      return "Collecting wallet balances and preparing the optimization request...";
    case "optimizing":
      return "Comparing candidate strategies and selecting the strongest low-risk route...";
    case "executing":
      return "Submitting the finalized strategy result to the live 0G proof pipeline...";
    case "done":
      return "Fresh proof recorded. Updating the dashboard with the latest optimization result...";
  }
}

export default function OptimizationLoadingModal({
  open,
  progress,
  streamingText,
  walletLabel,
  portfolioValue,
}: OptimizationLoadingModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const activeIndex = progressSteps.findIndex((step) => step.key === progress);
  const activePercent =
    progressSteps.find((step) => step.key === progress)?.percent ??
    (progress === "done" ? 100 : 28);
  const copy = progressCopy[progress];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-testid="optimization-loading-modal"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            data-testid="optimization-loading-dialog"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            className="surface-panel teal-ring relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] border border-[rgba(42,215,200,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(34,221,208,0.18),transparent_38%),linear-gradient(180deg,rgba(8,16,22,0.98)_0%,rgba(4,9,14,0.98)_100%)] px-4 pb-4 pt-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-h-[calc(100vh-2rem)] sm:rounded-[28px] sm:px-6 sm:pb-6 sm:pt-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(42,215,200,0.2)] bg-[rgba(34,221,208,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#7feee4]">
                  {progress === "done" ? (
                    <CheckCheck className="h-3.5 w-3.5" />
                  ) : (
                    <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                  )}
                  1-click optimization
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-white">
                  {copy.title}
                </h2>
                <p className="mt-2 max-w-lg text-[14px] leading-6 text-[#d2dce4]">
                  {copy.message}
                </p>
                <p className="mt-2 text-[12px] text-[#7fa0ae]">{copy.helper}</p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[rgba(42,215,200,0.2)] bg-[rgba(8,17,23,0.82)] text-[#22ddd0]">
                {progress === "done" ? (
                  <ShieldCheck className="h-7 w-7" />
                ) : (
                  <CircleDashed className="h-7 w-7 animate-spin" />
                )}
              </div>
            </div>

            <div
              data-testid="optimization-loading-scroll"
              className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#8fa3b0]">
                    <Wallet2 className="h-3.5 w-3.5" />
                    Active wallet
                  </div>
                  <div className="mt-2 text-[16px] font-semibold text-white">{walletLabel}</div>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#8fa3b0]">
                    <Zap className="h-3.5 w-3.5" />
                    Portfolio scanned
                  </div>
                  <div className="mt-2 text-[16px] font-semibold text-white">{portfolioValue}</div>
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3 text-[13px] text-[#d7e1e9]">
                  <span>{progressSteps[Math.max(activeIndex, 0)]?.label ?? "Preparing optimization"}</span>
                  <span>{activePercent}%</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-[#091117] p-[2px]">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#22ddd0_0%,#1fe17b_100%)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${activePercent}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {progressSteps.map((step, index) => {
                    const done = progress === "done" || index < activeIndex;
                    const active = progress !== "done" && index === activeIndex;

                    return (
                      <div
                        key={step.key}
                        className={`rounded-[16px] border px-3 py-3 text-center transition ${
                          done
                            ? "border-[#20554d] bg-[rgba(34,221,208,0.08)] text-[#79eedc]"
                            : active
                              ? "border-[#2ad7c8] bg-[rgba(34,221,208,0.12)] text-white"
                              : "border-white/8 bg-[rgba(255,255,255,0.02)] text-[#89a0ad]"
                        }`}
                      >
                        <div className="flex justify-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold ${
                              done
                                ? "border-[#2ad7c8] bg-[#081717] text-[#25d6c6]"
                                : active
                                  ? "border-[#2ad7c8] bg-[#0d1b1d] text-[#7feee4]"
                                  : "border-[#28343e] bg-[#0a1117] text-[#b7c4ce]"
                            }`}
                          >
                            {done ? <CheckCheck className="h-4 w-4" /> : index + 1}
                          </div>
                        </div>
                        <div className="mt-2 text-[11px] leading-4">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa3b0]">
                  Live optimizer feed
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(42,215,200,0.2)] bg-[rgba(8,17,23,0.85)] text-[#22ddd0]">
                    {progress === "done" ? (
                      <CheckCheck className="h-4 w-4" />
                    ) : (
                      <CircleDashed className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <p className="min-h-[48px] text-[14px] leading-6 text-[#edf3f8]">
                    {streamingText || getStreamingFallback(progress)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
