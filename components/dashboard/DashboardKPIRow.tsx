import { DollarSign, Gauge, Plane, Wallet2 } from "lucide-react";
import type { LiveData } from "./types";

function MiniSpark({ color = "#2cf0dd" }: { color?: string }) {
  return (
    <svg viewBox="0 0 96 30" className="h-[26px] w-[96px]" aria-hidden="true">
      <path
        d="M1 22C8 22 9 18 16 18C23 18 24 24 31 24C38 24 38 13 45 13C52 13 54 22 61 22C68 22 68 9 75 9C82 9 84 16 95 4"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Props {
  live: LiveData;
}

export default function DashboardKPIRow({ live }: Props) {
  const items = [
    { label: "TOTAL PORTFOLIO VALUE",  value: `$${live.totalPortfolio.toLocaleString()}`,       change: "↑ 5.34% (24h)", icon: Wallet2,     accent: false, testId: "kpi-portfolio" },
    { label: "TOTAL EARNED (ALL TIME)", value: `$${live.estimatedAnnualGain.toLocaleString()}`,  change: "↑ 12.45%",       icon: DollarSign,  accent: false, testId: undefined },
    { label: "AVG. CURRENT APY",        value: `${live.currentApy}%`,                            change: "",               icon: Gauge,        accent: false, testId: "kpi-apy" },
    { label: "POTENTIAL AFTER AI",      value: `${live.optimizedApy}%`,                          change: `↑ ${live.yieldIncreasePct}%`, icon: Plane, accent: true, testId: "kpi-yield" },
  ];

  return (
    <div className="grid gap-[10px] xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          data-testid={item.testId}
          className="yb-card rounded-[14px] px-4 py-4 transition hover:border-[rgba(255,255,255,0.12)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.04em] text-[#a7b3be]">{item.label}</div>
              <div className="mt-2 text-[22px] font-semibold text-white">{item.value}</div>
              {item.change ? (
                <div className="mt-1 text-[12px] text-[#2fe06d]">{item.change}</div>
              ) : (
                <div className="mt-1 text-[12px]"> </div>
              )}
            </div>
            <div className={`glass-inset flex h-11 w-11 items-center justify-center rounded-full ${item.accent ? "text-[#2fe06d]" : "text-[#d8e1e8]"}`}>
              <item.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <MiniSpark color={item.accent ? "#2fe06d" : "#2ad7c8"} />
          </div>
        </div>
      ))}
    </div>
  );
}
