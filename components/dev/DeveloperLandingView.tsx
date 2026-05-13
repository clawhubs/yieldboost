import Link from "next/link";
import {
  ArrowRight,
  Check,
  Fingerprint,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";

import DevPortalAccessCard from "@/components/dev/DevPortalAccessCard";
import DevPlanActionButton from "@/components/dev/DevPlanActionButton";
import DevCookieBar from "@/components/dev/DevCookieBar";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import FaqAccordion from "@/components/dev/FaqAccordion";
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
  { id: "L10", label: "AWS Nitro Enclaves", sub: "Continuity rail and enclave witness" },
];

const productRails = [
  {
    title: "TITAN X Full 10-Layer API",
    status: "Mainnet live",
    body: "The flagship full-stack product of YieldBoost AI Protocol: blacklist, auditor, secure compute, sovereign memory, 0G storage proof, ZK proof, ProofRegistry anchor, governance, handshake, and AWS Nitro Enclaves.",
    endpoint: "/api/dev/store/military-grade",
    href: "/dev/marketplace/military-grade-full",
    icon: ShieldCheck,
    tags: ["L01-L10", "Full core", "Mainnet"],
  },
  {
    title: "AWS Nitro Fortress SDK",
    status: "Mainnet live",
    body: "A modular fortress SDK for secure agent runtimes: AWS Nitro Enclave framing, a 0G TEE badge summary, and a 0G Storage incident journal for sealed secrets, attack logs, and recovery replay history.",
    endpoint: "/api/dev/store/aws-nitro-fortress",
    href: "/dev/marketplace/aws-nitro-fortress",
    icon: Lock,
    tags: ["NF1 Nitro", "NF2 TEE badge", "NF3 Journal", "NF4 Replay"],
  },
  {
    title: "Anti-Sybil + ZK Proof + Alibaba Fingerprinting",
    status: "Mainnet live",
    body: "A mainnet verification module derived from the faucet defense path: wallet-bound screening, deterministic anti-sybil throttles, Alibaba behavior fingerprinting, and a ZK proof envelope ready for API issuance and risk review.",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
    href: "/dev/marketplace/anti-sybil-zk-fingerprint",
    icon: Fingerprint,
    tags: ["AS1 Wallet", "AS2 Throttle", "AS3 Alibaba", "AS4 ZK"],
  },
];

