import { Cpu, DollarSign, Shield, UserRound, Users } from "lucide-react";
import type { GlobalStatsData } from "./types";

function MetricIcon({ icon: Icon }: { icon: typeof Users }) {
  return (
    <div className="glass-inset flex h-10 w-10 items-center justify-center rounded-[12px] text-[#dce4eb]">
      <Icon className="h-4 w-4" />
    </div>
  );
}

interface Props {
  globalStats: GlobalStatsData | null;
}

export default function DashboardStatsGrid({ globalStats }: Props) {
  const hasData = globalStats?.hasData ?? false;
  const dash = "—";
  const cards = [
    { icon: Users,      value: globalStats?.formatted.users ?? dash,         label: "Wallets Optimized",  sublabel: hasData ? "Runtime proof store"          : "Awaiting first optimization" },
    { icon: DollarSign, value: globalStats?.formatted.tvl ?? dash,           label: "TVL Managed",        sublabel: hasData ? "Sum of optimized portfolios"   : "Awaiting first optimization" },
    { icon: Cpu,        value: globalStats?.formatted.computeJobs ?? dash,   label: "Compute Jobs",       sublabel: hasData ? "0G + ProofRegistry"            : "Awaiting first optimization" },
    { icon: UserRound,  value: globalStats?.formatted.recentJobs24h ?? dash, label: "Jobs (24h)",         sublabel: hasData ? "Last 24 hours"                 : "Awaiting first optimization" },
    { icon: Shield,     value: globalStats?.formatted.protocols ?? dash,     label: "Unique Protocols",   sublabel: hasData ? "Recommended so far"            : "Awaiting first optimization" },
  ];

  return (
    <div className="grid gap-[10px] xl:grid-cols-5">
      {cards.map((item) => (
        <div key={item.label} className="yb-soft-card rounded-[14px] px-4 py-3">
          <div className="flex items-center gap-3">
            <MetricIcon icon={item.icon} />
            <div>
              <div className="text-[18px] font-semibold text-white">{item.value}</div>
              <div className="text-[12px] text-[#d4dde5]">{item.label}</div>
              <div className="mt-1 text-[11px] text-[#2fe06d]">{item.sublabel}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
