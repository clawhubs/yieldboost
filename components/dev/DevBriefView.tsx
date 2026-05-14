import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Building2,
  FileText,
  Rocket,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

const metrics = [
  { value: "10", label: "Security layers", accent: "text-[#72f3c7]" },
  { value: "B2B", label: "Primary market", accent: "text-[#68ff7a]" },
  { value: "LIVE", label: "Mainnet first", accent: "text-[#f6c166]" },
  { value: "API", label: "Store core", accent: "text-[#63d8ff]" },
];

const scanFlow = [
  {
    num: "01",
    title: "Developers buy",
    body: "The store sells the full stack, selected layers, anti-sybil APIs, fortress modules, and partner wrappers.",
    accent: "text-[#72f3c7]",
  },
  {
    num: "02",
    title: "Showcase proves",
    body: "The 1-Click app proves the same engine can become a real secure mainnet product.",
    accent: "text-[#68ff7a]",
  },
  {
    num: "03",
    title: "Verification closes trust",
    body: "The verification console lets buyers inspect the proof trail before they adopt the protocol.",
    accent: "text-[#f6c166]",
  },
];

const productSurfaces = [
  {
    title: "TITAN X Full 10-Layer API",
    icon: ShieldCheck,
    network: "Mainnet live",
    body: "The flagship full-stack product: one endpoint for blacklist, auditor, secure compute, memory, 0G storage proof, ZK proof, ProofRegistry anchor, governance, handshake, and AWS Nitro Enclaves.",
    why: "This is the core SKU for teams that want the whole protocol instead of rebuilding trust rails from scratch.",
    href: "/dev/marketplace/military-grade-full",
    label: "Open TITAN X",
  },
  {
    title: "TITAN X Showcase App",
    icon: Wallet,
    network: "Mainnet live",
    body: "A flagship shell that wraps the same engine into a working mainnet product with one wallet action.",
    why: "It proves YieldBoost AI Protocol can power a secure business surface instead of staying hidden as a backend claim.",
    href: "https://yieldboostai.xyz/",
    label: "Open showcase",
    external: true,
  },
  {
    title: "Verification Console",
    icon: FileText,
    network: "Mainnet live",
    body: "A live audit surface exposing proof, storage, policy, registry, and continuity evidence for the latest stack execution.",
    why: "Infrastructure buyers adopt faster when every security claim is independently reviewable.",
    href: "/dev/audit",
    label: "Open verification",
  },
  {
    title: "Store Modules",
    icon: Boxes,
    network: "Mainnet live",
    body: "The anti-sybil perimeter, AWS Nitro fortress module, and selected partner wrappers are sold beside TITAN X in the same store.",
    why: "This is where YieldBoost AI Protocol becomes a real business, not just one dashboard.",
    href: "/dev/marketplace",
    label: "Open store",
  },
];

const buyerSegments = [
  {
    title: "Agent Builders",
    icon: Boxes,
    body: "Teams that need modular execution security, proof storage, anti-hallucination controls, and auditability without rebuilding trust systems from zero.",
  },
  {
    title: "Enterprise Security Buyers",
    icon: Building2,
    body: "Companies that need controlled execution, on-chain proof, and reusable developer tooling they can buy as infrastructure.",
  },
];

