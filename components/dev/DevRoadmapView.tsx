import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  Database,
  Fingerprint,
  Globe2,
  Layers,
  LockKeyhole,
  Network,
  Rocket,
  ShieldCheck,
  Store,
  TrendingUp,
} from "lucide-react";

import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

const phaseCards = [
  {
    id: "01",
    status: "LIVE",
    window: "Now / Q2 2026",
    title: "Infrastructure Core",
    focus:
      "The product is already live as a B2B infrastructure stack: YieldBoost AI Protocol store, TITAN X flagship showcase, verification console, and selected public challenge surfaces.",
    icon: ShieldCheck,
    checkpoints: [
      "Mainnet YieldBoost AI Protocol store",
      "TITAN X flagship showcase on 0G Mainnet",
      "Verification console with live audit trail",
      "0G Storage + ProofRegistry anchor path",
      "Native 0G-priced API tiers",
      "Selected partner SDK wrapper model",
      "Anti-sybil + Alibaba fingerprinting module",
      "Public challenge surfaces for hostile testing",
    ],
    money:
      "This is the current business base: developers buy modular integrity, enterprises buy trust infrastructure, TITAN X proves commercial usability, and public testers challenge selected defenses.",
  },
  {
    id: "02",
    status: "NEXT",
    window: "Q3 / Q4 2026",
    title: "Distribution Scale",
    focus:
      "Scale YieldBoost AI Protocol into broader developer adoption, partner distribution, and stronger commercial packaging.",
    icon: TrendingUp,
    checkpoints: [
      "High-performance AI gateway with protected access",
      "Reference implementations built on YieldBoost AI Protocol",
      "Multi-agent planner, actor, and critic loop",
      "More partner modules added to the store",
    ],
    money:
      "Next scale comes from turning YieldBoost AI Protocol into the default trust layer for more teams, more wrappers, and more protected agent products.",
  },
  {
    id: "03",
    status: "NEXT",
    window: "Q4 2026 - 2027",
    title: "Enterprise Trust Layer",
    focus:
      "Harden the system for companies, funds, exchanges, and serious protocol buyers.",
    icon: Building2,
    checkpoints: [
      "Formal verification for core contracts",
      "ISO/IEC 42001 AI governance readiness",
      "SOC 2 Type II operational controls",
      "FIPS 140-3 cryptography alignment",
      "Common Criteria CC EAL4+ security target",
    ],
    money:
      "Enterprise trust unlocks larger API contracts, security budgets, white-label deployments, and strategic integrations.",
  },
  {
    id: "04",
    status: "NEXT",
    window: "Beyond 2027",
    title: "Multi-Chain Integrity Standard",
    focus:
      "Make YieldBoost AI Protocol portable across the wider AI economy as a reusable integrity standard.",
    icon: Globe2,
    checkpoints: [
      "Omni-chain deployment for AI agents",
      "Autonomous red-teaming against store modules",
      "Cross-chain proof memory and strategy graph",
      "RWA and institutional strategy verification",
      "Security standard for agentic finance products",
    ],
    money:
      "YieldBoost becomes licensable infrastructure that other chains, agents, products, and stores can adopt.",
  },
];

const livePillars = [
  {
    label: "YieldBoost AI Protocol store",
    icon: Store,
    text: "The 10-layer stack is sold as modular APIs, SDKs, and fortress modules.",
  },
  {
    label: "TITAN X showcase",
    icon: Rocket,
    text: "1-Click Optimize proves the stack works as a complete mainnet product shell.",
  },
  {
    label: "10-layer core",
    icon: Layers,
    text: "TEE, ZK, memory, storage, governance, and ProofRegistry work together.",
  },
  {
    label: "Verification console",
    icon: ShieldCheck,
    text: "The live audit trail proves the stack is on-chain, reviewable, and integration-ready.",
  },
];

const productLines = [
  {
    label: "Store revenue",
    icon: CircleDollarSign,
    text: "The API / SDK store is the core commercial surface: full stack, single layers, anti-sybil modules, and fortress rails.",
  },
  {
    label: "Developer revenue",
    icon: Database,
    text: "The store sells reusable trust infrastructure instead of one closed application.",
  },
  {
    label: "Proof-led sales",
    icon: ShieldCheck,
    text: "The verification console reduces adoption friction by proving every security claim before purchase.",
  },
  {
    label: "Enterprise revenue",
    icon: LockKeyhole,
    text: "Auditability, private execution, and modular control planes unlock higher-value B2B contracts.",
  },
];

const proofRails = [
  { label: "0G Compute", icon: BrainCircuit, desc: "TEE model evidence" },
  { label: "0G Storage", icon: Database, desc: "Proof payload anchor" },
  { label: "ProofRegistry", icon: Network, desc: "On-chain receipt" },
  { label: "ZK Proof Layer", icon: ShieldCheck, desc: "Agent identity proof" },
  { label: "Alibaba Fingerprinting", icon: Fingerprint, desc: "Anti-sybil module" },
];

