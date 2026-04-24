import { Bell, ChevronDown, Zap } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="yb-card flex flex-col gap-3 rounded-[18px] px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-[13px] font-semibold text-white">GM, Builder! 👋</div>
        <div className="mt-1 text-[12px] text-[#9daab6]">
          Your AI agent is working 24/7 to grow your wealth.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="risk-profile"
          className="glass-inset flex h-[46px] items-center gap-2 rounded-[12px] px-4 text-left transition hover:border-[rgba(0,201,177,0.25)]"
        >
          <div>
            <div className="text-[11px] text-[#d9e1e8]">Risk Profile</div>
            <div className="mt-0.5 text-[12px] font-medium text-[#2ad7c8]">Moderate</div>
          </div>
          <ChevronDown className="h-4 w-4 text-[#d9e1e8]" />
        </button>

        <button
          type="button"
          data-testid="alerts-button"
          className="glass-inset relative flex h-[46px] w-[46px] items-center justify-center rounded-[12px] text-white transition hover:border-[rgba(255,255,255,0.15)]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1cdad0] px-1 text-[9px] font-semibold text-[#061015]">
            3
          </span>
        </button>

        <button
          type="button"
          data-testid="boost-yield-cta"
          className="yb-teal-button flex h-[46px] min-w-[248px] items-center justify-center gap-3 rounded-[12px] px-5 text-left text-[#051015]"
        >
          <Zap className="h-4 w-4" />
          <div>
            <div className="text-[14px] font-semibold">Boost My Yield Now</div>
            <div className="text-[11px] text-[#0b4340]">1-Click AI Optimization</div>
          </div>
        </button>
      </div>
    </header>
  );
}