export default function DevBriefView() {
  return (
    <DeveloperPortalShell
      eyebrow="YieldBoost AI Protocol Brief"
      title="The store sells it. TITAN X proves it. Verification closes trust."
      description="YieldBoost AI is the company. YieldBoost AI Protocol is the platform. TITAN X is the flagship full-stack product sold through the store."
    >
      <section className="glow-card fade-in-up fade-in-up-1 p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
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
              30-second read
            </div>
            <h2 className="mt-4 text-[30px] font-extrabold tracking-tight text-white md:text-[38px]">
              One protocol business. One flagship product. One proof path.
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#d0dde8]">
              YieldBoost AI is a B2B infrastructure company on 0G. YieldBoost AI Protocol is the commercial platform. TITAN X is the flagship full-stack product. The 1-Click app proves commercial usability. The verification console proves the claims are real.
            </p>
            <div className="mt-5 rounded-2xl border border-[rgba(0,201,177,0.14)] bg-[rgba(0,201,177,0.04)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Read this in 30 seconds</p>
              <div className="mt-3 space-y-2 text-[14px] leading-7 text-[#dce5ec]">
                <p><strong className="text-white">What is being sold?</strong> YieldBoost AI Protocol as modular API / SDK infrastructure.</p>
                <p><strong className="text-white">What proves it works?</strong> TITAN X, the live flagship product running on the same engine.</p>
                <p><strong className="text-white">What proves it is real?</strong> The verification console, with proof, storage, policy, and continuity evidence.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dev/marketplace" className="yb-teal-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-950">
                Open store
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dev/audit"
                className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)] px-5 py-3 text-[14px] font-bold text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
              >
                Open verification
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-center"
              >
                <div className={`text-[28px] font-bold leading-none ${metric.accent}`}>{metric.value}</div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8ea1af]">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-2 grid gap-4 lg:grid-cols-3">
        {scanFlow.map((item) => (
          <article
            key={item.num}
            className="glow-card overflow-hidden p-5"
          >
            <div className={`text-[28px] font-bold leading-none ${item.accent}`}>{item.num}</div>
            <h3 className="mt-2 text-[18px] font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="fade-in-up fade-in-up-3 grid gap-4 lg:grid-cols-2">
        <article className="glow-card p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#f6c166]">The Market Gap</p>
          <h3 className="mt-2 text-[24px] font-extrabold tracking-tight text-white">
            Most Web3 security products still cover only one or two layers.
          </h3>
          <p className="mt-3 text-[14px] leading-7 text-[#dce5ec]">
            One product may block bots. Another may add wallet screening. Another may monitor after launch. But AI hallucination, proof integrity, sovereign memory, storage continuity, secure execution, and auditability still end up split across too many weak pieces.
          </p>
        </article>
        <article className="glow-card p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Why Now</p>
          <h3 className="mt-2 text-[24px] font-extrabold tracking-tight text-white">
            Most teams invest in security after the exploit, not before the product scales.
          </h3>
          <p className="mt-3 text-[14px] leading-7 text-[#dce5ec]">
            Wallet abuse, unsafe signatures, hostile traffic, and hallucinated agent outputs are already part of the daily Web3 operating environment. YieldBoost AI Protocol exists because trust cannot stay a post-launch patch while AI agents become economic actors.
          </p>
        </article>
      </section>

      <section className="fade-in-up fade-in-up-4">
        <div className="mb-5 max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Product surfaces</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
            Four visible surfaces. One commercial story.
          </h2>
          <p className="mt-2 text-[14px] leading-7 text-[#c8dae6]">
            The store is the business surface. TITAN X is the flagship SKU. The 1-Click app is the proof shell. The verification console removes trust ambiguity.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {productSurfaces.map((surface) => (
            <article key={surface.title} className="glow-card p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)]">
                  <surface.icon className="h-4.5 w-4.5 text-[#72f3c7]" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[18px] font-bold text-white">{surface.title}</h3>
                    <span className="rounded-full border border-[rgba(255,214,102,0.26)] bg-[rgba(255,214,102,0.08)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffd666]">
                      {surface.network}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{surface.body}</p>
                  <p className="mt-2 text-[13px] leading-6 text-[#9ff7f0]">{surface.why}</p>
                </div>
              </div>
              <div className="mt-4 pl-[52px]">
                <Link
                  href={surface.href}
                  target={surface.external ? "_blank" : undefined}
                  rel={surface.external ? "noreferrer" : undefined}
                  className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
                >
                  {surface.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fade-in-up fade-in-up-5 grid gap-4 lg:grid-cols-2">
        {buyerSegments.map((segment) => (
          <article key={segment.title} className="glow-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)]">
                <segment.icon className="h-4.5 w-4.5 text-[#72f3c7]" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">
                Who buys this
              </div>
            </div>
            <h3 className="mt-3 text-[22px] font-bold text-white">{segment.title}</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{segment.body}</p>
          </article>
        ))}
      </section>

      <section className="glow-card fade-in-up fade-in-up-6 p-6 text-center md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.24)] bg-[rgba(0,201,177,0.08)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ff7ea]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Remember
        </div>
        <h2 className="mt-4 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
          The dashboard is proof. The store is the business.
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-[14px] leading-7 text-[#dce5ec]">
          YieldBoost AI Protocol exists to turn AI-agent trust into modular infrastructure. TITAN X is the flagship full-stack product. The 1-Click app is the easiest way to watch YieldBoost AI Protocol work live on mainnet before a buyer adopts it.
        </p>
      </section>
    </DeveloperPortalShell>
  );
}
