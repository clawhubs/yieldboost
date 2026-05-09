"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, CircleDashed, ExternalLink, Minus, ShieldCheck, Wallet2, X, Zap } from "lucide-react";
import { useEffect } from "react";
import type { OptimizationState } from "@/lib/optimizations";

interface OptimizationLoadingModalProps {
  open: boolean;
  progress: OptimizationState;
  streamingText: string;
  walletLabel: string;
  portfolioValue: string;
  walletActionRequired?: boolean;
  walletActionPending?: boolean;
  walletActionError?: string | null;
  integrityLayers?: {
    sovereignMemory?: boolean;
    zkReasoning?: boolean;
    governance?: boolean;
    neuralHandshake?: boolean;
    zkCompliance?: boolean;
  };
  onConfirmWalletAction?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onViewProof?: () => void;
}

const progressSteps = [
  { key: "analyzing", label: "Analyzing wallet", percent: 28 },
  { key: "optimizing", label: "Computing best route", percent: 62 },
  { key: "executing", label: "Preparing proof write", percent: 78 },
  { key: "anchoring", label: "Anchoring on 0G", percent: 94 },
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
    title: "Preparing the 0G proof package",
    message: "The recommendation is ready. YieldBoost is now packaging the wallet snapshot, route, and audit result before writing the proof.",
    helper: "No token swap or wallet spend is executed by this step.",
  },
  anchoring: {
    title: "Anchoring the proof on 0G",
    message: "The proof is being stored to 0G Storage and linked to ProofRegistry so the receipt can show a real CID and tx hash.",
    helper: "This can take around 1-3 minutes because multiple integrity layers are written.",
  },
  done: {
    title: "Primary proof ready",
    message: "The fresh optimization result, 0G Storage CID, and ProofRegistry receipt are ready.",
    helper: "The integrity memory stack continues syncing in the background.",
  },
};

function getStreamingFallback(progress: OptimizationState) {
  switch (progress) {
    case "analyzing":
      return "Collecting wallet balances and preparing the optimization request...";
    case "optimizing":
      return "Comparing candidate strategies and selecting the strongest low-risk route...";
    case "executing":
      return "Preparing the finalized strategy result for the live 0G proof pipeline...";
    case "anchoring":
      return "Writing the optimization proof to 0G Storage and waiting for the receipt handles...";
    case "done":
      return "Fresh proof recorded. Updating the dashboard with the latest optimization result...";
  }
}

function getChecklistStatus(
  progress: OptimizationState,
  startsAt: OptimizationState,
  doneAt: OptimizationState = "done",
) {
  const order: OptimizationState[] = ["analyzing", "optimizing", "executing", "anchoring", "done"];
  const currentIndex = order.indexOf(progress);
  const startIndex = order.indexOf(startsAt);
  const doneIndex = order.indexOf(doneAt);

  if (currentIndex >= doneIndex) return "done";
  if (currentIndex >= startIndex) return "active";
  return "queued";
}

