import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  Coins,
  Database,
  ExternalLink,
  Globe2,
  GitBranch,
  Landmark,
  Layers,
  LockKeyhole,
  Network,
  Orbit,
  Rocket,
  Scale,
  ShieldCheck,
  TrendingUp,
  Vault,
} from "lucide-react";
import JudgeModeBootstrap from "@/components/judge/JudgeModeBootstrap";
import JudgeSnapshotAutoRefresh from "@/components/judge/JudgeSnapshotAutoRefresh";
import BrowserTimeLabel from "@/components/judge/BrowserTimeLabel";
import { getJudgePageData } from "@/lib/server/review-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toneClass(tone: "teal" | "green" | "amber" | "white" = "white") {
  if (tone === "green") return "text-[#68ff7a]";
  if (tone === "amber") return "text-[#f6c166]";
  if (tone === "teal") return "text-[#22ddd0]";
  return "text-white";
}

function formatPercent(value: number | undefined) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "Pending";
}

const shippedCapabilities = [
  "0G Mainnet proof storage and ProofRegistry anchor path",
  "Judge Mode read-only wallet review with network switching",
  "Integrity memory stack: Sovereign Memory, blacklist, stress report, ZKR, governance, compliance, handshake",
  "Yield Strategy INFT and marketplace contracts surfaced for review",
  "Pitch deck, proof links, and evidence anchors available without wallet setup",
];

const roadmapPhases = [
  {
    phase: "Phase 1",
    date: "Q3 - Q4 2026",
    title: "The Integrity Genesis",
    quote: "Anchoring truth in the machine",
    icon: ShieldCheck,
    headline:
      "Turn today's proof trail into a rewardable integrity network for AI decisions.",
    items: [
      {
        title: "Neural Handshake mainnet expansion",
        body:
          "Move optimizer-auditor coordination from recorded artifacts into a permanent 0G Compute and 0G Storage coordination layer.",
      },
      {
        title: "$YA0G genesis incentives",
        body:
          "Launch an internal utility and reputation layer where approved Judge validations earn Proof of Integrity points before broader token mechanics.",
      },
      {
        title: "Sovereign Memory V3",
        body:
          "Upgrade memory from transaction recall into market-anomaly context that can rehydrate strategy decisions across sessions.",
      },
    ],
    money:
      "First revenue wedge: proof API access, audit dashboards for teams, and premium strategy-history exports.",
  },
  {
    phase: "Phase 2",
    date: "Q1 - Q2 2027",
    title: "The Quantum Liquidity Layer",
    quote: "Privacy is the ultimate alpha",
    icon: LockKeyhole,
    headline:
      "Use 0G Compute for private intent routing and programmable governance around capital movement.",
    items: [
      {
        title: "Sovereign ZK-DEX integration",
        body:
          "Prototype private, MEV-resistant intent routing with ZK-reasoning envelopes and slippage-aware execution controls.",
      },
      {
        title: "Institutional Guardian",
        body:
          "Open DAO and fund risk modules where risk bands, policy thresholds, and emergency actions are voted and verified on-chain.",
      },
      {
        title: "The Trinity Vaults",
        body:
          "Automated vaults that combine Memory, ZK, and Governance to detect exploit patterns, pause risky flows, and preserve capital discipline.",
      },
    ],
    money:
      "Second revenue wedge: Guardian subscriptions, vault management fees, and partner integrations for wallets and protocols.",
  },
  {
    phase: "Phase 3",
    date: "Q3 2027+",
    title: "Omniscient Orchestration",
    quote: "The rise of agent-led finance",
    icon: Orbit,
    headline:
      "Expand the proof graph across chains, assets, and real-world markets while keeping 0G as the source of truth.",
    items: [
      {
        title: "Cross-chain intelligence bridge",
        body:
          "Extend Sovereign Memory across Ethereum, Solana, Monad, and future 0G-native ecosystems with one reviewable strategy graph.",
      },
      {
        title: "$YA token generation event",
        body:
          "Graduate the internal incentive layer into governance for network economics, agent reputation, and protocol evolution.",
      },
      {
        title: "RWA Sovereign Bridge",
        body:
          "Bring real-world assets into AI yield strategies through mathematically verified collateral, pricing, and compliance artifacts.",
      },
    ],
    money:
      "Third revenue wedge: cross-chain proof licensing, RWA onboarding fees, and strategy adoption take-rates.",
  },
];

