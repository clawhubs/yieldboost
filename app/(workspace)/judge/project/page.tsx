import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ExternalLink,
  FileText,
  Flame,
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
  { value: "4", label: "Product surfaces", accent: "text-[#68ff7a]" },
  { value: "LIVE", label: "Mainnet first", accent: "text-[#f6c166]" },
  { value: "0G", label: "Native infra", accent: "text-[#63d8ff]" },
];

const scanFlow = [
  { num: "01", title: "Users optimize", body: "1-click turns idle balances into proof-backed yield routes.", accent: "text-[#68ff7a]" },
  { num: "02", title: "Developers buy", body: "10-layer stack sold as modular APIs — full package or single layers.", accent: "text-[#22ddd0]" },
  { num: "03", title: "Public tests", body: "Vault and faucet let anyone stress-test the protection model.", accent: "text-[#f6c166]" },
];

const archFlow = [
  { icon: Wallet, label: "Wallet" },
  { icon: Zap, label: "AI Agent" },
  { icon: ShieldCheck, label: "10-Layer Stack" },
  { icon: Boxes, label: "0G Proof" },
  { icon: TrendingUp, label: "Revenue" },
];

const userSegments = [
  {
    title: "Lazy Degens",
    icon: Zap,
    body: "Crypto users with idle assets who skip DeFi complexity. One click turns the mess into a route.",
  },
  {
    title: "Paranoid Investors",
    icon: ShieldCheck,
    body: "Want yield but need proof it's safe. 10-layer evidence and 0G anchoring make the recommendation feel protected.",
  },
];

const surfaces = [
  {
    title: "1-Click Optimize",
    icon: Wallet,
    network: "Mainnet live",
    body: "Connect wallet → click optimize → get a proof-backed yield route for idle balances.",
    why: "Less manual DeFi, more capital at work, proof trail behind every recommendation.",
    href: "/agent",
    label: "Open boost flow",
  },
  {
    title: "API / SDK Security Store",
    icon: Boxes,
    network: "Mainnet live",
    body: "Full 10-layer stack, single layers, or partner wrappers like VeilSolver — sold as API products.",
    why: "Same protection securing YieldBoost becomes sellable infrastructure revenue.",
    href: "/dev/marketplace",
    label: "Open marketplace",
  },
  {
    title: "Live Challenge Vault",
    icon: Sword,
    network: "Testnet challenge",
    body: "Security claim turned into a public challenge. Testnet-scoped seal and challenge flow.",
    why: "Security is stronger when people can try to break it.",
    href: "/vault",
    label: "Open vault",
  },
  {
    title: "Anti-Sybil Faucet",
    icon: Flame,
    network: "Testnet example",
    body: "Airdrop-style surface with anti-sybil logic, Alibaba fingerprinting, and proof-aware abuse resistance.",
    why: "Block abuse, keep real users, turn claim logic into a sellable module.",
    href: "/faucet",
    label: "Open faucet",
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
            Idle crypto → protected yield routes → sellable security APIs.
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#d8e5ed] md:text-[16px]">
            1-click optimizer protected by a 10-layer stack on 0G — TEE, ZK, Storage, ProofRegistry, integrity memory, and AWS Nitro Enclaves. The same protection is sold as developer APIs and stress-tested in public.
          </p>
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
              Many wallets hold idle crypto, but DeFi is noisy, risky, and easy to manipulate. The hard part is not only finding yield — it&apos;s making the route safe enough to trust.
            </p>
          </article>
          <article className="rounded-[22px] border border-[rgba(104,255,122,0.16)] bg-[rgba(104,255,122,0.04)] px-5 py-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#68ff7a]">The Solution</div>
            <p className="mt-3 text-[14px] leading-7 text-[#dce5ec]">
              YieldBoost AI gives users a 1-click optimizer and protects the result with a 10-layer stack on 0G: TEE, ZK proofing, 0G Storage, ProofRegistry anchoring, integrity memory, and AWS Nitro Enclaves.
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
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ff7f0]">Who 1-click is for</div>
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
              <p className="mt-1 text-[14px] leading-7 text-[#d3dde6]">One 10-layer stack, four ways it reaches the market.</p>
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
              The optimizer and API marketplace are mainnet product surfaces. The vault and faucet remain testnet challenge and example flows, while reusing the same broader security design.
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
            User product first. Security business second. All on 0G.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-[#dce5ec]">
            0G gives the stack its proof storage, compute path, and anchor surface — turning AI finance into something reviewable, portable, monetizable, and harder to fake.
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
