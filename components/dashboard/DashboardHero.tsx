import type { OptimizationResult } from "@/lib/optimizations";
import type { LiveData } from "./types";

function HeroChart() {
  return (
    <div data-testid="yield-chart" className="relative h-[176px]">
      <svg viewBox="0 0 640 176" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28e0d7" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#28e0d7" stopOpacity="0" />
          </linearGradient>
          <filter id="heroGlow" x="-20%" y="-40%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M24 132C48 125 61 114 79 107C97 100 121 105 139 96C157 87 176 71 193 70C210 69 233 75 249 67C265 59 284 46 301 47C317 48 333 57 350 52C367 47 382 31 399 32C416 33 438 44 456 40C474 36 490 20 507 21C525 22 541 30 557 26C573 22 594 10 616 11V157H24V132Z"
          fill="url(#heroFill)"
          opacity="0.95"
        />
        <path
          d="M24 132C48 125 61 114 79 107C97 100 121 105 139 96C157 87 176 71 193 70C210 69 233 75 249 67C265 59 284 46 301 47C317 48 333 57 350 52C367 47 382 31 399 32C416 33 438 44 456 40C474 36 490 20 507 21C525 22 541 30 557 26C573 22 594 10 616 11"
          fill="none"
          stroke="#3FF3E9"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#heroGlow)"
        />
        <line x1="23" y1="129" x2="618" y2="129" stroke="#c6d0d9" strokeDasharray="4 6" strokeOpacity="0.28" />
        <circle cx="24" cy="132" r="5" fill="#3FF3E9" />
        <circle cx="616" cy="11" r="6" fill="#A7FFF8" stroke="#3FF3E9" strokeWidth="3" />
      </svg>
      <div className="absolute right-2 top-0 text-[14px] font-semibold text-white">APY</div>
      <div className="absolute left-0 top-[128px] text-[11px] text-white/90">Today</div>
      <div className="absolute right-0 bottom-0 text-[11px] text-[#cfd8e0]">After Optimization</div>
    </div>
  );
}

interface Props {
  latestResult: OptimizationResult | null;
  live: LiveData;
}

export default function DashboardHero({ latestResult, live }: Props) {
  return (
    <div className="yb-card rounded-[18px] px-5 py-5" data-testid="hero-card">
      <div className="grid gap-6 xl:grid-cols-[356px_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]">
            {latestResult ? (
              <>
                <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-[#22e070]" />
                <span className="text-[#22e070]">Live · {new Date(latestResult.timestamp).toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#d9a441]" />
                <span className="text-[#d9a441]">Seed forecast · click Boost to go live</span>
              </>
            )}
          </div>

          <p className="text-[15px] text-white">Stop letting your crypto sit idle.</p>
          <h1 className="yb-glow-text mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.08] text-white md:text-[34px]">
            Let AI make it <span className="text-[#22ddd0]">earn.</span>
          </h1>
          <p className="mt-2 text-[14px] text-[#d6dee6]">Autonomous. On-chain. Profitable.</p>

          <div className="mt-6 grid grid-cols-2 gap-5">
            <div className="border-r border-[rgba(255,255,255,0.07)] pr-4">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#a9b5c0]">
                Estimated Yield Increase
              </div>
              <div className="mt-2 text-[26px] font-semibold text-[#22e070]">+{live.yieldIncreasePct}%</div>
              <div className="mt-1 text-[13px] text-[#29e072]">
                +${live.estimatedAnnualGain.toLocaleString()} <span className="text-[#d8e1e9]">/ year</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#a9b5c0]">Projected APY</div>
              <div className="mt-2 text-[26px] font-semibold text-white">{live.optimizedApy}%</div>
              <div className="mt-1 inline-flex rounded-[8px] border border-[rgba(255,255,255,0.08)] px-2 py-1 text-[11px] text-[#d4dee7]">
                Current APY: {live.currentApy}%
              </div>
            </div>
          </div>
        </div>

        <HeroChart />
      </div>
    </div>
  );
}