const showcaseLinks = [
  { label: "Open 1-Click showcase", href: "https://yieldboostai.xyz/", badge: "DEMO", newTab: true },
  { label: "Open verification console", href: "/dev/audit", badge: "AUDIT PROOF", newTab: false },
  { label: "Open vault flow", href: "https://yieldboostai.xyz/vault", badge: "DEMO", newTab: true },
  { label: "Open faucet flow", href: "https://yieldboostai.xyz/faucet", badge: "DEMO", newTab: true },
];

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Mainnet pricing", href: "#api-packages", newTab: false },
      { label: "Developer dashboard", href: "/dev/apps", newTab: false },
      { label: "Full store", href: "/dev/marketplace", newTab: false },
    ],
  },
  {
    title: "Strategy",
    links: [
      { label: "Project brief", href: "/dev/brief", newTab: false },
      { label: "Roadmap", href: "/dev/roadmap", newTab: false },
      { label: "Pitch deck", href: "/dev/pitchdeck", newTab: false },
    ],
  },
  {
    title: "External",
    links: [
      { label: "GitHub", href: "https://github.com/clawhubs/yieldboost", newTab: true },
      { label: "OpenAPI", href: "https://api.yieldboostai.xyz/docs", newTab: true },
    ],
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
  return (
    <DeveloperPortalShell
      eyebrow="YieldBoost AI Protocol"
      title="Store-first infrastructure for secure Web3 AI agents."
      description="YieldBoost AI sells its protocol through one developer store: TITAN X full-stack security, anti-sybil perimeter, AWS Nitro fortress module, selected partner wrappers, and a live verification path."
    >
      {/* ── HERO PANEL ────────────────────────────────────── */}
      <section className="hero-panel fade-in-up fade-in-up-1 p-4 sm:p-5 md:p-10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] px-4 py-1.5">
              <Fingerprint className="h-4 w-4 text-[#72f3c7]" />
              <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#8ff7ea]">Mainnet API Store</span>
            </div>
            <h2 className="shimmer-text mt-5 text-[26px] font-extrabold leading-[1.04] tracking-tight sm:text-[30px] md:mt-6 md:text-[46px] lg:text-[54px]">
              One store for YieldBoost AI Protocol, TITAN X, and proof-backed security modules.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#d0dde8] md:mt-5 md:text-[17px] md:leading-8">
              YieldBoost AI is the company. YieldBoost AI Protocol is the platform. TITAN X is the flagship full-stack product sold beside the anti-sybil perimeter, Nitro fortress module, partner wrappers, and live verification flows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dev/marketplace" className="yb-teal-button inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-[15px] font-bold text-slate-950 sm:w-auto">
                Open store
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
              {showcaseLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noreferrer" : undefined}
                  className="inline-flex min-w-0 w-full items-center justify-between gap-3 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-left text-[14px] font-bold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)] sm:w-auto sm:justify-start sm:px-5"
                >
                  <span className="min-w-0 break-words">{item.label}</span>
                  <span className="flag-ribbon !ml-0 shrink-0 sm:scale-[0.78]">{item.badge}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mini 10-layer vertical rail in hero */}
          <div className="w-full max-w-full shrink-0 rounded-2xl border border-[rgba(0,201,177,0.12)] bg-[rgba(3,8,16,0.50)] p-4 backdrop-blur-xl sm:max-w-[320px] lg:w-[300px]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">YieldBoost AI Protocol</p>
              <span className="status-active text-[11px] uppercase tracking-[0.14em] text-[#84f5b0]">Live</span>
            </div>
            <div className="space-y-0">
              {layers.map((layer, idx) => (
                <div key={layer.id} className="flex items-center gap-2.5 border-b border-[rgba(255,255,255,0.04)] py-[7px] last:border-0">
                  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.08)] text-[11px] font-bold text-[#72f3c7]" style={{ animationDelay: `${idx * 0.2}s` }}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-white">{layer.label}</p>
                    <p className="truncate text-[11px] text-[#b0c8d8]">{layer.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-2">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div className="max-w-3xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Featured Store Modules</p>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-white sm:text-[26px] md:text-[34px]">Start with the three products that explain the whole story.</h2>
            <p className="mt-2 text-[14px] leading-7 text-[#c8dae6]">
              These three modules explain the business in one screen: TITAN X as the full-stack product, the AWS Nitro fortress rail, and the anti-sybil perimeter powered by Alibaba fingerprinting and ZK review.
            </p>
          </div>
          <Link href="/dev/marketplace" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#9ff7f0]">
            Open full store
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
        {productRails.map((rail) => (
          <Link
            key={rail.title}
            href={rail.href}
            className="glow-card group p-5 md:p-6 transition hover:-translate-y-0.5 hover:border-[rgba(0,201,177,0.2)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)]">
                <rail.icon className="h-4.5 w-4.5 text-[#72f3c7]" />
              </div>
              <span className="rounded-full border border-[rgba(255,214,102,0.26)] bg-[rgba(255,214,102,0.08)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffd666]">
                {rail.status}
              </span>
            </div>
            <h3 className="mt-4 text-[18px] font-bold text-white">{rail.title}</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#c8dae6]">{rail.body}</p>
            <div className="mt-4 rounded-xl border border-[rgba(0,201,177,0.08)] bg-[rgba(0,201,177,0.03)] px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#72f3c7]">Endpoint</p>
              <p className="mt-1 break-all font-mono text-[12px] text-white">{rail.endpoint}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {rail.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] px-2.5 py-1 text-[11px] font-semibold text-[#bff9f1]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#9ff7f0]">
              Open product
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
        </div>
      </section>

      {/* ── CHECKOUT FLOW + WALLET RULE ───────────────────── */}
      <section id="connect-api" className="glow-card fade-in-up fade-in-up-3 p-6 scroll-mt-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="rounded-2xl border border-[rgba(0,201,177,0.08)] bg-[rgba(0,201,177,0.03)] p-5 md:px-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#72f3c7]" />
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Connect API</p>
            </div>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-tight text-white md:text-[24px]">Connect wallet. Pick package. Receive API key.</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#c8dae6]">
              This store flow is intentionally short. Connect a 0G wallet, choose the package that fits your product, sign the activation, and receive a scoped API key.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { step: "01", label: "Connect wallet" },
                { step: "02", label: "Choose package" },
                { step: "03", label: "Get API key" },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">{item.step}</p>
                  <p className="mt-2 text-[15px] font-semibold text-white">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="wallet-rule-bar rounded-xl px-4 py-4">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">Wallet-Bound Checkout</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#c0f0e8]">
                    The paying wallet must match the signed-in wallet, so a reused third-party transaction cannot claim an API key.
                  </p>
                </div>
              </div>
            </div>
            <DevPortalAccessCard session={session} />
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────── */}
      <section id="api-packages" className="fade-in-up fade-in-up-4 scroll-mt-8">
        <div className="px-2 md:px-3">
        <div className="mb-8 flex justify-center">
          <div className="max-w-4xl text-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#72f3c7]">API Packages</p>
            <h2 className="mt-2 text-[30px] font-extrabold tracking-tight text-white md:text-[38px]">Mainnet 0G pricing.</h2>
            <p className="mx-auto mt-3 max-w-3xl text-[15px] leading-7 text-[#c8dae6]">
              Pick a package first. This pricing section is where YieldBoost AI Protocol becomes a sellable infrastructure product. The wallet signature happens inside the dashboard after you review the package summary.
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-[14px] leading-7 text-[#9ff7f0]">
              Free stays on non-AI verification modules. Pro adds Alibaba fingerprinting without TEE, and Protocol unlocks full compute, TEE, AWS Nitro Fortress, selected partner SDK wrappers, and all store modules.
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
                  <span className="rounded-full border border-[rgba(0,201,177,0.35)] bg-[rgba(0,201,177,0.10)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">
                    Popular
                  </span>
                ) : null}
              </div>
              <div className="mt-4">
                {plan.listPrice0g ? (
                  <div className="text-[13px] font-medium text-[#b0c8d8]">
                    <span className="line-through">{plan.listPrice0g} 0G</span>
                    {plan.promoLabel ? <span className="ml-2 text-[#72f3c7]">{plan.promoLabel}</span> : null}
                  </div>
                ) : null}
                <span className="text-[36px] font-bold leading-none text-white">{plan.checkoutPrice0g}</span>
                <span className="ml-1.5 text-[13px] font-medium text-[#b0c8d8]">0G{plan.checkoutPrice0g !== "0" ? ` / ${plan.renewalLabel}` : ""}</span>
              </div>
              <p className="mt-2 text-[13px] text-[#b8cfde]">
                {plan.apiKeys} key{plan.apiKeys > 1 ? "s" : ""} · {plan.quotaLabel}
              </p>
              <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-[14px] leading-6 text-[#dce8f0]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                    <span className="break-words">{feature}</span>
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
        </div>
      </section>

      <section className="fade-in-up fade-in-up-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="glow-card p-6 md:px-7">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Store &amp; Product FAQ</p>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-tight text-white md:text-[24px]">What buyers are actually getting</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#b8d0de]">
            A short guide to the protocol, the TITAN X package, the 1-Click showcase, and the live verification console.
          </p>
          <div className="mt-5">
            <FaqAccordion
              items={[
                {
                  q: "What is the main product here?",
                  a: "The main product is YieldBoost AI Protocol sold through the API / SDK store. Buyers are purchasing modular integrity infrastructure: TITAN X, selected layers, anti-sybil controls, fortress modules, or partner wrappers.",
                },
                {
                  q: "Which package unlocks the full stack?",
                  a: "Protocol is the full unlock. It includes the TITAN X full 10-layer stack, TEE, AWS Nitro Fortress access, partner wrappers, custom limits, and the broader commercial path.",
                },
                {
                  q: "What do Free, Builder, and Pro actually mean?",
                  a: "Free is for non-AI verification modules and proof preview. Builder adds deterministic verification and anti-sybil screening. Pro adds extended verification modules and Alibaba fingerprinting without full TEE or partner SDK access.",
                },
                {
                  q: "Why did YieldBoost AI build a protocol instead of only a DeFi app?",
                  a: "Because the bigger problem is not one dashboard. Web3 AI agents still lack modular, verifiable, and sellable trust infrastructure. YieldBoost AI Protocol is the platform that solves that problem.",
                },
                {
                  q: "Why is 1-Click Optimize still here?",
                  a: "Because it is the flagship showcase. It proves that YieldBoost AI Protocol can become a real secure product on 0G Mainnet instead of staying as a hidden SDK claim.",
                },
                {
                  q: "Why keep the verification console live?",
                  a: "Because infrastructure buyers need proof, not promises. The verification console is the live trust surface where anyone can inspect the proof trail, storage artifacts, and the Layer 10 continuity rail before adopting the SDK.",
                },
              ]}
            />
          </div>
        </div>

        <div className="glow-card p-6 md:px-7">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">Showcase Logic</p>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-tight text-white md:text-[24px]">How the surfaces fit together</h2>
          <div className="mt-5 space-y-3">
            {[
              "The store is the commercial surface where YieldBoost AI Protocol is packaged and sold as API / SDK infrastructure.",
              "1-Click Optimize is the flagship showcase that proves the engine can power a secure mainnet product.",
              "Vault and faucet are public challenge surfaces that show how the same engine behaves under screening, attack, and claim pressure.",
              "The verification console is the proof surface where buyers inspect the stack before they adopt it.",
            ].map((line) => (
              <div key={line} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <p className="text-[14px] leading-7 text-[#d6e4ee]">{line}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="https://yieldboostai.xyz/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)] px-5 py-3 text-[14px] font-bold text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
            >
              Open 1-Click App
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dev/marketplace" className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-5 py-3 text-[14px] font-bold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)]">
              Open store
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="fade-in-up fade-in-up-6 glow-card p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">YieldBoost AI Protocol</p>
            <h2 className="mt-2 text-[20px] font-semibold text-white md:text-[22px]">
              Commercial infrastructure for secure, proof-backed Web3 AI systems.
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[#c8dae6]">
              Sold through the store, demonstrated through TITAN X, and supported by the brief, roadmap, pitch deck, and live proof surfaces.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[#b8c9d6]">
              <Link href="/dev/about" className="transition hover:text-[#9ff7f0]">
                About
              </Link>
              <Link href="/dev/refund-policy" className="transition hover:text-[#9ff7f0]">
                Refund Policy
              </Link>
              <Link href="/dev/terms" className="transition hover:text-[#9ff7f0]">
                Terms of Service
              </Link>
              <Link href="/dev/privacy" className="transition hover:text-[#9ff7f0]">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">{group.title}</p>
                <div className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      target={link.newTab ? "_blank" : undefined}
                      rel={link.newTab ? "noreferrer" : undefined}
                      className="block text-[14px] leading-6 text-[#d6e4ee] transition hover:text-[#9ff7f0]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>

      <DevCookieBar />
    </DeveloperPortalShell>
  );
}
