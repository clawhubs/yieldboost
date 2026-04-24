"use client";

import { useActionState } from "react";
import { ArrowUpRight, Check, CheckCheck, CircleDashed, Send, Sparkles } from "lucide-react";
import { getFallbackPortfolioValueMap } from "@/components/providers/AppDataProvider";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useYieldOptimizer } from "@/hooks/useYieldOptimizer";
import type { OptimizationState } from "@/lib/optimizations";

const defaultPrompt = "Optimize my portfolio for best yield with low risk";

interface AgentActionState {
  error: string;
  prompt: string;
}

const stepOrder: OptimizationState[] = [
  "analyzing",
  "optimizing",
  "executing",
  "done",
];

function getStepStatus(progress: OptimizationState, step: OptimizationState) {
  if (progress === "done") {
    return "done";
  }

  const currentIndex = stepOrder.indexOf(progress);
  const stepIndex = stepOrder.indexOf(step);

  if (currentIndex > stepIndex) {
    return "done";
  }

  if (currentIndex === stepIndex) {
    return "active";
  }

  return "idle";
}

export default function AgentPanel() {
  const { portfolio } = usePortfolio();
  const {
    isOptimizing,
    latestResult,
    optimize,
    progress,
    streamingText,
  } = useYieldOptimizer();

  const [state, formAction, pending] = useActionState(
    async (_previousState: AgentActionState, formData: FormData) => {
      const prompt = String(formData.get("prompt") ?? defaultPrompt).trim() || defaultPrompt;
      const livePortfolio = Object.fromEntries(
        (portfolio?.tokens ?? []).map((token) => [token.symbol, token.valueUSD]),
      );
      const portfolioPayload =
        Object.keys(livePortfolio).length > 0
          ? livePortfolio
          : getFallbackPortfolioValueMap();

      try {
        await optimize(portfolioPayload, prompt);
        return { error: "", prompt };
      } catch {
        return {
          error: "Optimization request failed. Please try again.",
          prompt,
        };
      }
    },
    {
      error: "",
      prompt: defaultPrompt,
    },
  );

  const activePrompt = state.prompt || defaultPrompt;
  const assistantSteps = [
    { label: "Scanning wallet & balances", state: "analyzing" as const },
    { label: "Simulating best low-risk route", state: "optimizing" as const },
    { label: "Preparing execution proof", state: "executing" as const },
    { label: "Syncing recommendation to 0G", state: "done" as const },
  ];

  return (
    <section className="yb-card rounded-[18px] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Agent
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-semibold leading-[1.05] text-white">
            Execute low-risk
            <br />
            optimization
          </h2>
        </div>
        <span className="glass-inset rounded-[10px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7e0e8]">
          {progress}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div className="glass-inset ml-auto max-w-[90%] rounded-[14px] px-4 py-4 text-[14px] leading-7 text-[#edf3f8]">
          {activePrompt}
        </div>

        <div className="glass-inset rounded-[14px] px-4 py-4">
          <div className="text-[15px] text-white">Analyzing your portfolio...</div>
          <div className="mt-4 space-y-3">
            {assistantSteps.map((step) => {
              const status = getStepStatus(progress, step.state);

              return (
                <div
                  key={step.label}
                  className="flex items-center gap-3 text-[13px] text-[#d7e0e8]"
                >
                  {status === "done" ? (
                    <Check className="h-4 w-4 text-[#2fe06d]" />
                  ) : status === "active" ? (
                    <CircleDashed className="h-4 w-4 animate-spin text-[#22ddd0]" />
                  ) : (
                    <Check className="h-4 w-4 text-[#4f5d68]" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-right text-[11px] text-[#a4b0bc]">Live sync</div>
        </div>

        <div className="glass-inset rounded-[14px] px-4 py-4">
          <div className="text-[15px] text-white">Recommended response</div>
          <div className="mt-3 text-[14px] leading-7 text-[#e6edf3]">
            {streamingText || "YieldBoost is ready to stream its recommendation after execution begins."}
          </div>
        </div>

        {latestResult ? (
          <div
            data-testid="optimization-result"
            className="rounded-[16px] border border-[rgba(57,235,169,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(57,235,169,0.14),transparent_35%)] px-4 py-5 backdrop-blur-[20px]"
          >
            <div className="text-[15px] text-[#22ddd0]">
              Optimization Complete! 🎉
            </div>
            <div className="mt-3 text-[14px] text-[#ebf2f8]">Your new APY is now</div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-[58px] font-semibold leading-none text-[#68ff7a]">
                  {latestResult.optimized_apy}%
                </p>
                <p className="mt-3 text-[13px] text-[#dbe4ec]">
                  Proof synchronized to 0G Storage.
                </p>
              </div>
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#68ff7a] shadow-[0_0_28px_rgba(104,255,122,0.26)]">
                <CheckCheck className="h-9 w-9 text-[#68ff7a]" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-3">
                {latestResult.proofUrl ? (
                  <a
                    href={latestResult.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-accent inline-flex items-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#22ddd0] transition hover:border-[rgba(0,201,177,0.4)]"
                  >
                    View on Explorer
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
                {latestResult.storageProof ? (
                  <div className="glass-inset rounded-[12px] px-4 py-3 text-[13px] text-[#d8e1e8]">
                    CID: {latestResult.storageProof.slice(0, 16)}...
                  </div>
                ) : null}
              </div>
              {latestResult.proofRegistryAddress ? (
                <div className="glass-accent rounded-[12px] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[#22ddd0]">ProofRegistry</div>
                  <div className="mt-2 space-y-2 text-[13px] text-[#d8e1e8]">
                    {latestResult.proofRegistryProofId ? (
                      <div>Proof ID: <span className="font-medium text-white">#{latestResult.proofRegistryProofId}</span></div>
                    ) : null}
                    <div className="truncate">Contract: {latestResult.proofRegistryAddress.slice(0, 10)}...{latestResult.proofRegistryAddress.slice(-6)}</div>
                    {latestResult.proofRegistryTxHash ? (
                      <div className="truncate">TX: {latestResult.proofRegistryTxHash.slice(0, 10)}...{latestResult.proofRegistryTxHash.slice(-6)}</div>
                    ) : null}
                  </div>
                  {latestResult.proofRegistryExplorerUrl ? (
                    <a
                      href={latestResult.proofRegistryExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium text-[#22ddd0]"
                    >
                      View Registry TX <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              ) : latestResult.storageProof ? (
                <div className="glass-inset rounded-[12px] px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] text-[#d9a441]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d9a441]" />
                    <span className="uppercase tracking-[0.08em]">0G Storage only · registry pending</span>
                  </div>
                  <div className="mt-1 text-[12px] text-[#9faab6]">
                    Proof is anchored on 0G Storage. On-chain ProofRegistry requires{" "}
                    <code className="text-[#d8e1e8]">ZG_PROOF_REGISTRY_ADDRESS</code> env.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="glass-inset rounded-[14px] px-4 py-4">
            <div className="text-[15px] text-white">Ready to execute</div>
            <div className="mt-3 text-[14px] leading-7 text-[#d7e0e8]">
              Start the optimizer to generate a 0G-backed recommendation and execution proof.
            </div>
            <div className="mt-4 flex items-center gap-2 text-[12px] text-[#22ddd0]">
              <CircleDashed className="h-4 w-4" />
              Waiting for user action
            </div>
          </div>
        )}
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-3 block text-[13px] font-semibold text-white">
            Prompt
          </span>
          <textarea
            name="prompt"
            rows={3}
            defaultValue={activePrompt}
            className="glass-inset w-full rounded-[14px] px-4 py-4 text-[14px] text-white outline-none transition focus:border-[rgba(31,216,200,0.6)]"
          />
        </label>

        {state.error ? <p className="text-sm text-[var(--accent-danger)]">{state.error}</p> : null}

        <button
          type="submit"
          data-testid="execute-btn"
          disabled={pending || isOptimizing}
          className="yb-teal-button inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-4 text-[16px] font-semibold text-[#071217] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send className="h-4 w-4" />
          {pending || isOptimizing ? "Executing Optimization..." : "Execute Optimization"}
        </button>
      </form>
    </section>
  );
}