const revenueEngines = [
  {
    label: "Proof API",
    icon: Database,
    body:
      "Protocols pay to query verified strategy output, proof history, compliance status, and agent reputation.",
  },
  {
    label: "Guardian Enterprise",
    icon: Building2,
    body:
      "DAOs, funds, and treasuries subscribe to policy controls, audit trails, and governance modules.",
  },
  {
    label: "Strategy Marketplace",
    icon: TrendingUp,
    body:
      "YieldBoost takes a marketplace fee when proof-backed Strategy Agent NFTs are adopted or licensed.",
  },
  {
    label: "Trinity Vaults",
    icon: Vault,
    body:
      "Automated vault products can monetize through management, performance, or protocol integration fees.",
  },
  {
    label: "0G Compute Workflows",
    icon: BrainCircuit,
    body:
      "Premium private inference and ZK-reasoning runs become high-value compute jobs with durable storage output.",
  },
  {
    label: "RWA Bridge Fees",
    icon: Landmark,
    body:
      "Verified real-world asset strategy onboarding creates a path to institutional-grade fee capture.",
  },
];

const valueCaptureLayers = [
  {
    label: "Performance-based incentives",
    icon: TrendingUp,
    status: "Strong fit",
    body:
      "Yield-share model with a target 5% performance fee only on measured APY Lift, so entry can stay free while revenue aligns with user upside.",
    proof:
      "Best when tied to ProofRegistry records, before/after APY, wallet-scoped snapshots, and post-run integrity checks.",
  },
  {
    label: "B2B Integrity-as-a-Service",
    icon: Database,
    status: "Strong fit",
    body:
      "Package ZK-Reasoning, Sovereign Memory, blacklist checks, stress reports, and governance decisions as APIs for 0G ecosystem dApps.",
    proof:
      "This turns the current Judge evidence stack into plug-and-play trust infrastructure for teams that do not want to build it from zero.",
  },
  {
    label: "Premium utility layers",
    icon: Vault,
    status: "Fit with governance guardrails",
    body:
      "Use Strategy Agent NFTs as access passes for advanced models, curated strategies, Guardian controls, and future $YA fee discounts or voting rights.",
    proof:
      "Keep this framed as utility and governance access, not guaranteed yield access, until token and regulatory readiness are complete.",
  },
  {
    label: "0G Exchange and Intent Network",
    icon: Network,
    status: "High-upside expansion",
    body:
      "Future exchange layer where 0G Compute routes private intents, 0G Storage records execution proofs, and 0G Chain anchors settlement receipts.",
    proof:
      "Revenue can come from routing fees, institutional private execution lanes, proofed swap receipts, liquidity partner fees, and white-label exchange modules.",
  },
];

const valueCaptureAudit = [
  {
    label: "Yield-share model",
    verdict: "Use it",
    detail:
      "The 5% fee on APY Lift is a clean investor story because YieldBoost only earns from additional measured upside. Phrase it as a target model until contracts enforce fee accounting.",
  },
  {
    label: "Integrity API",
    verdict: "Use it heavily",
    detail:
      "This is the most defensible B2B revenue lane because it monetizes what the product already proves: ZKR, Sovereign Memory, audit evidence, and 0G-backed verification.",
  },
  {
    label: "NFT and $YA utility",
    verdict: "Use with guardrails",
    detail:
      "Great for retention and access tiers, but avoid promising high-risk or high-yield outcomes. Position NFTs as access, reputation, and governance utilities.",
  },
  {
    label: "0G exchange",
    verdict: "Add as Phase 2+",
    detail:
      "A private intent exchange fits the roadmap if it is described as slippage-aware, MEV-resistant, and proof-backed rather than zero-slippage or risk-free.",
  },
];

