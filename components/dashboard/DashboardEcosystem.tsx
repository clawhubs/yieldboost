import { Box, Cpu, ExternalLink, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";

const EXPLORER_BASE = "https://chainscan-galileo.0g.ai";

const whyOg = [
  { icon: Box,        title: "AI-NATIVE STORAGE",    line1: "Petabyte scale",         line2: "Low cost, high throughput" },
  { icon: ShieldCheck, title: "VERIFIABLE COMPUTE",  line1: "ZK-proofs on-chain",     line2: "Trustless & verifiable"   },
  { icon: Cpu,        title: "BUILT FOR AI AGENTS",  line1: "Decentralized infra",    line2: "Designed for scale"        },
] as const;

const chainStats = [
  { label: "Storage Throughput", value: "12.45 PB/day" },
  { label: "Compute Jobs",       value: "184,392"       },
  { label: "ZK Proofs Verified", value: "2.14M"         },
  { label: "Avg. Finality",      value: "2.1s"          },
  { label: "Active Operators",   value: "128"           },
  { label: "Uptime",             value: "99.98%"        },
] as const;

const impactStats = [
  { label: "New Accounts",       value: "+18,392" },
  { label: "Compute Jobs",       value: "184,392" },
  { label: "ZK Proofs Verified", value: "2.14M"   },
] as const;

const footerItems = [
  { icon: Lock,       label: "Secure"         },
  { icon: ShieldCheck,label: "Non-Custodial"  },
  { icon: Zap,        label: "1-Click Execution" },
  { icon: Sparkles,   label: "AI-Powered"     },
] as const;

function ImpactBars() {
  const heights = [10, 17, 12, 20, 14, 24, 27, 16, 25, 22, 18, 26];
  return (
    <div className="flex h-[32px] items-end gap-[4px] overflow-hidden" aria-hidden="true">
      {heights.map((height, index) => (
        <div
          key={index}
          className="min-w-0 flex-1 rounded-t-[8px] bg-[linear-gradient(180deg,#5cf48e_0%,#2ecf67_45%,transparent_100%)] shadow-[0_0_10px_rgba(76,235,130,0.18)]"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}

function ImpactLine({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 108 32" className="h-[32px] w-full" aria-hidden="true">
      <path d={path} fill="none" stroke="#42ebe2" strokeWidth="4.5" strokeOpacity="0.08" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#42ebe2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardEcosystem() {
  return (
    <>
      <div className="grid gap-[10px] xl:grid-cols-[1.18fr_1fr_1fr]">
        {/* Why 0G */}
        <div className="yb-card rounded-[14px] px-4 py-4">
          <div className="text-[12px] font-medium text-white">WHY 0G?</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {whyOg.map((item) => (
              <div key={item.title}>
                <div className="flex items-center gap-2 text-[#24d9cb]">
                  <item.icon className="h-5 w-5" />
                  <div className="text-[11px] font-medium">{item.title}</div>
                </div>
                <div className="mt-2 text-[11px] text-[#d0d8e0]">{item.line1}</div>
                <div className="text-[11px] text-[#9faab6]">{item.line2}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 text-[13px] text-[#d8e1e8]">The data layer for the AI-native Web3.</div>
        </div>

        {/* 0G Chain Stats */}
        <div data-testid="zerog-stats" className="yb-card rounded-[14px] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-medium text-white">0G CHAIN STATS</div>
              <div className="text-[10px] text-[#6b7a87]">source: 0g.ai network docs</div>
            </div>
            <a href={EXPLORER_BASE} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#25d6c6] hover:underline">
              View on 0G Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {chainStats.map((item) => (
              <div key={item.label}>
                <div className="text-[10px] text-[#9faab6]">{item.label}</div>
                <div className="mt-1 text-[13px] font-medium text-[#2fe06d]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ecosystem Impact */}
        <div className="yb-card rounded-[14px] px-4 py-4">
          <div>
            <div className="text-[12px] font-medium text-white">0G ECOSYSTEM IMPACT (30D)</div>
            <div className="text-[10px] text-[#6b7a87]">source: 0g.ai network docs</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-5">
            {impactStats.map((item) => (
              <div key={item.label}>
                <div className="text-[10px] text-[#9faab6]">{item.label}</div>
                <div className="mt-1 text-[13px] font-medium text-[#2fe06d]">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-5">
            <ImpactBars />
            <ImpactLine path="M8 24C18 23 23 21 32 18C40 16 46 19 55 15C63 11 71 8 80 12C88 15 93 18 100 9" />
            <ImpactLine path="M8 23C17 18 26 12 36 15C45 18 52 24 61 20C70 16 77 9 86 12C92 14 96 17 100 10" />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3 text-[11px] text-[#2fe06d]">
            <ShieldCheck className="h-4 w-4" />
            Secured by 0G. Verified by Zero-Knowledge.
          </div>
        </div>
      </div>

      {/* Footer trust bar */}
      <div className="yb-card rounded-[14px] px-4 py-3">
        <div className="grid gap-3 md:grid-cols-4">
          {footerItems.map((item) => (
            <div key={item.label} className="flex items-center justify-center gap-2 text-[12px] text-[#d7dfe7]">
              <item.icon className="h-4 w-4 text-[#d7dfe7]" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
