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
  ExternalLink,
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
import JudgeModeBootstrap from "@/components/judge/JudgeModeBootstrap";
import JudgeSnapshotAutoRefresh from "@/components/judge/JudgeSnapshotAutoRefresh";
import BrowserTimeLabel from "@/components/judge/BrowserTimeLabel";
import { getJudgePageData } from "@/lib/server/review-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatPercent(value: number | undefined) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "Pending";
}

const phaseCards = [
  {
    id: "01",
    status: "LIVE",
    window: "Now / Q2 2026",
    title: "Infrastructure Core",
    focus: "The product is already live as a B2B infrastructure stack: TITAN PROTOCOL marketplace, flagship showcase, interactive judge terminal, and selected public challenge surfaces.",
    icon: ShieldCheck,
    color: "teal",
    checkpoints: [
      "Mainnet TITAN PROTOCOL marketplace",
      "Flagship 1-click showcase on 0G Mainnet",
      "Interactive judge terminal with live audit trail",
      "0G Storage + ProofRegistry anchor path",
      "Native 0G-priced API tiers in Modular Immunity Armory",
      "Selected partner SDK wrapper model",
      "Anti-sybil + Alibaba fingerprinting module",
      "Public challenge surfaces for hostile testing",
    ],
    money: "This is the current business base: developers buy modular integrity, enterprises buy trust infrastructure, the showcase proves commercial usability, and public testers challenge selected defenses.",
  },
  {
    id: "02",
    status: "NEXT",
    window: "Q3/Q4 2026",
    title: "Distribution Scale",
    focus: "Scale the live infrastructure into broader developer adoption, partner distribution, and stronger commercial packaging.",
    icon: TrendingUp,
    color: "green",
    checkpoints: [
      "High-performance AI gateway with protected access",
      "Reference implementations built on TITAN PROTOCOL",
      "Multi-agent planner, actor, and critic loop",
      "More partner modules added to the armory",
    ],
    money: "Next scale comes from turning TITAN PROTOCOL into the default trust layer for more teams, more wrappers, and more protected agent products.",
  },
  {
    id: "03",
    status: "NEXT",
    window: "Q4 2026 - 2027",
    title: "Enterprise Trust Layer",
    focus: "Harden the system for companies, funds, exchanges, and serious protocol buyers.",
    icon: Building2,
    color: "amber",
    checkpoints: [
      "Formal verification for core contracts",
      "ISO/IEC 42001 AI governance readiness",
      "SOC 2 Type II operational controls",
      "FIPS 140-3 cryptography alignment",
      "Common Criteria CC EAL4+ security target",
    ],
    money: "Enterprise trust unlocks larger API contracts, security budgets, white-label deployments, and strategic integrations.",
  },
  {
    id: "04",
    status: "NEXT",
    window: "Beyond 2027",
    title: "Multi-Chain Integrity Standard",
    focus: "Make TITAN PROTOCOL portable across the wider AI economy as a reusable integrity standard.",
    icon: Globe2,
    color: "blue",
    checkpoints: [
      "Omni-chain deployment for AI agents",
      "Autonomous red-teaming against marketplace modules",
      "Cross-chain proof memory and strategy graph",
      "RWA and institutional strategy verification",
      "Security standard for agentic finance products",
    ],
    money: "YieldBoost becomes licensable infrastructure that other chains, agents, products, and marketplaces can adopt.",
  },
];

const livePillars = [
  {
    label: "TITAN PROTOCOL marketplace",
    icon: Store,
    text: "The 10-layer stack is sold as modular APIs, SDKs, and fortress modules.",
  },
  {
    label: "Flagship showcase",
    icon: Rocket,
    text: "1-click Optimize proves the stack works as a complete mainnet product shell.",
  },
  {
    label: "10-layer core",
    icon: Layers,
    text: "TEE, ZK, memory, storage, governance, and ProofRegistry work together.",
  },
  {
    label: "Judge terminal",
    icon: ShieldCheck,
    text: "The live audit trail proves the stack is on-chain, reviewable, and integration-ready.",
  },
];

