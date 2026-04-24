import { CheckCheck } from "lucide-react";
import type { OptimizationState } from "@/lib/optimizations";

const steps: OptimizationState[] = ["analyzing", "optimizing", "executing", "done"];

function getStepIndex(state: OptimizationState) {
  return steps.indexOf(state);
}

interface OptimizationProgressProps {
  progress: OptimizationState;
  executionSeconds: number;
}

export default function OptimizationProgress({
  progress,
  executionSeconds,
}: OptimizationProgressProps) {
  const activeIndex = getStepIndex(progress);

  return (
    <section
      data-testid="optimization-progress"
      className="yb-card rounded-[18px] px-5 py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#9faab6]">
            Optimization Progress
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-semibold text-white">
            YieldBoost execution pipeline
          </h2>
        </div>
        <div className="rounded-[10px] border border-[#174642] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
          Live
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {steps.map((step, index) => {
          const completed = index < activeIndex || progress === "done";
          const active = index === activeIndex && progress !== "done";

          return (
            <div key={step} className="relative flex items-center gap-3 rounded-[14px] border border-[#182028] bg-[#091117] px-4 py-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  completed
                    ? "border-[#2ed86a] bg-[#12321c] text-[#2ed86a]"
                    : active
                      ? "animate-float-pulse border-[#25d6c6] bg-[#0d2523] text-[#25d6c6]"
                      : "border-[#2b3640] bg-[#0b1218] text-[#9faab6]"
                }`}
              >
                {completed ? <CheckCheck className="h-4 w-4" /> : index + 1}
              </div>
              <div>
                <p className="text-[13px] font-semibold capitalize text-white">{step}</p>
                <p className="text-[11px] text-[#9faab6]">
                  {completed ? "Completed" : active ? "Running now" : "Queued"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[13px] text-[#d6dee6]">
        Executed in {executionSeconds.toFixed(2)} seconds
      </p>
    </section>
  );
}
