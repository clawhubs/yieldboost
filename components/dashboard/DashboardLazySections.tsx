import { Users, DollarSign, Activity, Gauge, ShieldCheck, Database, Shield, Plane, Wallet2, Bell, Zap, Check, ChevronDown, Grid2X2, CheckCheck, HeartHandshake, MessageCircleMore, Lock, UserRound, Bot, Box, CircleDashed, Clock3, Cpu, Disc3, Expand, Globe, Sparkles, Copy, ExternalLink, LucideIcon } from "lucide-react";

export function MiniSpark({ color = "#2cf0dd" }: { color?: string }) {
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

export function ImpactBars() {
  const heights = [10, 17, 12, 20, 14, 24, 27, 16, 25, 22, 18, 26];

  return (
    <div className="flex h-[32px] items-end gap-[4px] overflow-hidden" aria-hidden="true">
      {heights.map((height, index) => (
        <div
          key={index}
          className="min-w-0 flex-1 rounded-t-[8px] bg-[linear-gradient(180deg,#5cf48e_0%,#2ecf67_45%,#0c1a12_100%)] shadow-[0_0_10px_rgba(76,235,130,0.14)]"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

export function ImpactLine({
  path,
}: {
  path: string;
}) {
  return (
    <svg viewBox="0 0 108 32" className="h-[32px] w-full" aria-hidden="true">
      <path d={path} fill="none" stroke="#42ebe2" strokeWidth="4.5" strokeOpacity="0.08" strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke="#42ebe2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricIcon({
  icon: Icon,
}: {
  icon: typeof Users;
}) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#18232c] bg-[#091117] text-[#dce4eb]">
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function AgentSideRail({
  icon: Icon,
}: {
  icon: LucideIcon;
}) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1b242d] bg-[#0b1117] text-[#25d6c6]">
      <Icon className="h-6 w-6" />
    </div>
  );
}
