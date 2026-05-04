"use client";

interface HeroChartProps {
  hasData?: boolean;
  mode?: "live" | "snapshot";
}

const proofSteps = [
  {
    title: "Wallet input",
    live: "Live wallet snapshot",
    snapshot: "Stored judge snapshot",
  },
  {
    title: "0G proof layer",
    live: "Storage + ProofRegistry",
    snapshot: "Anchored proof record",
  },
  {
    title: "Optimized route",
    live: "Ready for execution",
    snapshot: "Read-only review result",
  },
] as const;

export default function HeroChart({ hasData = true, mode = "live" }: HeroChartProps) {
  if (!hasData) {
    return (
      <div
        data-testid="yield-chart"
        className="relative h-[176px] overflow-hidden rounded-[16px] border border-[#13222a] bg-[radial-gradient(circle_at_top,rgba(34,221,208,0.08),transparent_46%)]"
      >
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(40,224,215,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(40,224,215,0.08)_1px,transparent_1px)] [background-size:42px_28px]" />
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#d5dee6]">
              No live route yet
            </div>
            <div className="mt-2 max-w-[360px] text-[12px] leading-5 text-[#8fa0ae]">
              Connect a wallet or open Judge mode to review a stored 0G proof snapshot.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="yield-chart"
      className="relative h-[176px] overflow-hidden rounded-[16px] border border-[#123038] bg-[linear-gradient(135deg,rgba(5,13,18,0.98),rgba(6,28,27,0.88))] p-4"
    >
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(63,243,233,0.15)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex h-full items-center">
        <div className="grid items-center gap-2 md:grid-cols-[1fr_32px_1fr_32px_1fr]">
          {proofSteps.map((step, index) => (
            <div key={step.title} className="contents">
              <div className="rounded-[14px] border border-[#1d3840] bg-[#07151b]/90 p-3 shadow-[0_0_24px_rgba(34,221,208,0.08)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2ae8dc]/50 bg-[#0b2928] text-[11px] font-semibold text-[#75fff6]">
                    {index + 1}
                  </span>
                  <div className="text-[12px] font-semibold text-white">{step.title}</div>
                </div>
                <div className="mt-2 text-[11px] leading-4 text-[#91a1ad]">
                  {mode === "snapshot" ? step.snapshot : step.live}
                </div>
              </div>
              {index < proofSteps.length - 1 ? (
                <div className="hidden h-px bg-gradient-to-r from-[#21404a] via-[#3ff3e9] to-[#21404a] md:block" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
