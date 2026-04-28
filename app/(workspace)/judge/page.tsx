import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Boxes,
  CheckCircle2,
  ExternalLink,
  Link2,
  ShieldCheck,
  Wallet2,
} from "lucide-react";
import JudgeModeBootstrap from "@/components/judge/JudgeModeBootstrap";
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
  const primaryComponents = data.components.filter((component) =>
    ["0G Storage", "0G Compute Network", "ProofRegistry"].includes(component.title),
  );
  const supportingComponents = data.components.filter((component) =>
    !["0G Storage", "0G Compute Network", "ProofRegistry"].includes(component.title),
  );
  const mainnetPriority = data.mainnetChecklist.slice(0, 3);
  const missingEnv = data.envChecklist.filter((item) => item.status === "missing");
  const envPreview = missingEnv.slice(0, 6);
  const blockersPreview = data.blockers.slice(0, 3);
  const proofRegistryValue =
    data.latestProof?.proofRegistryAddress ?? "Placeholder: set ProofRegistry env for the active network";
  const reviewWalletCard = data.statusCards.find((card) => card.label === "Review Wallet");
  const proofStoreCard = data.statusCards.find((card) => card.label === "Proof Store");
  const latestProofHistoryCard = data.latestProofCards.find((card) => card.label === "Proof History");
  const quickReviewPoints = [
    "Open `/judge` as the submission entry point to see the latest wallet result first.",
    "Follow the latest tx link and the CID to verify the current testnet proof externally.",
    "Jump to `/history` or `/agents` only if you want more context on the same snapshot.",
    "Use `Exit judge mode` in the sidebar anytime to return to the normal wallet flow.",
  ];

  return (
    <section data-testid="judge-page" className="space-y-[10px] p-[10px]">
      <JudgeModeBootstrap />
      <header className="yb-card rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Judge Mode
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              Start here for the hackathon review.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
              YieldBoost AI finds a better low-risk yield route, shows the decision clearly, and keeps the latest wallet proof ready for external verification. This page stays read-only so a judge can inspect the current result without rerunning the flow.
            </p>
            <div className="mt-4 grid gap-[10px] md:grid-cols-3">
              {[
                {
                  title: "What to look at",
                  body: "Latest route, APY lift, snapshot value, and the proof receipt tied to the current judge wallet.",
                },
                {
                  title: "What is live",
                  body: "0G Storage proof data, explorer link, and ProofRegistry anchoring when the latest run produced it.",
                },
                {
                  title: "What is optional",
                  body: "Mainnet readiness and env audit stay available below, but they do not block the primary judging path.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-inset rounded-[14px] px-4 py-4">
                  <div className="text-[14px] font-semibold text-white">{item.title}</div>
                  <div className="mt-2 text-[13px] leading-6 text-[#d6dee6]">{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:w-[400px]">
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Quick routes</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Link
                  href="/"
                  className="yb-teal-button inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-semibold text-[#071217]"
                >
                  Open dashboard
                </Link>
                <Link
                  href="/history"
                  className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#d8e1e8]"
                >
                  Open history
                </Link>
                <Link
                  href="/agent"
                  className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#d8e1e8]"
                >
                  Open boost flow
                </Link>
                <Link
                  href="/agents"
                  className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#d8e1e8]"
                >
                  Open agents
                </Link>
              </div>
              <div className="mt-4 rounded-[12px] border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.06)] px-3 py-3 text-[12px] leading-6 text-[#d9eef0]">
                Direct submission link: <span className="text-white">`/judge`</span>. Exit stays available from the sidebar anytime.
              </div>
            </div>
          </div>
        </div>
        <p className="mt-5 text-[13px] text-[#d8e1e8]">{data.runtimeLabel}</p>
      </header>

      <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-[10px]">
          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-white">Latest proof and wallet snapshot</h2>
                <p className="mt-1 text-[13px] text-[#9faab6]">
                  The current result for the active judge wallet, with proof and links kept visible in one place.
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
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Storage CID</div>
                    <div className="mt-1 break-all text-[13px] text-[#d8e1e8]">
                      {data.latestProof?.cid ?? "No proof recorded yet"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Contract / placeholder</div>
                    <div className="mt-1 break-all text-[13px] text-[#d8e1e8]">{proofRegistryValue}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Explorer</div>
                    {data.latestProof?.explorerUrl ? (
                      <a
                        href={data.latestProof.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-[13px] text-[#22ddd0]"
                      >
                        Open latest tx
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="mt-1 text-[13px] text-[#d6dee6]">No explorer URL yet</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Reasoning snapshot</div>
                    <div className="mt-1 text-[13px] leading-6 text-[#d6dee6]">
                      {data.latestProof?.decision.reasoning ?? "No stored reasoning available yet."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="yb-soft-card rounded-[16px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">Judge wallet</div>
                <div className="mt-3 break-all text-[14px] font-semibold text-white">
                  {reviewWalletCard?.value ?? "Pending wallet"}
                </div>
                <div className="mt-2 text-[12px] leading-6 text-[#9faab6]">
                  {reviewWalletCard?.helper ?? "Judge mode follows the wallet active in this browser session."}
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="glass-inset rounded-[12px] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Proof store</div>
                    <div className={`mt-1 text-[14px] font-semibold ${toneClass(proofStoreCard?.tone)}`}>
                      {proofStoreCard?.value ?? "Proof store"}
                    </div>
                    <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">{proofStoreCard?.helper}</div>
                  </div>
                  <div className="glass-inset rounded-[12px] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Pinned wallet</div>
                    <div className="mt-1 break-all text-[13px] text-white">
                      Judge wallet: {reviewWalletCard?.value ?? "Pending wallet"}
                    </div>
                    <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">
                      {latestProofHistoryCard?.helper ?? "No proof timestamp recorded yet."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <details className="mt-4 rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-white">How judges should review this submission</div>
                  <div className="mt-1 text-[12px] text-[#9faab6]">Keep the main screen short, then expand this only if you want the review path.</div>
                </div>
                <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e0e8]">
                  Expand
                </span>
              </summary>
              <div className="mt-4 space-y-3">
                {quickReviewPoints.map((step) => (
                  <div key={step} className="flex items-start gap-3 text-[13px] leading-6 text-[#d8e1e8]">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-[#2fe06d]" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-white">0G components in use</h2>
                <p className="mt-1 text-[13px] text-[#9faab6]">
                  The three components most judges usually ask about first.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-[10px] md:grid-cols-3">
              {primaryComponents.map((component) => (
                <div key={component.title} className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-semibold text-white">{component.title}</div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(component.status)}`}
                    >
                      {component.status}
                    </span>
                  </div>
                  <div className="mt-3 text-[13px] leading-6 text-[#d6dee6]">{component.detail}</div>
                  {component.address ? (
                    <div className="mt-3 break-all text-[12px] text-[#d8e1e8]">
                      {component.address}
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

            {supportingComponents.length > 0 ? (
              <div className="mt-4 rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                <div className="text-[12px] font-medium text-white">Supporting paths</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {supportingComponents.map((component) => (
                    <div key={component.title}>
                      <div className="flex items-center gap-2">
                        <div className="text-[13px] font-medium text-white">{component.title}</div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(component.status)}`}
                        >
                          {component.status}
                        </span>
                      </div>
                      <div className="mt-2 text-[12px] leading-6 text-[#9faab6]">{component.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-[10px]">
          <details className="yb-card rounded-[18px] px-5 py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-white">Current blockers</h2>
                    <p className="mt-1 text-[13px] text-[#8ea1af]">
                      {blockersPreview.length > 0
                        ? `${blockersPreview.length} item masih perlu perhatian sebelum cutover berikutnya.`
                        : "No active blocker detected from the current environment snapshot."}
                    </p>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e0e8]">
                Expand
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              {blockersPreview.length > 0 ? (
                blockersPreview.map((item) => (
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
          </details>

          <details className="yb-card rounded-[18px] px-5 py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-white">Mainnet readiness</h2>
                    <p className="mt-1 text-[13px] text-[#8ea1af]">Kept secondary on purpose so the first screen stays focused on the judged result.</p>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e0e8]">
                Expand
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              {mainnetPriority.map((item) => (
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
          </details>

          {supportingComponents.length > 0 ? (
            <details className="yb-card rounded-[18px] px-5 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold text-white">Supporting paths</h2>
                  <p className="mt-1 text-[13px] text-[#8ea1af]">Extra technical context that is no longer pushed into the primary judging view.</p>
                </div>
                <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e0e8]">
                  Expand
                </span>
              </summary>

              <div className="mt-4 grid gap-3">
                {supportingComponents.map((component) => (
                  <div key={component.title} className="glass-inset rounded-[14px] px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-medium text-white">{component.title}</div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(component.status)}`}
                      >
                        {component.status}
                      </span>
                    </div>
                    <div className="mt-2 text-[12px] leading-6 text-[#9faab6]">{component.detail}</div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <details className="yb-card rounded-[18px] px-5 py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                    <Wallet2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-white">Vercel env checklist</h2>
                    <p className="mt-1 text-[13px] text-[#8ea1af]">
                      {missingEnv.length > 0
                        ? `${missingEnv.length} env masih missing di jalur readiness sekarang.`
                        : "No missing env detected in the current snapshot."}
                    </p>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d7e0e8]">
                Expand
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              {envPreview.map((item) => (
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
          </details>
        </aside>
      </div>
    </section>
  );
}