const productLines = [
  {
    label: "Marketplace revenue",
    icon: CircleDollarSign,
    text: "The API / SDK Marketplace is the core commercial surface: full stack, single layers, anti-sybil modules, and fortress rails.",
  },
  {
    label: "Developer revenue",
    icon: Database,
    text: "Modular Immunity Armory sells TITAN PROTOCOL as reusable developer infrastructure instead of one closed application.",
  },
  {
    label: "Proof-led sales",
    icon: ShieldCheck,
    text: "Judge Mode reduces adoption friction by proving that every security claim can be reviewed on-chain before purchase.",
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

export default async function JudgeRoadmapPage() {
  const data = await getJudgePageData();
  const latestDecision = data.latestProof?.decision;
  const liveIntegrityCount = data.integrityStackCards.filter(
    (card) => !["Pending", "0 entries"].includes(card.value),
  ).length;

  const proofSnapshot = [
    {
      label: "Proof runs",
      value: `${data.proofCount || (data.latestProof ? 1 : 0)}`,
      helper: "Live proof history visible from Judge Mode.",
    },
    {
      label: "APY route",
      value: latestDecision
        ? `${formatPercent(latestDecision.current_apy)} -> ${formatPercent(latestDecision.optimized_apy)}`
        : "Pending",
      helper: latestDecision?.recommended ?? "Latest route appears after a stored optimization.",
    },
    {
      label: "Integrity modules",
      value: `${liveIntegrityCount}/${data.integrityStackCards.length}`,
      helper: "Active 10-layer evidence modules currently visible.",
    },
    {
      label: "Network posture",
      value: "Mainnet-first",
      helper: "Vault and faucet remain public testnet challenge surfaces.",
    },
  ];

  const linkPillClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,221,208,0.32)] bg-[rgba(34,221,208,0.10)] px-3 py-1.5 text-[11px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.55)] hover:bg-[rgba(34,221,208,0.18)] hover:text-white";

  return (
    <section data-testid="judge-roadmap-page" className="space-y-3 p-[10px] md:space-y-4">
      <JudgeModeBootstrap />
      <JudgeSnapshotAutoRefresh />

      <header className="relative overflow-hidden rounded-[22px] border border-[rgba(34,221,208,0.18)] bg-[linear-gradient(135deg,rgba(34,221,208,0.14),rgba(255,255,255,0.03)_44%,rgba(47,224,109,0.08))] px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.85),transparent)]" />
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(300px,0.96fr)] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/judge" className={linkPillClass}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Judge
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(47,224,109,0.22)] bg-[rgba(47,224,109,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b8ffc8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#68ff7a] shadow-[0_0_14px_rgba(104,255,122,0.7)]" />
                Product roadmap
              </span>
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <Rocket className="h-3.5 w-3.5" />
              TITAN PROTOCOL first. Showcase second. Proof always on.
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[34px] font-semibold leading-[1.04] text-white md:text-[52px]">
              A 10-layer B2B integrity business with a live mainnet showcase.
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#d9e7ec]">
              YieldBoost sells TITAN PROTOCOL as modular infrastructure for Web3 AI agents. The 1-click dashboard is the flagship showcase proving the stack works on 0G Mainnet. The judge menu is the live audit terminal that turns trust into something buyers can verify.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              {[
                { v: "10", l: "Layers", c: "text-[#22ddd0]" },
                { v: "4", l: "Phases", c: "text-[#68ff7a]" },
                { v: "LIVE", l: "Phase 01", c: "text-[#f6c166]" },
                { v: "B2B", l: "Positioning", c: "text-[#63d8ff]" },
              ].map((m) => (
                <div key={m.l} className="text-center">
                  <div className={`text-[22px] font-bold leading-none ${m.c}`}>{m.v}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8ea1af]">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.10)] bg-[rgba(2,8,13,0.42)] p-3">
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
      </header>

      <section className="fade-in-up fade-in-up-1 yb-card rounded-[20px] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
              Live base
            </div>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight text-white">
              What already exists before the roadmap begins
            </h2>
          </div>
          <BrowserTimeLabel
            value={data.latestProof?.timestamp}
            prefix="Latest proof"
            emptyLabel="Latest proof pending"
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {proofSnapshot.map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-[16px] border border-[rgba(34,221,208,0.16)] bg-[linear-gradient(180deg,rgba(34,221,208,0.07),rgba(255,255,255,0.02))] px-4 py-4"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.7),transparent)]" />
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8ea1af]">
                {card.label}
              </div>
              <div className="mt-2 text-[24px] font-semibold leading-tight text-[#68ff7a]">
                {card.value}
              </div>
              <p className="mt-2 text-[12px] leading-6 text-[#dce5ec]">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {livePillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <div
                key={pillar.label}
                className="rounded-[15px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4"
              >
                <Icon className="h-5 w-5 text-[#9ff7f0]" />
                <h3 className="mt-3 text-[15px] font-semibold text-white">{pillar.label}</h3>
                <p className="mt-2 text-[12px] leading-6 text-[#dce5ec]">{pillar.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="fade-in-up fade-in-up-2 rounded-[18px] border border-[rgba(34,221,208,0.10)] bg-[rgba(34,221,208,0.025)] px-5 py-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          {phaseCards.map((phase, i) => {
            const isLive = phase.status === "LIVE";
            return (
              <div key={phase.id} className="flex items-center gap-3">
                {i > 0 && <div className={`h-px w-8 flex-none md:w-16 ${isLive ? "bg-[rgba(104,255,122,0.3)]" : "bg-[rgba(255,255,255,0.08)]"}`} />}
                <div className="flex flex-none flex-col items-center gap-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold ${
                    isLive
                      ? "border border-[rgba(47,224,109,0.35)] bg-[rgba(47,224,109,0.15)] text-[#68ff7a] shadow-[0_0_20px_rgba(47,224,109,0.15)]"
                      : "border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-[#8ea1af]"
                  }`}>
                    {phase.id}
                  </div>
                  <span className={`whitespace-nowrap text-[10px] font-semibold ${isLive ? "text-[#68ff7a]" : "text-[#8ea1af]"}`}>{phase.title}</span>
                  <span className="text-[9px] text-[#6b7a86]">{phase.window}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="fade-in-up fade-in-up-3 yb-card rounded-[20px] px-5 py-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
            Roadmap phases
          </div>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight text-white">
            Live foundation first, then the next expansion
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {phaseCards.map((phase) => {
            const Icon = phase.icon;
            const isLive = phase.status === "LIVE";

            return (
              <article
                key={phase.id}
                className={`overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,rgba(7,16,24,0.96),rgba(4,8,13,0.98))] ${
                  isLive
                    ? "border-[rgba(47,224,109,0.22)] shadow-[0_0_40px_rgba(47,224,109,0.06)]"
                    : "border-[rgba(34,221,208,0.14)]"
                }`}
              >
                <div className="border-b border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(34,221,208,0.16),transparent_32%)] px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
                        Phase {phase.id} / {phase.window}
                      </div>
                      <h3 className="mt-2 text-[22px] font-semibold leading-tight text-white">
                        {phase.title}
                      </h3>
                    </div>
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] border border-[rgba(34,221,208,0.20)] bg-[rgba(34,221,208,0.08)] text-[#9ff7f0]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    isLive
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
                        {isLive ? (
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
            );
          })}
        </div>
      </section>

      <section className="fade-in-up fade-in-up-4 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="yb-card rounded-[20px] px-5 py-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
            How it sells
          </div>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight text-white">
            Revenue is built into the architecture
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {productLines.map((line) => {
              const Icon = line.icon;

              return (
                <div
                  key={line.label}
                  className="rounded-[15px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4"
                >
                  <Icon className="h-5 w-5 text-[#9ff7f0]" />
                  <h3 className="mt-3 text-[15px] font-semibold text-white">{line.label}</h3>
                  <p className="mt-2 text-[12px] leading-6 text-[#dce5ec]">{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="yb-card rounded-[20px] px-5 py-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
            0G rails
          </div>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight text-white">
            The proof base layer stays 0G
          </h2>
          <div className="mt-5 grid gap-2">
            {proofRails.map((rail) => {
              const Icon = rail.icon;

              return (
                <div
                  key={rail.label}
                  className="flex items-center gap-3 rounded-[14px] border border-[rgba(34,221,208,0.12)] bg-[rgba(34,221,208,0.045)] px-4 py-3"
                >
                  <Icon className="h-4 w-4 text-[#9ff7f0]" />
                  <span className="text-[13px] font-semibold text-white">{rail.label}</span>
                  <span className="ml-auto text-[11px] text-[#8ea1af]">{rail.desc}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-[15px] border border-[rgba(47,224,109,0.18)] bg-[rgba(47,224,109,0.06)] px-4 py-4">
            <p className="text-[12px] leading-6 text-[#dff8e7]">
              Marketplace payments are native 0G. The $YA path is positioned as access, rewards, and future utility, not as a replacement for the current 0G-priced developer store.
            </p>
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-5 rounded-[20px] border border-[rgba(34,221,208,0.20)] bg-[linear-gradient(135deg,rgba(34,221,208,0.12),rgba(255,255,255,0.03)_48%,rgba(47,224,109,0.08))] px-5 py-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Remember
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-white md:text-[38px]">
            Marketplace first. Showcase second. Audit terminal always on.
          </h2>
          <p className="mt-4 text-[14px] leading-7 text-[#dce5ec]">
            The roadmap is one path: sell the 10-layer integrity stack, prove it through a live showcase, expose it through a judge-readable audit path, then scale into partner distribution, enterprise trust, and multi-chain adoption.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/agent" className={linkPillClass}>
              flagship showcase
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/dev/marketplace" className={linkPillClass}>
              API marketplace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/judge/project" className={linkPillClass}>
              Project brief
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="/pitchdeck/yieldboost-pitchdeck.html"
              target="_blank"
              rel="noreferrer"
              className={linkPillClass}
            >
              Pitch deck
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </section>
  );
}