export default function OptimizationLoadingModal({
  open,
  progress,
  streamingText,
  walletLabel,
  portfolioValue,
  walletActionRequired = false,
  walletActionPending = false,
  walletActionError,
  integrityLayers,
  onConfirmWalletAction,
  onClose,
  onMinimize,
  onViewProof,
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
  const copy =
    walletActionRequired && progress === "anchoring"
      ? {
          title: "Confirm wallet step 2/2",
          message:
            "The 0G Storage proof is already saved. YieldBoost now needs the second wallet transaction to finish the ProofRegistry anchor.",
          helper:
            "Approve the next wallet popup to complete the on-chain anchor and clear the pending status.",
        }
      : progressCopy[progress];
  const canClose = progress === "done";
  const getBackgroundStatus = (verified?: boolean) => {
    if (verified) return "done";
    return progress === "done" ? "active" : getChecklistStatus(progress, "anchoring");
  };
  const governanceStatus =
    integrityLayers?.governance && integrityLayers.zkCompliance
      ? "done"
      : progress === "done"
        ? "active"
        : getChecklistStatus(progress, "anchoring");
  const proofChecklist = [
    {
      label: "Hallucination Blacklist",
      detail: "Pre-inference defense",
      status: getChecklistStatus(progress, "analyzing", "optimizing"),
    },
    {
      label: "Integrity Auditor",
      detail: "Deterministic guardrail approval",
      status: getChecklistStatus(progress, "executing", "anchoring"),
    },
    {
      label: "Secure Compute / TEE",
      detail: "0G Compute response evidence",
      status: getChecklistStatus(progress, "optimizing", "executing"),
    },
    {
      label: "Sovereign Memory",
      detail: "Agent memory snapshot",
      status: getBackgroundStatus(integrityLayers?.sovereignMemory),
    },
    {
      label: "0G Storage Proof Layer",
      detail: "Primary proof payload upload",
      status: getChecklistStatus(progress, "anchoring"),
    },
    {
      label: "Zero-Knowledge Proof Layer",
      detail: "Reasoning proof envelope",
      status: getBackgroundStatus(integrityLayers?.zkReasoning),
    },
    {
      label: "ProofRegistry Anchor",
      detail: walletActionRequired
        ? "Waiting for wallet confirmation"
        : "On-chain proof anchor",
      status: walletActionRequired ? "active" : getChecklistStatus(progress, "anchoring"),
    },
    {
      label: "Programmable Governance",
      detail: "Policy gate and ZK seal",
      status: governanceStatus,
    },
    {
      label: "Cross-Agent Neural Handshake",
      detail: "Optimizer-auditor transcript",
      status: getBackgroundStatus(integrityLayers?.neuralHandshake),
    },
  ] as const;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-testid="optimization-loading-modal"
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
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
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
              {onMinimize ? (
                <button
                  type="button"
                  onClick={onMinimize}
                  data-testid="optimization-minimize"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[#b8c6d1] transition hover:border-[#2ad7c8]/50 hover:text-[#7feee4]"
                  aria-label="Minimize optimization progress"
                >
                  <Minus className="h-4 w-4" />
                </button>
              ) : null}
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={!canClose}
                  data-testid="optimization-close"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    canClose
                      ? "border-white/10 bg-black/20 text-[#b8c6d1] hover:border-[#2ad7c8]/50 hover:text-[#7feee4]"
                      : "cursor-not-allowed border-white/5 bg-black/10 text-[#53616c]"
                  }`}
                  aria-label={canClose ? "Close optimization progress" : "Close is available after primary proof is ready"}
                  title={canClose ? "Close" : "Available after primary proof is ready"}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
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
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
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

              <div className="mt-5 rounded-[20px] border border-[rgba(42,215,200,0.14)] bg-[linear-gradient(180deg,rgba(10,26,30,0.58)_0%,rgba(6,13,18,0.72)_100%)] p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-[#7feee4]">
                      Proof checklist
                    </div>
                    <div className="mt-1 text-[13px] text-[#d7e1e9]">
                      Primary proof first, then the integrity memory stack.
                    </div>
                  </div>
                  <div className="text-[11px] text-[#8fa3b0]">
                    {progress === "done" ? "Primary ready; background syncing" : "Running"}
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {proofChecklist.map((item) => {
                    const isDone = item.status === "done";
                    const isActive = item.status === "active";

                    return (
                      <div
                        key={item.label}
                        className={`flex items-start gap-3 rounded-[14px] border px-3 py-3 transition ${
                          isDone
                            ? "border-[#1d6a4a] bg-[rgba(31,225,123,0.08)]"
                            : isActive
                              ? "border-[#2ad7c8] bg-[rgba(34,221,208,0.1)]"
                              : "border-white/8 bg-[rgba(255,255,255,0.025)]"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                            isDone
                              ? "border-[#2fe06d] text-[#2fe06d]"
                              : isActive
                                ? "border-[#2ad7c8] text-[#7feee4]"
                                : "border-[#31404a] text-[#7d909d]"
                          }`}
                        >
                          {isDone ? (
                            <CheckCheck className="h-3.5 w-3.5" />
                          ) : isActive ? (
                            <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[13px] font-semibold ${isDone || isActive ? "text-white" : "text-[#9fb0bd]"}`}>
                            {item.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#8fa3b0]">
                            {isDone ? "Verified" : isActive ? "Syncing..." : item.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {walletActionRequired ? (
                <div className="mt-5 rounded-[20px] border border-[rgba(255,189,89,0.22)] bg-[linear-gradient(180deg,rgba(42,30,10,0.28)_0%,rgba(15,11,6,0.68)_100%)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#f5c56b]">
                    Wallet confirmation
                  </div>
                  <div className="mt-2 text-[14px] leading-6 text-[#e6edf3]">
                    Step 1/2 is complete. Step 2/2 records the ProofRegistry anchor on-chain. This is why the wallet needs one more confirmation.
                  </div>
                  {walletActionError ? (
                    <div className="mt-3 rounded-[14px] border border-[rgba(255,120,120,0.22)] bg-[rgba(120,20,20,0.18)] px-3 py-3 text-[12px] leading-5 text-[#ffb4b4]">
                      {walletActionError}
                    </div>
                  ) : null}
                  {onConfirmWalletAction ? (
                    <button
                      type="button"
                      data-testid="optimization-confirm-wallet-step"
                      disabled={walletActionPending}
                      onClick={onConfirmWalletAction}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] border px-4 py-3 text-[14px] font-semibold transition ${
                        walletActionPending
                          ? "cursor-not-allowed border-white/10 bg-white/[0.04] text-[#7c8a96]"
                          : "border-[#f5c56b]/35 bg-[#f5c56b] text-[#141006] hover:bg-[#ffd88e]"
                      }`}
                    >
                      {walletActionPending ? "Waiting for wallet..." : "Confirm wallet step 2/2"}
                      <Wallet2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}

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

              {progress === "done" && onViewProof ? (
                <button
                  type="button"
                  data-testid="optimization-view-proof"
                  onClick={onViewProof}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#2ad7c8]/35 bg-[#22ddd0] px-4 py-3 text-[14px] font-semibold text-[#031012] shadow-[0_16px_36px_rgba(34,221,208,0.2)] transition hover:bg-[#7feee4]"
                >
                  View proof & mint Agent
                  <ExternalLink className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
