import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ExternalLink,
  FileText,
  ShieldCheck,
  Sword,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const metrics = [
  { value: "10", label: "Security layers", accent: "text-[#22ddd0]" },
  { value: "B2B", label: "Primary market", accent: "text-[#68ff7a]" },
  { value: "LIVE", label: "Mainnet first", accent: "text-[#f6c166]" },
  { value: "API", label: "Marketplace core", accent: "text-[#63d8ff]" },
];

const scanFlow = [
  { num: "01", title: "Developers buy", body: "The store sells the full stack, selected layers, and fortress modules.", accent: "text-[#22ddd0]" },
  { num: "02", title: "Showcase proves", body: "1-click Optimize proves the same engine can become a real mainnet product.", accent: "text-[#68ff7a]" },
  { num: "03", title: "Audit closes trust", body: "The live proof console lets buyers inspect the stack before adoption.", accent: "text-[#f6c166]" },
];

const archFlow = [
  { icon: Boxes, label: "API / SDK" },
  { icon: Zap, label: "Agent Product" },
  { icon: ShieldCheck, label: "TITAN" },
  { icon: Boxes, label: "0G Proof" },
  { icon: TrendingUp, label: "Revenue" },
];

const userSegments = [
  {
    title: "Agent Builders",
    icon: Boxes,
    body: "Teams that need modular execution security, proof storage, anti-hallucination controls, and enterprise-grade auditability without rebuilding trust rails from scratch.",
  },
  {
    title: "Enterprise Security Buyers",
    icon: ShieldCheck,
    body: "Companies that need on-chain proof, controlled execution, and developer tooling they can buy as infrastructure instead of trusting opaque AI middleware.",
  },
];

const surfaces = [
  {
    title: "API / SDK Security Store",
    icon: Boxes,
    network: "Mainnet live",
    body: "TITAN X, selected verification layers, fortress modules, and partner wrappers — sold as modular infrastructure products through the YieldBoost AI Protocol store.",
    why: "This is the engine and revenue core: the stack is bought by developers, not hidden behind one app.",
    href: "/dev/marketplace",
    label: "Open store",
  },
  {
    title: "1-Click Optimize Showcase",
    icon: Wallet,
    network: "Mainnet live",
    body: "A flagship shell that wraps the TITAN X 10-layer core into a working mainnet product with one wallet action.",
    why: "It proves the SDK can become a usable business surface, not just a backend promise.",
    href: "/agent",
    label: "Open flagship showcase",
  },
  {
    title: "Interactive Judge Menu",
    icon: ShieldCheck,
    network: "Mainnet live",
    body: "A live audit terminal exposing proof, storage, policy, registry, and continuity evidence for the latest stack execution.",
    why: "Developers buy faster when the security claim is independently reviewable on-chain.",
    href: "/judge",
    label: "Open judge terminal",
  },
  {
    title: "Public Challenge Vault",
    icon: Sword,
    network: "Testnet challenge",
    body: "Security claim turned into a public challenge where selected protections are attacked and observed in public.",
    why: "Challenge traffic hardens the story without changing the main B2B narrative.",
    href: "/vault",
    label: "Open vault",
  },
];

const linkPill = "inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,221,208,0.32)] bg-[rgba(34,221,208,0.10)] px-4 py-2 text-[12px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.55)] hover:bg-[rgba(34,221,208,0.18)] hover:text-white";

