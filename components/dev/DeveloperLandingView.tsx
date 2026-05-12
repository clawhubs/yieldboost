import Link from "next/link";
import {
  ArrowRight,
  Check,
  Fingerprint,
  Gauge,
  KeyRound,
  Lock,
  Radar,
  ShieldCheck,
  Zap,
} from "lucide-react";

import DevPortalAccessCard from "@/components/dev/DevPortalAccessCard";
import DevPlanActionButton from "@/components/dev/DevPlanActionButton";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import { getDevPortalSetupState } from "@/lib/dev-portal";
import { YA_API_PLANS } from "@/lib/ya-api-plans";

const layers = [
  { id: "L1", label: "Hallucination Blacklist", sub: "Hostile prompt rejection" },
  { id: "L2", label: "Integrity Auditor", sub: "Deterministic payload checks" },
  { id: "L3", label: "Secure Compute / TEE", sub: "Isolated secure execution" },
  { id: "L4", label: "Sovereign Memory", sub: "State without secret leakage" },
  { id: "L5", label: "0G Storage Proof Layer", sub: "Proof payload stored on 0G" },
  { id: "L6", label: "Zero-Knowledge Proof Layer", sub: "Integrity commitments" },
  { id: "L7", label: "ProofRegistry Anchor", sub: "On-chain proof trail" },
  { id: "L8", label: "Programmable Governance", sub: "Policy and safety gates" },
  { id: "L9", label: "Cross-Agent Neural Handshake", sub: "Audit-ready closure logs" },
];

const productRails = [
  {
    title: "Full 9-layer core",
    status: "Mainnet live",
    body: "One endpoint for the whole YieldBoost stack: TEE, ZK, 0G Storage, ProofRegistry, governance, and memory.",
    endpoint: "/api/dev/store/military-grade",
    href: "/dev/marketplace/military-grade-full",
    icon: ShieldCheck,
  },
  {
    title: "AWS Nitro Fortress SDK",
    status: "Mainnet live",
    body: "Nitro enclave framing, 0G TEE badge evidence, and 0G Storage incident memory in one fortress module.",
    endpoint: "/api/dev/store/aws-nitro-fortress",
    href: "/dev/marketplace/aws-nitro-fortress",
    icon: Lock,
  },
  {
    title: "Partner secure wrapper",
    status: "Selected wrapper",
    body: "VeilSolver is sold as a wrapped partner path with isolated execution, response envelope, and 0G anchor.",
    endpoint: "/api/dev/store/veilsolver",
    href: "/dev/marketplace/veilsolver",
    icon: KeyRound,
  },
  {
    title: "Anti-sybil perimeter",
    status: "Mainnet live",
    body: "Wallet screening, deterministic throttling, Alibaba fingerprinting, and a ZK verdict path for real abuse defense.",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
    href: "/dev/marketplace/anti-sybil-zk-fingerprint",
    icon: Fingerprint,
  },
];

