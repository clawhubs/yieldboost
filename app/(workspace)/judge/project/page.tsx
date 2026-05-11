import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  FileText,
  Flame,
  ShieldCheck,
  Sword,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const summaryCards = [
  {
    title: "The Problem",
    body:
      "Web3 is crowded with bots, sybil abuse, and fragile smart-contract flows. Finding yield is easy. Protecting users, execution, and proof integrity is the hard part.",
  },
  {
    title: "The Solution",
    body:
      "YieldBoost AI is a 9-layer security stack on 0G. It combines compute verification, ZK proofing, 0G Storage, ProofRegistry anchoring, and integrity memory into one verifiable defense path.",
  },
  {
    title: "For Everyone",
    body:
      "One click for normal users. Full-stack or single-layer APIs for developers. Partner wrappers get selected protections, while vault and faucet surfaces show how the security model behaves under attack and mass claims.",
  },
];

const surfaces = [
  {
    title: "1-Click Optimize",
    icon: Wallet,
    network: "Mainnet live",
    subtitle: "User product",
    body:
      "The shortest live demo. A wallet enters, YieldBoost finds a route, stores the result on 0G Mainnet, and anchors the proof path for judges to inspect.",
    why:
      "This is the clearest proof that the product works for a real user, not just as architecture.",
    href: "/agent",
    label: "Open boost flow",
  },
  {
    title: "API / SDK Security Store",
    icon: Boxes,
    network: "Mainnet live",
    subtitle: "Revenue product",
    body:
      "YieldBoost security is productized as modular APIs. Developers can buy the full 9-layer stack, call one layer at a time, or use partner wrappers such as VeilSolver with selected protections.",
    why:
      "This is how the 9-layer stack becomes a sellable product without overstating partner wrapper coverage.",
    href: "/dev/marketplace",
    label: "Open marketplace",
  },
  {
    title: "Live Challenge Vault",
    icon: Sword,
    network: "Testnet challenge",
    subtitle: "Security challenge",
    body:
      "The vault is a public challenge surface. Its current seal and challenge flow is testnet-scoped, while the surrounding integrity story stays aligned with the same YieldBoost verification stack reviewed on mainnet.",
    why:
      "This turns the security claim into a live target. Attackers test the system against evidence, not marketing.",
    href: "/vault",
    label: "Open vault",
  },
  {
    title: "Anti-Sybil Faucet",
    icon: Flame,
    network: "Testnet airdrop example",
    subtitle: "Security example",
    body:
      "The faucet is a testnet airdrop-style surface. The voucher output stays testnet-only, while the anti-sybil logic, Alibaba fingerprinting, and proof-aware abuse resistance follow the same security model used in the mainnet marketplace modules.",
    why:
      "This shows how YieldBoost could protect a high-volume crypto airdrop flow without pretending that the faucet itself is the mainnet product.",
    href: "/faucet",
    label: "Open faucet",
  },
];

export default function JudgeProjectBriefPage() {
  return (
    <div className="min-h-screen bg-[#04070c] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <header className="rounded-[28px] border border-[rgba(34,221,208,0.14)] bg-[radial-gradient(circle_at_top_left,rgba(34,221,208,0.14),transparent_32%),linear-gradient(180deg,rgba(9,16,24,0.96),rgba(4,8,13,0.98))] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.36)] md:px-8 md:py-8">
          <Link
            href="/judge"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[12px] font-medium text-[#d8e1e8] transition hover:border-[rgba(34,221,208,0.28)] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#22ddd0]" />
            Back to judge
          </Link>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ff7f0]">
            <FileText className="h-3.5 w-3.5" />
            30-second project brief
          </div>
          <h1 className="mt-4 max-w-4xl text-[30px] font-semibold leading-tight md:text-[46px]">
            YieldBoost AI protects yield on 0G with a 9-layer proof and security stack.
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#d0dae2] md:text-[16px]">
            This page is designed so a judge can understand the project in under 30 seconds:
            what problem we solve, what we built, how it makes money, and which parts are live on mainnet versus testnet.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Users optimize",
              body: "1-click optimize turns an idle wallet into a proof-backed yield route.",
            },
            {
              title: "Developers buy the stack",
              body: "The full stack is sold as infrastructure; partner SDK wrappers use selected protections.",
            },
            {
              title: "Hackers challenge the vault",
              body: "The protection claim is exposed to a live challenge instead of staying on slides.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[18px] border border-[rgba(34,221,208,0.14)] bg-[rgba(34,221,208,0.04)] px-5 py-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ff7f0]">
                {item.title}
              </div>
              <p className="mt-2 text-[14px] leading-7 text-[#d8e1e8]">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
                {card.title}
              </div>
              <p className="mt-3 text-[14px] leading-7 text-[#d8e1e8]">{card.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-[rgba(34,221,208,0.12)] bg-[linear-gradient(180deg,rgba(7,13,20,0.96),rgba(5,8,12,0.98))] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:px-8 md:py-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(34,221,208,0.2)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[24px] font-semibold md:text-[30px]">How the system is exposed</h2>
              <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#cfd8e0]">
                The same security stack is shown through four surfaces: user optimization, developer APIs,
                selected partner wrappers, a public anti-sybil airdrop example, and a live vault challenge.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {surfaces.map((surface) => {
              const Icon = surface.icon;
              return (
                <article
                  key={surface.title}
                  className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">
                        {surface.subtitle}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[18px] font-semibold text-white">{surface.title}</h3>
                        <span className="rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ff7f0]">
                          {surface.network}
                        </span>
                      </div>
                      <p className="mt-2 text-[14px] leading-7 text-[#d3dce4]">{surface.body}</p>
                      <p className="mt-3 text-[13px] leading-6 text-[#9ff7f0]">
                        Why it matters: {surface.why}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={surface.href}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.06)] px-3 py-2 text-[12px] font-medium text-[#dff9f6] transition hover:border-[rgba(34,221,208,0.34)] hover:text-white"
                    >
                      {surface.label}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 rounded-[18px] border border-[rgba(246,193,102,0.18)] bg-[rgba(246,193,102,0.05)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6c166]">
              Network honesty
            </p>
            <p className="mt-2 text-[14px] leading-7 text-[#d8e1e8]">
              YieldBoost is published as a mainnet-first project, but not every surface uses the same live network path yet.
              The optimizer and API marketplace are presented as mainnet product surfaces. The vault and faucet remain clearly
              marked as testnet challenge and example flows, while reusing the same broader security design where applicable.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
              What judges should remember
            </div>
            <p className="mt-3 text-[14px] leading-7 text-[#d8e1e8]">
              YieldBoost is not only a DApp. It is a user flow, a proof engine, a developer security store, a revenue surface,
              a public challenge vault, and an anti-sybil airdrop example built on 0G. The full 9-layer product is YieldBoost-native;
              partner wrappers use narrower proof paths.
            </p>
          </article>

          <article className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
              Main signal
            </div>
            <p className="mt-3 text-[14px] leading-7 text-[#d8e1e8]">
              1-click optimize proves the core path live. The marketplace sells the protection model as APIs
              and selected SDK wrappers. The vault challenges attackers. The faucet demonstrates anti-sybil security in a high-volume airdrop-style public flow.
            </p>
          </article>

          <article className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
              Why 0G matters
            </div>
            <p className="mt-3 text-[14px] leading-7 text-[#d8e1e8]">
              0G gives the stack its proof storage, compute path, and anchor surface. YieldBoost uses that
              base layer to turn AI finance into something reviewable, portable, monetizable, and harder to fake.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}
