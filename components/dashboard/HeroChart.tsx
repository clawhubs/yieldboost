"use client";

interface HeroChartProps {
  hasData?: boolean;
  mode?: "live" | "snapshot";
}

const proofSteps = [
  {
    title: "Wallet input",
    pending: "Connect wallet",
    live: "Live wallet snapshot",
    snapshot: "Stored judge snapshot",
  },
  {
    title: "0G proof layer",
    pending: "Proof pending",
    live: "Storage + ProofRegistry",
    snapshot: "Anchored proof record",
  },
  {
    title: "Optimized route",
    pending: "Route pending",
    live: "Ready for execution",
    snapshot: "Read-only review result",
  },
] as const;

export default function HeroChart({ hasData = true, mode = "live" }: HeroChartProps) {
  return (
    <div
      data-testid="yield-chart"
      className="relative min-h-[176px] overflow-hidden rounded-[16px] border border-[#123038] bg-[linear-gradient(135deg,rgba(5,13,18,0.98),rgba(6,28,27,0.88))] p-4 sm:h-[176px]"
    >
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(63,243,233,0.15)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex min-h-[144px] items-center sm:h-full sm:min-h-0">
        <div className="grid w-full items-center gap-3 sm:grid-cols-[1fr_32px_1fr_32px_1fr] sm:gap-2">
          {proofSteps.map((step, index) => (
            <div key={step.title} className="contents">
              <div className="min-w-0 rounded-[14px] border border-[#1d3840] bg-[#07151b]/90 p-3 shadow-[0_0_24px_rgba(34,221,208,0.08)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#2ae8dc]/50 bg-[#0b2928] text-[11px] font-semibold text-[#75fff6]">
                    {index + 1}
                  </span>
                  <div className="truncate text-[12px] font-semibold text-white">{step.title}</div>
                </div>
                <div className="mt-2 text-[11px] leading-4 text-[#91a1ad]">
                  {!hasData ? step.pending : mode === "snapshot" ? step.snapshot : step.live}
                </div>
              </div>
              {index < proofSteps.length - 1 ? (
                <div className="mx-auto h-5 w-px bg-gradient-to-b from-[#21404a] via-[#3ff3e9] to-[#21404a] sm:h-px sm:w-full sm:bg-gradient-to-r" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