const zeroGLeverage = [
  {
    label: "0G Storage",
    icon: Database,
    body:
      "Stores proof payloads, memory snapshots, blacklist entries, stress reports, and future strategy graph state.",
  },
  {
    label: "0G Compute",
    icon: BrainCircuit,
    body:
      "Runs optimizer, auditor, private intent routing, exchange quote checks, governance, and future Guardian workflows with verifiable envelopes.",
  },
  {
    label: "0G Chain",
    icon: Network,
    body:
      "Anchors ProofRegistry, INFT, marketplace, blacklist, validation, and governance contracts into one audit path.",
  },
  {
    label: "0G as source of truth",
    icon: Globe2,
    body:
      "Keeps cross-chain decisions reviewable through a common proof layer instead of scattered dashboard state.",
  },
];

export default async function JudgeRoadmapPage() {
  const data = await getJudgePageData();
  const liveIntegrityCount = data.integrityStackCards.filter(
    (card) => !["Pending", "0 entries"].includes(card.value),
  ).length;
  const latestDecision = data.latestProof?.decision;

  const proofCards = [
    {
      label: "Proof history",
      value: `${data.proofCount || (data.latestProof ? 1 : 0)} run${
        data.proofCount === 1 ? "" : "s"
      }`,
      helper: data.latestProof?.timestamp
        ? "Latest proof timestamp is browser-localized below."
        : "No proof timestamp available yet.",
      tone: data.latestProof ? "green" : "amber",
    },
    {
      label: "APY thesis",
      value: latestDecision
        ? `${formatPercent(latestDecision.current_apy)} -> ${formatPercent(latestDecision.optimized_apy)}`
        : "Pending proof",
      helper: latestDecision?.recommended ?? "Route recommendation will appear after the latest proof.",
      tone: latestDecision ? "green" : "amber",
    },
    {
      label: "Integrity controls",
      value: `${liveIntegrityCount}/${data.integrityStackCards.length}`,
      helper: "Live evidence modules currently visible in Judge Mode.",
      tone: liveIntegrityCount ? "teal" : "amber",
    },
    {
      label: "Mainnet artifacts",
      value: `${data.deploymentArtifacts.length}`,
      helper: `${data.reviewNetworkLabel} contract and NFT artifacts are linked from Judge Mode.`,
      tone: data.deploymentArtifacts.length ? "white" : "amber",
    },
  ] satisfies Array<{
    label: string;
    value: string;
    helper: string;
    tone: "teal" | "green" | "amber" | "white";
  }>;

  const eyebrowClass =
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7e8d99]";
  const sectionTitleClass =
    "font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight text-white";
  const sectionHelperClass = "mt-1 text-[13px] leading-6 text-[#9faab6]";
  const sectionShellClass = "yb-card rounded-[20px] px-5 py-6";
  const subCardClass =
    "rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4";
  const linkPillClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,221,208,0.32)] bg-[rgba(34,221,208,0.10)] px-3 py-1.5 text-[11px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.55)] hover:bg-[rgba(34,221,208,0.18)] hover:text-white";

  return (
    <section data-testid="judge-roadmap-page" className="space-y-3 p-[10px] md:space-y-4">
      <JudgeModeBootstrap />
      <JudgeSnapshotAutoRefresh />

      <header className="relative overflow-hidden rounded-[20px] border border-[rgba(34,221,208,0.18)] bg-[linear-gradient(135deg,rgba(34,221,208,0.14),rgba(255,255,255,0.03)_42%,rgba(47,224,109,0.08))] px-5 py-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.85),transparent)]" />
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/judge" className={linkPillClass}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Judge
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(47,224,109,0.22)] bg-[rgba(47,224,109,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b8ffc8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#68ff7a] shadow-[0_0_14px_rgba(104,255,122,0.7)]" />
              Roadmap with proof-first milestones
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
            <div>
              <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
                <Rocket className="h-3.5 w-3.5" />
                YieldBoost AI Sovereign Strategy Roadmap
              </div>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-[34px] font-semibold leading-[1.04] text-white md:text-[52px]">
                From judge-verifiable AI yield to the 0G trust economy.
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#d9e7ec]">
                This is the 2026-2027 expansion plan: keep the current mainnet proof stack visible, then turn it into incentives, private liquidity, institutional controls, cross-chain memory, and RWA strategy adoption.
              </p>
            </div>

            <div className="rounded-[18px] border border-[rgba(255,255,255,0.10)] bg-[rgba(2,8,13,0.42)] px-4 py-4">
              <div className={eyebrowClass}>Judge lens</div>
              <div className="mt-3 text-[24px] font-semibold leading-tight text-white">
                What is live now vs. what becomes monetizable next.
              </div>
              <div className="mt-4 grid gap-2">
                {[
                  "Live evidence first: every future phase starts from current proof.",
                  "0G usage stays central: storage, compute, chain, and source-of-truth layer.",
                  "Revenue path is explicit: API, enterprise, marketplace, vaults, and RWA rails.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-[12px] leading-6 text-[#d6e2ea]">
                    <BadgeCheck className="mt-1 h-3.5 w-3.5 flex-none text-[#68ff7a]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={sectionShellClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={sectionTitleClass}>What already exists</h2>
            <p className={sectionHelperClass}>
              The roadmap starts from shipped evidence already visible in Judge Mode, then compounds from there.
            </p>
          </div>
          <BrowserTimeLabel
            value={data.latestProof?.timestamp}
            prefix="Latest proof recorded"
            emptyLabel="Latest proof timestamp pending"
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {proofCards.map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-[16px] border border-[rgba(34,221,208,0.16)] bg-[linear-gradient(180deg,rgba(34,221,208,0.07),rgba(255,255,255,0.02))] px-4 py-5"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.75),transparent)]" />
              <div className={eyebrowClass}>{card.label}</div>
              <div className={`mt-2 text-[24px] font-semibold leading-tight ${toneClass(card.tone)}`}>
                {card.value}
              </div>
              <div className="mt-3 text-[12px] leading-6 text-[#cdd7e0]">{card.helper}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {shippedCapabilities.map((item) => (
            <div key={item} className={`${subCardClass} flex items-start gap-3`}>
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#68ff7a]" />
              <span className="text-[12px] leading-6 text-[#dce5ec]">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionShellClass}>
        <div className="flex items-start gap-3">
          <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>2026-2027 sovereign roadmap</h2>
            <p className={sectionHelperClass}>
              Big vision, but staged like a product company: evidence, incentives, liquidity, governance, cross-chain expansion.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {roadmapPhases.map((phase, index) => {
            const Icon = phase.icon;

            return (
              <article
                key={phase.title}
                className="grid gap-4 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.28fr)]"
              >
                <div className="rounded-[15px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.055)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={eyebrowClass}>{phase.phase}</span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[10px] font-semibold text-[#d8e1e8]">
                      {phase.date}
                    </span>
                  </div>
                  <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(34,221,208,0.24),rgba(47,224,109,0.12))] text-[#9ff7f0]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-[24px] font-semibold leading-tight text-white">
                    {phase.title}
                  </h3>
                  <p className="mt-2 text-[13px] font-semibold text-[#9ff7f0]">{phase.quote}</p>
                  <p className="mt-4 text-[13px] leading-6 text-[#d7e0e8]">{phase.headline}</p>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    {phase.items.map((item) => (
                      <div key={item.title} className={subCardClass}>
                        <div className="text-[15px] font-semibold leading-tight text-white">
                          {item.title}
                        </div>
                        <p className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{item.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[rgba(47,224,109,0.18)] bg-[rgba(47,224,109,0.055)] px-4 py-4">
                    <div>
                      <div className={eyebrowClass}>Money path {index + 1}</div>
                      <div className="mt-1 text-[13px] leading-6 text-[#dff8e7]">{phase.money}</div>
                    </div>
                    <CircleDollarSign className="h-5 w-5 text-[#68ff7a]" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={sectionShellClass}>
        <div className="flex items-start gap-3">
          <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>Revenue engines</h2>
            <p className={sectionHelperClass}>
              Where the roadmap becomes a business, not only a technical showcase.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {revenueEngines.map((engine) => {
            const Icon = engine.icon;

            return (
              <div key={engine.label} className={subCardClass}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[rgba(34,221,208,0.16)] bg-[rgba(34,221,208,0.07)] text-[#9ff7f0]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-[15px] font-semibold text-white">{engine.label}</div>
                </div>
                <p className="mt-3 text-[12px] leading-6 text-[#cdd7e0]">{engine.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section data-testid="roadmap-value-capture" className={sectionShellClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className={sectionTitleClass}>Value capture layer</h2>
              <p className={sectionHelperClass}>
                Sustainability plan for turning proof-backed yield intelligence into durable revenue.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[rgba(47,224,109,0.22)] bg-[rgba(47,224,109,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b8ffc8]">
            Building a protocol that lasts
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {valueCaptureLayers.map((layer) => {
            const Icon = layer.icon;

            return (
              <div
                key={layer.label}
                className="relative overflow-hidden rounded-[16px] border border-[rgba(47,224,109,0.16)] bg-[linear-gradient(180deg,rgba(47,224,109,0.065),rgba(255,255,255,0.02))] px-4 py-4"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(47,224,109,0.68),transparent)]" />
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-5 w-5 flex-none text-[#68ff7a]" />
                  <span className="rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.035)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#d8e1e8]">
                    {layer.status}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold leading-tight text-white">
                  {layer.label}
                </h3>
                <p className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{layer.body}</p>
                <div className="mt-3 rounded-[12px] border border-[rgba(34,221,208,0.12)] bg-[rgba(34,221,208,0.045)] px-3 py-3 text-[11px] leading-5 text-[#d9eef0]">
                  {layer.proof}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4">
          <div className="flex items-center gap-2 text-[#9ff7f0]">
            <Scale className="h-4 w-4" />
            <span className={eyebrowClass}>Fit audit</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {valueCaptureAudit.map((item) => (
              <div key={item.label} className="rounded-[13px] border border-[rgba(255,255,255,0.07)] bg-[rgba(2,8,13,0.32)] px-3 py-3">
                <div className="text-[14px] font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#68ff7a]">
                  {item.verdict}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[#cdd7e0]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionShellClass}>
        <div className="flex items-start gap-3">
          <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>0G advantage</h2>
            <p className={sectionHelperClass}>
              The roadmap keeps 0G as the execution, memory, and verification base layer.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {zeroGLeverage.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className={subCardClass}>
                <Icon className="h-5 w-5 text-[#9ff7f0]" />
                <div className="mt-3 text-[15px] font-semibold text-white">{item.label}</div>
                <p className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[20px] border border-[rgba(34,221,208,0.20)] bg-[linear-gradient(135deg,rgba(34,221,208,0.12),rgba(255,255,255,0.03)_48%,rgba(47,224,109,0.08))] px-5 py-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
            <Scale className="h-3.5 w-3.5" />
            Forward-looking, proof-grounded
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-white md:text-[38px]">
            We do not build another app. We build the infrastructure of trust for agent-led finance.
          </h2>
          <p className="mt-4 text-[13px] leading-7 text-[#cdd7e0]">
            The roadmap is ambitious by design, but the first proof is already inspectable: Judge Mode, 0G artifacts, storage CIDs, ProofRegistry anchors, and the integrity memory package are live review surfaces today. Building a protocol that does not just work, but lasts.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/judge" className={linkPillClass}>
              Review live evidence
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="/pitchdeck/yieldboost-pitchdeck.html"
              target="_blank"
              rel="noreferrer"
              className={linkPillClass}
            >
              Open pitch deck
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </section>
  );
}