export default function DeveloperLandingView({
  session,
}: {
  session: {
    walletAddress: string;
    role: "owner" | "developer";
  } | null;
}) {
  const setup = getDevPortalSetupState();

  return (
    <DeveloperPortalShell
      eyebrow="Dev Portal"
      title="Mainnet API products for proof-backed AI finance."
      description="Buy the full 9-layer YieldBoost core, selected partner wrappers, anti-sybil gates, and the new AWS Nitro fortress module from one developer armory."
    >
      {/* ── HERO PANEL ────────────────────────────────────── */}
      <section className="hero-panel fade-in-up fade-in-up-1 p-6 md:p-10">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] px-4 py-1.5">
              <Fingerprint className="h-4 w-4 text-[#72f3c7]" />
              <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#8ff7ea]">Mainnet API Armory</span>
            </div>
            <h2 className="shimmer-text mt-6 text-[32px] font-extrabold leading-[1.08] tracking-tight md:text-[46px] lg:text-[54px]">
              One store for the 9&#8209;layer core, partner wrappers, and enclave&#8209;grade security modules.
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-8 text-[#d0dde8] md:text-[17px]">
              YieldBoost does not just sell one security rail. Developers can buy the full 9-layer military-grade endpoint, selected partner wrappers like VeilSolver, the anti-sybil screening gate, and the new AWS Nitro fortress SDK with 0G Storage memory and a 0G TEE badge.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dev/marketplace" className="yb-teal-button inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-[15px] font-bold text-slate-950">
                Open marketplace
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link href="#api-packages" className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-6 py-3.5 text-[15px] font-bold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)]">
                Choose package
              </Link>
              <Link href="/dev/docs" className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-6 py-3.5 text-[15px] font-bold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)]">
                Read Docs
              </Link>
            </div>
          </div>

          {/* Mini 9-layer vertical rail in hero */}
          <div className="w-full max-w-[320px] shrink-0 rounded-2xl border border-[rgba(0,201,177,0.12)] bg-[rgba(3,8,16,0.50)] p-4 backdrop-blur-xl lg:w-[300px]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#72f3c7]">Security Stack</p>
              <span className="status-active text-[10px] uppercase tracking-[0.14em] text-[#84f5b0]">Live</span>
            </div>
            <div className="space-y-0">
              {layers.map((layer, idx) => (
                <div key={layer.id} className="flex items-center gap-2.5 border-b border-[rgba(255,255,255,0.04)] py-[7px] last:border-0">
                  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.08)] text-[10px] font-bold text-[#72f3c7]" style={{ animationDelay: `${idx * 0.2}s` }}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-white">{layer.label}</p>
                    <p className="truncate text-[10px] text-[#96b0c2]">{layer.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productRails.map((rail) => (
          <Link
            key={rail.title}
            href={rail.href}
            className="glow-card group p-5 transition hover:-translate-y-0.5 hover:border-[rgba(0,201,177,0.2)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)]">
                <rail.icon className="h-4.5 w-4.5 text-[#72f3c7]" />
              </div>
              <span className="rounded-full border border-[rgba(255,214,102,0.26)] bg-[rgba(255,214,102,0.08)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffd666]">
                {rail.status}
              </span>
            </div>
            <h3 className="mt-4 text-[18px] font-bold text-white">{rail.title}</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#c8dae6]">{rail.body}</p>
            <div className="mt-4 rounded-xl border border-[rgba(0,201,177,0.08)] bg-[rgba(0,201,177,0.03)] px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#72f3c7]">Endpoint</p>
              <p className="mt-1 font-mono text-[12px] text-white">{rail.endpoint}</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#9ff7f0]">
              Open product
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </section>

      {/* ── VALUE PROPS ROW ───────────────────────────────── */}
      <section className="fade-in-up fade-in-up-3 grid gap-4 sm:grid-cols-3">
        {[
          { icon: KeyRound, label: "Wallet Gated", text: "Each package is activated by the same wallet that owns the developer session.", accent: "#72f3c7" },
          { icon: Gauge, label: "Live Scope", text: "User-facing routes now cover the full 9-layer core, Nitro fortress, partner wrapper, and anti-sybil screening module.", accent: "#63d8ff" },
          { icon: ShieldCheck, label: "Proof Native", text: "API keys are package-scoped and checked by the YieldBoost integrity layer.", accent: "#72f3c7" },
        ].map((item) => (
          <div key={item.label} className="glow-card p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)]">
                <item.icon className="h-4 w-4" style={{ color: item.accent }} />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-white">{item.label}</p>
            </div>
            <p className="mt-3 text-[14px] leading-7 text-[#c8dae6]">{item.text}</p>
          </div>
        ))}
      </section>

      {/* ── CHECKOUT FLOW + WALLET RULE ───────────────────── */}
      <section className="glow-card fade-in-up fade-in-up-4 p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#72f3c7]" />
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Checkout Flow</p>
            </div>
            <h2 className="mt-3 text-[26px] font-extrabold tracking-tight text-white">From wallet to live API key.</h2>
            <div className="mt-5 space-y-2">
              {[
                "Connect a 0G wallet",
                "Choose an API package",
                "Sign the package activation",
                "Receive a scoped API key",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(0,201,177,0.08)] bg-[rgba(0,201,177,0.03)] px-4 py-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(0,201,177,0.30)] bg-[rgba(0,201,177,0.08)] text-[12px] font-bold text-[#72f3c7]">
                    {index + 1}
                  </div>
                  <span className="text-[14px] font-semibold text-white">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end md:w-[340px]">
            <div className="wallet-rule-bar rounded-xl px-4 py-4">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">Wallet-Bound Checkout</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#c0f0e8]">
                    The paying wallet must match the wallet signed into this developer portal, so a third-party tx cannot be reused to claim an API key.
                  </p>
                </div>
              </div>
            </div>
            <DevPortalAccessCard session={session} />
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────── */}
      <section id="api-packages" className="fade-in-up fade-in-up-5 scroll-mt-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#72f3c7]">API Packages</p>
            <h2 className="mt-2 text-[30px] font-extrabold tracking-tight text-white md:text-[38px]">Mainnet 0G pricing.</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#c8dae6]">
              Pick a package first. The landing page only routes you into the dev checkout. The wallet signature happens inside the dashboard after you review the package summary.
            </p>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#9ff7f0]">
              Free stays on non-AI verification modules. Pro adds Alibaba fingerprinting without TEE, and Protocol unlocks full compute, TEE, selected partner SDK wrappers, and all marketplace modules.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {YA_API_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`pricing-card-hover flex flex-col rounded-2xl p-5 ${
                plan.id === "pro"
                  ? "plan-card-pro"
                  : "glow-card"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[17px] font-bold text-white">{plan.name}</h3>
                {plan.id === "pro" ? (
                  <span className="rounded-full border border-[rgba(0,201,177,0.35)] bg-[rgba(0,201,177,0.10)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">
                    Popular
                  </span>
                ) : null}
              </div>
              <div className="mt-4">
                {plan.listPrice0g ? (
                  <div className="text-[13px] font-medium text-[#96b0c2]">
                    <span className="line-through">{plan.listPrice0g} 0G</span>
                    {plan.promoLabel ? <span className="ml-2 text-[#72f3c7]">{plan.promoLabel}</span> : null}
                  </div>
                ) : null}
                <span className="text-[36px] font-bold leading-none text-white">{plan.checkoutPrice0g}</span>
                <span className="ml-1.5 text-[13px] font-medium text-[#96b0c2]">0G{plan.checkoutPrice0g !== "0" ? ` / ${plan.renewalLabel}` : ""}</span>
              </div>
              <p className="mt-2 text-[13px] text-[#b8cfde]">
                {plan.apiKeys} key{plan.apiKeys > 1 ? "s" : ""} · {plan.quotaLabel}
              </p>
              <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-[14px] leading-6 text-[#dce8f0]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <DevPlanActionButton
                plan={plan}
                hasSession={Boolean(session)}
                prominent={plan.id === "pro"}
              />
            </article>
          ))}
        </div>
      </section>

      {/* ── BOTTOM: positioning + quick access ────────────── */}
      <section className="fade-in-up fade-in-up-6 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="glow-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)]">
              <ShieldCheck className="h-5 w-5 text-[#72f3c7]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8dae6]">Integrity-as-a-Service</p>
              <h2 className="text-[20px] font-semibold text-white">For wallets, files, and high-trust AI flows</h2>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#c8dae6]">
            This store now carries three clear business rails: the native 9-layer YieldBoost stack, selected wrapped partner modules, and fortress-grade security products like Nitro and anti-sybil screening.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="bunker-inner-card rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#96b0c2]">API Surface</p>
              <p className="mt-2 font-mono text-[22px] font-bold text-white">/v1</p>
              <p className="mt-1 text-[13px] leading-5 text-[#a0b8ca]">Core endpoint, single layers, Nitro module, anti-sybil gate, and wrapped partner paths.</p>
            </div>
            <div className="bunker-inner-card rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#96b0c2]">Network</p>
              <p className="mt-2 text-[22px] font-bold text-[#72f3c7]">Mainnet</p>
              <p className="mt-1 text-[13px] leading-5 text-[#a0b8ca]">Developer activation now verifies the connected wallet before issuing mainnet-scoped API keys.</p>
            </div>
            <div className="bunker-inner-card rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#96b0c2]">Auth</p>
              <p className="mt-2 text-[22px] font-bold text-white">Wallet</p>
              <p className="mt-1 text-[13px] leading-5 text-[#a0b8ca]">Wallet login. Founder auto-promoted to owner.</p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glow-card p-5">
            <div className="flex items-center gap-2.5">
              <Radar className="h-4 w-4 text-[#72f3c7]" />
              <h2 className="text-[15px] font-bold text-white">Quick Access</h2>
            </div>
            <div className="mt-4 space-y-2">
              <Link href="/dev/docs" className="yb-teal-button flex items-center justify-between rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-950">
                Integration Docs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={session?.role === "owner" ? "/dev/console" : "/dev/apps"} className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[13px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.20)]">
                {session ? (session.role === "owner" ? "Owner dashboard" : "Developer dashboard") : "Dashboard after login"}
                <ArrowRight className="h-4 w-4 text-[#72f3c7]" />
              </Link>
            </div>
          </div>

          {!setup.adminEnabled ? (
            <div className="glow-card p-5">
              <h2 className="text-[15px] font-bold text-white">Portal Wiring</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#b8cfde]">
                Server-side env needed: {setup.missing.join(", ")}.
              </p>
            </div>
          ) : null}
        </aside>
      </section>
    </DeveloperPortalShell>
  );
}