export default function DevRoadmapView() {
  return (
    <DeveloperPortalShell
      eyebrow="YieldBoost AI Protocol Roadmap"
      title="What is live now, and what scales next."
      description="This roadmap keeps the commercial story in the store shell: live infrastructure first, showcase second, proof always visible."
    >
      <section className="glow-card fade-in-up fade-in-up-1 p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] xl:items-center">
          <div>
            <Link
              href="/dev"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.28)] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#72f3c7]" />
              Back to store
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.24)] bg-[rgba(0,201,177,0.08)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ff7ea]">
              <Rocket className="h-3.5 w-3.5" />
              Store first. Proof always visible.
            </div>
            <h2 className="mt-4 text-[30px] font-extrabold tracking-tight text-white md:text-[38px]">
              A 10-layer B2B integrity business with a live mainnet showcase.
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#d0dde8]">
              YieldBoost AI sells YieldBoost AI Protocol as modular infrastructure for Web3 AI agents. TITAN X is the flagship showcase proving the stack works on 0G Mainnet. The verification console is the trust surface that turns security claims into visible proof.
            </p>
          <div className="mt-5 flex flex-wrap gap-4">
              {[
                { v: "10", l: "Layers", c: "text-[#72f3c7]" },
                { v: "4", l: "Phases", c: "text-[#68ff7a]" },
                { v: "LIVE", l: "Phase 01", c: "text-[#f6c166]" },
                { v: "B2B", l: "Positioning", c: "text-[#63d8ff]" },
              ].map((m) => (
                <div key={m.l} className="text-center">
                  <div className={`text-[24px] font-bold leading-none ${m.c}`}>{m.v}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8ea1af]">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(2,8,13,0.42)] p-3">
            <Image
              src="/readme/roadmap.png"
              alt="YieldBoost AI roadmap visual"
              width={1200}
              height={720}
              className="h-auto w-full rounded-[16px] object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-1.5">
        <div className="flex justify-end">
          <Link
            href="/dev/audit"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
          >
            Open audit proof
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-2 grid gap-4 xl:grid-cols-4">
        {livePillars.map((pillar) => (
          <article key={pillar.label} className="glow-card p-5">
            <pillar.icon className="h-5 w-5 text-[#72f3c7]" />
            <h3 className="mt-3 text-[18px] font-bold text-white">{pillar.label}</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="fade-in-up fade-in-up-3">
        <div className="mb-5 max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Roadmap phases</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
            Live foundation first, then the next commercial expansion.
          </h2>
          <p className="mt-2 text-[14px] leading-7 text-[#c8dae6]">
            The order matters: sell YieldBoost AI Protocol, prove it through TITAN X, expose it through the verification console, then scale into partner distribution and enterprise trust.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {phaseCards.map((phase) => (
            <article key={phase.id} className="glow-card overflow-hidden p-0">
              <div className="border-b border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(0,201,177,0.16),transparent_32%)] px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
                      Phase {phase.id} / {phase.window}
                    </div>
                    <h3 className="mt-2 text-[22px] font-bold text-white">{phase.title}</h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(0,201,177,0.20)] bg-[rgba(0,201,177,0.08)] text-[#9ff7f0]">
                    <phase.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  phase.status === "LIVE"
                    ? "border-[rgba(47,224,109,0.28)] bg-[rgba(47,224,109,0.12)] text-[#68ff7a]"
                    : "border-[rgba(246,193,102,0.22)] bg-[rgba(246,193,102,0.08)] text-[#f6c166]"
                }`}>
                  {phase.status}
                </div>
                <p className="mt-3 text-[13px] leading-6 text-[#dce7ee]">{phase.focus}</p>
              </div>

              <div className="px-5 py-4">
                <div className="grid gap-2">
                  {phase.checkpoints.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-[12px] leading-6 text-[#dce5ec]">
                      {phase.status === "LIVE" ? (
                        <BadgeCheck className="mt-1 h-3.5 w-3.5 flex-none text-[#68ff7a]" />
                      ) : (
                        <ArrowRight className="mt-1 h-3.5 w-3.5 flex-none text-[#f6c166]" />
                      )}
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[14px] border border-[rgba(246,193,102,0.16)] bg-[rgba(246,193,102,0.04)] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f6c166]">
                    Revenue path
                  </div>
                  <p className="mt-1.5 text-[12px] leading-6 text-[#e4eff3]">{phase.money}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fade-in-up fade-in-up-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="glow-card p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">How it sells</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
            Revenue is built into the architecture.
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {productLines.map((line) => (
              <div key={line.label} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4">
                <line.icon className="h-5 w-5 text-[#9ff7f0]" />
                <h3 className="mt-3 text-[16px] font-bold text-white">{line.label}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#dce5ec]">{line.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glow-card p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">0G rails</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
            The proof base layer stays 0G.
          </h2>
          <div className="mt-5 grid gap-2">
            {proofRails.map((rail) => (
              <div
                key={rail.label}
                className="flex items-center gap-3 rounded-[14px] border border-[rgba(0,201,177,0.12)] bg-[rgba(0,201,177,0.045)] px-4 py-3"
              >
                <rail.icon className="h-4 w-4 text-[#9ff7f0]" />
                <span className="text-[13px] font-semibold text-white">{rail.label}</span>
                <span className="ml-auto text-[11px] text-[#8ea1af]">{rail.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[15px] border border-[rgba(47,224,109,0.18)] bg-[rgba(47,224,109,0.06)] px-4 py-4">
            <p className="text-[12px] leading-6 text-[#dff8e7]">
              Store payments are native 0G. TITAN X, fortress modules, and the anti-sybil perimeter sit on top of the same compute, storage, registry, and proof rails.
            </p>
          </div>
        </div>
      </section>
    </DeveloperPortalShell>
  );
}
