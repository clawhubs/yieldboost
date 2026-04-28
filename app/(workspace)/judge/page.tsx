import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Bot,
  CheckCircle2,
  ExternalLink,
  Link2,
  ShieldCheck,
  Wallet2,
} from "lucide-react";
import { getJudgePageData } from "@/lib/server/review-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toneClass(tone: "teal" | "green" | "amber" | "white" = "white") {
  if (tone === "green") return "text-[#68ff7a]";
  if (tone === "amber") return "text-[#f6c166]";
  if (tone === "teal") return "text-[#22ddd0]";
  return "text-white";
}

function statusBadgeClass(status: "live" | "configured" | "partial" | "pending") {
  if (status === "live") {
    return "border-[rgba(47,224,109,0.24)] bg-[rgba(47,224,109,0.08)] text-[#68ff7a]";
  }
  if (status === "configured") {
    return "border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] text-[#22ddd0]";
  }
  if (status === "partial") {
    return "border-[rgba(246,193,102,0.24)] bg-[rgba(246,193,102,0.08)] text-[#f6c166]";
  }
  return "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#d7e0e8]";
}

function envStatusClass(status: "set" | "missing" | "optional") {
  if (status === "set") {
    return "border-[rgba(47,224,109,0.24)] bg-[rgba(47,224,109,0.08)] text-[#68ff7a]";
  }
  if (status === "missing") {
    return "border-[rgba(246,193,102,0.24)] bg-[rgba(246,193,102,0.08)] text-[#f6c166]";
  }
  return "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#d7e0e8]";
}

export default async function JudgePage() {
  const data = await getJudgePageData();

  return (
    <section data-testid="judge-page" className="space-y-[10px] p-[10px]">
      <header className="yb-card rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Judge Mode
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              Review the full YieldBoost story without connecting a wallet.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
              YieldBoost AI scans wallet state, recommends a low-risk yield route, and stores verifiable output on 0G. This page is wired to the same runtime store, proof history, and environment status used by the app itself.
            </p>
            <p className="mt-4 text-[13px] text-[#d8e1e8]">{data.runtimeLabel}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[430px]">
            <Link
              href="/"
              className="yb-teal-button inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-semibold text-[#071217]"
            >
              Open dashboard
            </Link>
            <Link
              href="/agent"
              className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#d8e1e8]"
            >
              Open boost flow
            </Link>
            <Link
              href="/history"
              className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#d8e1e8]"
            >
              Open history
            </Link>
            <Link
              href="/agents"
              className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#d8e1e8]"
            >
              Open agents
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
          {data.statusCards.map((card) => (
            <div key={card.label} className="yb-soft-card rounded-[14px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#a7b3be]">
                {card.label}
              </div>
              <div className={`mt-2 text-[20px] font-semibold ${toneClass(card.tone)}`}>
                {card.value}
              </div>
              <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">{card.helper}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1.15fr)_390px]">
        <div className="space-y-[10px]">
          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-white">Latest proof and result</h2>
                <p className="mt-1 text-[13px] text-[#9faab6]">
                  Pulled from the active runtime store, not a static mock card.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
              {data.latestProofCards.map((card) => (
                <div key={card.label} className="glass-inset rounded-[14px] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">
                    {card.label}
                  </div>
                  <div className={`mt-2 text-[18px] font-semibold ${toneClass(card.tone)}`}>
                    {card.value}
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">{card.helper}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-[10px] lg:grid-cols-[minmax(0,1fr)_290px]">
              <div className="glass-inset rounded-[16px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">Verification payload</div>
                <div className="mt-4 space-y-3 text-[13px] text-[#d8e1e8]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Storage CID</span>
                    <span className="break-all">{data.latestProof?.cid ?? "No proof recorded yet"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Explorer Link</span>
                    {data.latestProof?.explorerUrl ? (
                      <a
                        href={data.latestProof.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[#22ddd0]"
                      >
                        Open latest tx
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-[#d6dee6]">No explorer URL yet</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Contract Address</span>
                    <span className="break-all">
                      {data.latestProof?.proofRegistryAddress ?? "Placeholder: set ProofRegistry env for the active network"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Reasoning</span>
                    <span className="leading-6 text-[#d6dee6]">
                      {data.latestProof?.decision.reasoning ?? "No stored reasoning available yet."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="yb-soft-card rounded-[16px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">Demo / public wallet flow</div>
                <div className="mt-4 space-y-3">
                  {data.demoFlow.map((step) => (
                    <div key={step} className="flex items-start gap-3 text-[13px] leading-6 text-[#d8e1e8]">
                      <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-[#2fe06d]" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[12px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.06)] px-3 py-3 text-[12px] leading-6 text-[#d9eef0]">
                  Review wallet: <span className="break-all text-white">{data.statusCards[3]?.value}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-white">0G components in use</h2>
                <p className="mt-1 text-[13px] text-[#9faab6]">
                  Current status of storage, compute, registry, explorer, and agent contract paths.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-[10px] md:grid-cols-2">
              {data.components.map((component) => (
                <div key={component.title} className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-semibold text-white">{component.title}</div>
                      <div className="mt-2 text-[13px] leading-6 text-[#d6dee6]">
                        {component.detail}
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(component.status)}`}
                    >
                      {component.status === "live" ? "live" : component.status}
                    </span>
                  </div>
                  {component.address ? (
                    <div className="mt-3 text-[12px] text-[#d8e1e8]">
                      Address: <span className="break-all text-white">{component.address}</span>
                    </div>
                  ) : null}
                  {component.meta ? (
                    <div className="mt-2 text-[12px] text-[#9faab6]">{component.meta}</div>
                  ) : null}
                  {component.href ? (
                    <a
                      href={component.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium text-[#22ddd0]"
                    >
                      Open reference
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-[10px]">
          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-white">Mainnet cutover</h2>
                <p className="mt-1 text-[13px] text-[#8ea1af]">What is already code-ready vs. what still needs envs or deployment.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {data.mainnetChecklist.map((item) => (
                <div key={item.label} className="glass-inset rounded-[14px] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[14px] font-medium text-white">{item.label}</div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#9faab6]">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Wallet2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-white">Vercel env checklist</h2>
                <p className="mt-1 text-[13px] text-[#8ea1af]">Only includes variables that the app currently reads.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {data.envChecklist.map((item) => (
                <div key={item.name} className="glass-inset rounded-[14px] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <code className="text-[12px] text-white">{item.name}</code>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${envStatusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[12px] text-[#d8e1e8]">{item.requiredFor}</div>
                  <div className="mt-1 text-[12px] leading-6 text-[#9faab6]">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="yb-card rounded-[18px] px-5 py-5">
            <h2 className="text-[18px] font-semibold text-white">Open blockers</h2>
            <div className="mt-4 space-y-3">
              {data.blockers.length > 0 ? (
                data.blockers.map((item) => (
                  <div key={item} className="rounded-[14px] border border-[rgba(246,193,102,0.22)] bg-[rgba(246,193,102,0.06)] px-4 py-4 text-[12px] leading-6 text-[#f0d9a4]">
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-[14px] border border-[rgba(47,224,109,0.24)] bg-[rgba(47,224,109,0.08)] px-4 py-4 text-[12px] leading-6 text-[#7cff90]">
                  No blocking infra gap is currently detected from the active environment snapshot.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