export default function JudgeProjectBriefPage() {
  return (
    <div className="min-h-screen bg-[#04070c] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:gap-6 md:px-8 md:py-10">

        {/* ── Hero + Metrics ────────────────────────── */}
        <header className="fade-in-up relative overflow-hidden rounded-[28px] border border-[rgba(34,221,208,0.14)] bg-[radial-gradient(circle_at_top_left,rgba(34,221,208,0.14),transparent_32%),linear-gradient(180deg,rgba(9,16,24,0.96),rgba(4,8,13,0.98))] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.36)] md:px-8 md:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.85),transparent)]" />
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/judge" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[12px] font-medium text-[#d8e1e8] transition hover:border-[rgba(34,221,208,0.28)] hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5 text-[#22ddd0]" />
              Back to judge
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ff7f0]">
              <FileText className="h-3.5 w-3.5" />
              30-second product brief
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl text-[28px] font-semibold leading-[1.12] text-white md:text-[44px]">
            The store sells it. TITAN X proves it. Audit closes trust.
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#d8e5ed] md:text-[16px]">
            YieldBoost AI is a B2B infrastructure company on 0G. YieldBoost AI Protocol is the platform and commercial store. TITAN X is the flagship 10-layer product. The audit console proves the claims are real.
          </p>
          <div className="mt-5 rounded-[18px] border border-[rgba(34,221,208,0.14)] bg-[rgba(34,221,208,0.05)] px-4 py-4 md:max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ff7f0]">Read this in 30 seconds</p>
            <div className="mt-3 space-y-2 text-[14px] leading-7 text-[#dce5ec]">
              <p><strong className="text-white">What is the business?</strong> A store that sells a 10-layer integrity stack as modular API / SDK infrastructure.</p>
              <p><strong className="text-white">What is TITAN X?</strong> The flagship 10-layer product proving the engine works as a real secure application.</p>
              <p><strong className="text-white">Why keep audit live?</strong> Because infrastructure buyers adopt faster when proof is inspectable instead of promised.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-center md:px-4">
                <div className={`text-[28px] font-bold leading-none ${m.accent}`}>{m.value}</div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8ea1af]">{m.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Scan Flow 01/02/03 ────────────────────── */}
        <section className="fade-in-up fade-in-up-1 grid gap-3 md:gap-4 lg:grid-cols-3">
          {scanFlow.map((item) => (
            <article key={item.num} className="relative overflow-hidden rounded-[20px] border border-[rgba(34,221,208,0.16)] bg-[linear-gradient(180deg,rgba(34,221,208,0.07)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.7),transparent)]" />
              <div className={`text-[28px] font-bold leading-none ${item.accent}`}>{item.num}</div>
              <h2 className="mt-2 text-[17px] font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{item.body}</p>
            </article>
          ))}
        </section>

        {/* ── Architecture Flow ─────────────────────── */}
        <section className="fade-in-up fade-in-up-2 rounded-[22px] border border-[rgba(34,221,208,0.12)] bg-[rgba(34,221,208,0.03)] px-5 py-6">
          <div className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">How it flows</div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:gap-5">
            {archFlow.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-3 md:gap-5">
                  {i > 0 && <ArrowRight className="h-4 w-4 text-[rgba(34,221,208,0.45)]" />}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#dce5ec]">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Problem → Solution ────────────────────── */}
        <section className="fade-in-up fade-in-up-3 grid gap-3 md:gap-4 md:grid-cols-2">
          <article className="rounded-[22px] border border-[rgba(246,193,102,0.16)] bg-[rgba(246,193,102,0.04)] px-5 py-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f6c166]">The Problem</div>
            <p className="mt-3 text-[14px] leading-7 text-[#dce5ec]">
              Web3 AI agents are getting better at generating actions, but the market still secures them with too few layers. One tool blocks bots. Another screens wallets. Another audits after launch. The rest of the stack stays exposed to hallucinations, hostile traffic, weak proof paths, and post-hack regret.
            </p>
          </article>
          <article className="rounded-[22px] border border-[rgba(104,255,122,0.16)] bg-[rgba(104,255,122,0.04)] px-5 py-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#68ff7a]">The Solution</div>
            <p className="mt-3 text-[14px] leading-7 text-[#dce5ec]">
              YieldBoost AI solves that by selling YieldBoost AI Protocol: a 10-layer modular integrity platform on 0G with secure execution, proof storage, governance, sovereign memory, and AWS Nitro Enclaves continuity. TITAN X exists to prove the stack works as a real product shell before buyers embed it into their own products.
            </p>
          </article>
        </section>

        {/* ── User Segments ─────────────────────────── */}
        <section className="fade-in-up fade-in-up-4 grid gap-3 md:gap-4 lg:grid-cols-2">
          {userSegments.map((segment) => {
            const Icon = segment.icon;
            return (
              <article key={segment.title} className="rounded-[22px] border border-[rgba(34,221,208,0.14)] bg-[rgba(34,221,208,0.045)] px-5 py-5 shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ff7f0]">Who buys this infrastructure</div>
                </div>
                <h2 className="mt-3 text-[20px] font-semibold text-white">{segment.title}</h2>
                <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{segment.body}</p>
              </article>
            );
          })}
        </section>

        {/* ── Product Surfaces ──────────────────────── */}
        <section className="fade-in-up fade-in-up-5 rounded-[28px] border border-[rgba(34,221,208,0.12)] bg-[linear-gradient(180deg,rgba(7,13,20,0.96),rgba(5,8,12,0.98))] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:px-8 md:py-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] border border-[rgba(34,221,208,0.2)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[22px] font-semibold text-white md:text-[28px]">Four product surfaces</h2>
              <p className="mt-1 text-[14px] leading-7 text-[#d3dde6]">One 10-layer infrastructure engine, four ways it reaches buyers, builders, and reviewers.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {surfaces.map((surface) => {
              const Icon = surface.icon;
              return (
                <article key={surface.title} className="group rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5 transition hover:border-[rgba(34,221,208,0.18)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[17px] font-semibold text-white">{surface.title}</h3>
                        <span className="rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ff7f0]">{surface.network}</span>
                      </div>
                      <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">{surface.body}</p>
                      <div className="mt-2 flex items-start gap-2">
                        <ArrowRight className="mt-1 h-3.5 w-3.5 flex-none text-[#9ff7f0]" />
                        <p className="text-[13px] leading-6 text-[#9ff7f0]">{surface.why}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pl-[52px]">
                    <Link href={surface.href} className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.06)] px-3 py-2 text-[12px] font-medium text-[#dff9f6] transition hover:border-[rgba(34,221,208,0.34)] hover:text-white">
                      {surface.label}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 rounded-[18px] border border-[rgba(246,193,102,0.18)] bg-[rgba(246,193,102,0.05)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6c166]">Network honesty</p>
            <p className="mt-2 text-[14px] leading-7 text-[#dce5ec]">
              The store, flagship showcase, and judge terminal are the real mainnet product story. Public challenge surfaces stay testnet so outside testers can attack the system without distorting the B2B infrastructure narrative.
            </p>
          </div>
        </section>

        {/* ── CTA Footer ───────────────────────────── */}
        <section className="fade-in-up fade-in-up-6 rounded-[22px] border border-[rgba(34,221,208,0.20)] bg-[linear-gradient(135deg,rgba(34,221,208,0.10),rgba(255,255,255,0.03)_48%,rgba(47,224,109,0.06))] px-5 py-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Remember
          </div>
          <h2 className="mt-4 text-[24px] font-semibold leading-tight text-white md:text-[32px]">
            Infrastructure first. Showcase second. Audit always on.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-[#dce5ec]">
            0G gives YieldBoost AI Protocol its compute, storage, and proof anchor spine — turning AI-agent trust into a modular B2B product that can be sold, audited, and embedded across many businesses.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/judge" className={linkPill}>
              Judge mode <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/judge/roadmap" className={linkPill}>
              Roadmap <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a href="/pitchdeck/yieldboost-pitchdeck.html" target="_blank" rel="noreferrer" className={linkPill}>
              Pitch deck <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
