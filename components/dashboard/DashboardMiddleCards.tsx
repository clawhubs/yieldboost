import { Check } from "lucide-react";
import type { ComponentType } from "react";
import type { LiveData } from "./types";

interface OpportunityItem {
  name: string;
  apy: string;
  change: string;
  icon: ComponentType<{ className?: string }>;
}

interface Props {
  live: LiveData;
  liveDecisions: readonly string[];
  liveOpportunities: readonly OpportunityItem[];
}

export default function DashboardMiddleCards({ live, liveDecisions, liveOpportunities }: Props) {
  return (
    <div className="grid gap-[10px] xl:grid-cols-[276px_minmax(0,1fr)_298px]">
      {/* Before vs After */}
      <div data-testid="before-after-card" className="yb-card rounded-[14px] px-4 py-4">
        <div className="text-[12px] uppercase tracking-[0.04em] text-[#cfd8df]">BEFORE vs AFTER</div>
        <div className="mt-4 grid grid-cols-[1fr_42px_1fr] items-center gap-3">
          <div className="glass-inset rounded-[10px] p-3">
            <div className="text-[12px] text-[#d5dde6]">Before</div>
            <div className="mt-2 text-[18px] font-semibold text-white">{live.currentApy}%</div>
            <div className="mt-1 text-[11px] text-[#d5dde6]">Current APY</div>
          </div>
          <div className="glass-inset flex h-10 w-10 items-center justify-center rounded-full text-[#d8e0e8]">→</div>
          <div className="rounded-[10px] border border-[rgba(0,201,177,0.2)] bg-[rgba(0,201,177,0.06)] p-3">
            <div className="text-[12px] text-[#8aeedc]">After</div>
            <div className="mt-2 text-[18px] font-semibold text-[#25ddd0]">{live.optimizedApy}%</div>
            <div className="mt-1 text-[11px] text-[#d5dde6]">AI Projected APY</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="glass-inset rounded-[10px] p-2 text-[#2fe06d]">+{live.yieldIncreasePct}%<div className="mt-1 text-[#cad4dd]">Improve</div></div>
          <div className="glass-inset rounded-[10px] p-2 text-[#2fe06d]">+${live.estimatedAnnualGain.toLocaleString()}<div className="mt-1 text-[#cad4dd]">More/year</div></div>
          <div className="glass-inset rounded-[10px] p-2 text-[#2fe06d]">Lower<div className="mt-1 text-[#cad4dd]">Risk</div></div>
        </div>
      </div>

      {/* AI Decision Log */}
      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] font-medium text-white">AI DECISION LOG</div>
          <button type="button" className="glass-inset rounded-[10px] px-3 py-1 text-[11px] text-[#d7e0e8]">Why?</button>
        </div>
        <div className="mt-4 space-y-2">
          {liveDecisions.map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px] text-[#d9e2ea]">
              <Check className="h-4 w-4 text-[#2fe06d]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[12px] text-[#cfd8e0]">
          <span>Model: YieldBoost v2.1</span>
          <span>Confidence: <span className="text-[#2fe06d]">{live.confidence}%</span></span>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] font-medium text-white">TOP OPPORTUNITIES</div>
          <button type="button" className="glass-inset rounded-[10px] px-3 py-1 text-[11px] text-[#d7e0e8]">View all</button>
        </div>
        <div className="mt-4 space-y-4">
          {liveOpportunities.map((item) => (
            <div key={item.name} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="glass-inset flex h-10 w-10 items-center justify-center rounded-full text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[13px] text-white">{item.name}</div>
                  <div className="mt-1 text-[12px] text-[#d1d9e1]">
                    Est. APY <span className="text-[#2fe06d]">{item.apy}</span>
                  </div>
                </div>
              </div>
              <div className="text-[12px] font-medium text-[#2fe06d]">↑ {item.change}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
