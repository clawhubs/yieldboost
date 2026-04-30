import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Boxes,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import JudgeModeBootstrap from "@/components/judge/JudgeModeBootstrap";
import JudgeNetworkSwitcher from "@/components/judge/JudgeNetworkSwitcher";
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

export default async function JudgePage() {
  const data = await getJudgePageData();
  const primaryComponents = data.components.filter((component) =>
    ["0G Storage", "0G Compute Network", "ProofRegistry"].includes(component.title),
  );
  const inftComponent = data.components.find((component) => component.title === "Yield Strategy INFT");
  const proofRegistryValue =
    data.latestProof?.proofRegistryAddress ?? "Placeholder: set ProofRegistry env for the active network";
  const reviewWalletCard = data.statusCards.find((card) => card.label === "Review Wallet");
  const proofStoreCard = data.statusCards.find((card) => card.label === "Proof Store");
  const latestProofHistoryCard = data.latestProofCards.find((card) => card.label === "Proof History");
  const proofStoreValue = proofStoreCard?.value?.includes(".artifacts/runtime-store.json")
    ? "Recorded review snapshot"
    : proofStoreCard?.value ?? "Recorded review snapshot";
  const latestExplorerUrl =
    data.latestProof?.proofRegistryExplorerUrl ?? data.latestProof?.explorerUrl;
  const latestExplorerLabel = data.latestProof?.proofRegistryExplorerUrl
    ? "Open ProofRegistry tx"
    : "Open latest tx";
  const quickReviewPoints = [
    "Open `/judge` as the submission entry point to see the latest wallet result first.",
    "Follow the latest tx link and the CID to verify the current mainnet proof externally.",
    "Jump to `/history` or `/agents` only if you want more context on the same snapshot.",
    "Use `Exit judge mode` in the sidebar anytime to return to the normal wallet flow.",
  ];
  const projectProfiles = [
    {
      label: "GitHub",
      href: "https://github.com/clawhubs/yieldboost",
      sublabel: "clawhubs/yieldboost",
      icon: GitBranch,
    },
    {
      label: "X",
      href: "https://x.com/YieldboostAi",
      sublabel: "@YieldboostAi",
      icon: ArrowUpRight,
    },
  ];

  return (
    <section data-testid="judge-page" className="space-y-[10px] p-[10px]">
      <JudgeModeBootstrap />
      <JudgeSnapshotAutoRefresh />
      <header className="yb-card rounded-[18px] px-5 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Judge Mode
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              Mainnet review starts here.
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#9daab6]">
              YieldBoost AI finds a better low-risk yield route, shows the decision clearly, and keeps the latest wallet proof ready for external verification. This page stays read-only so a judge can inspect the current result without rerunning the flow.
            </p>
            <div className="mt-5 grid w-full gap-[10px] md:grid-cols-3">
              {[
                {
                  title: "What to look at",
                  body: "Latest route, APY lift, snapshot value, and the proof receipt tied to the current judge wallet.",
                },
                {
                  title: "What is live",
                  body: "0G Mainnet proof data, explorer links, and ProofRegistry anchoring from the latest recorded run.",
                },
                {
                  title: "What is kept secondary",
                  body: "Operational readiness, deeper docs, and internal setup checks are intentionally kept out of the first judging screen.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-inset rounded-[14px] px-4 py-4">
                  <div className="text-[14px] font-semibold text-white">{item.title}</div>
                  <div className="mt-2 text-[13px] leading-6 text-[#d6dee6]">{item.body}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 w-full max-w-3xl rounded-[20px] border border-[rgba(34,221,208,0.18)] bg-[linear-gradient(180deg,rgba(34,221,208,0.10)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-5 shadow-[0_22px_48px_rgba(0,0,0,0.26)]">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#9ff7f0]">Submission entry point</div>
              <div className="mt-2 text-[24px] font-semibold text-white">Open `/judge` first</div>
              <div className="mt-2 text-[13px] leading-6 text-[#d9eef0]">
                This is the direct review route for judges. The normal user flow stays available, and `Exit judge mode` remains in the sidebar.
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
            </div>
            <JudgeNetworkSwitcher />
            <div className="mt-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-3">
              {projectProfiles.map((profile) => {
                const Icon = profile.icon;
                return (
                  <a
                    key={profile.label}
                    href={profile.href}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-inset inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] text-[#d8e1e8] transition hover:border-[rgba(34,221,208,0.28)] hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#22ddd0]" />
                    <span className="font-medium">{profile.label}</span>
                    <span className="text-[#8ea1af]">{profile.sublabel}</span>
                  </a>
                );
              })}
            </div>
            <p className="mt-5 text-[13px] text-[#d8e1e8]">{data.runtimeLabel}</p>
          </div>
        </div>
      </header>

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
                  <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">
                    {card.label === "Proof History" && data.latestProof?.timestamp ? (
                      <BrowserTimeLabel
                        value={data.latestProof.timestamp}
                        prefix="Latest proof recorded"
                      />
                    ) : (
                      card.helper
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-[10px]">
              <div className="glass-inset rounded-[16px] px-4 py-4">
                <div className="text-[12px] font-medium text-white">Verification payload</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Storage CID</div>
                    <div className="mt-2 break-all text-[13px] leading-6 text-[#d8e1e8]">
                      {data.latestProof?.cid ?? "No proof recorded yet"}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">ProofRegistry contract</div>
                    <div className="mt-2 break-all text-[13px] leading-6 text-[#d8e1e8]">{proofRegistryValue}</div>
                  </div>
                  <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Explorer</div>
                    {latestExplorerUrl ? (
                      <a
                        href={latestExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-[13px] text-[#22ddd0]"
                      >
                        {latestExplorerLabel}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="mt-2 text-[13px] leading-6 text-[#d6dee6]">No explorer URL yet</div>
                    )}
                  </div>
                  <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">ProofRegistry tx</div>
                    {data.latestProof?.proofRegistryExplorerUrl ? (
                      <a
                        href={data.latestProof.proofRegistryExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-[13px] text-[#22ddd0]"
                      >
                        Open anchor tx
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="mt-2 text-[13px] leading-6 text-[#d6dee6]">No registry tx yet</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="text-[12px] font-medium text-white">Reasoning snapshot</div>
                  <div className="mt-3 text-[13px] leading-7 text-[#d6dee6]">
                    {data.latestProof?.decision.reasoning ?? "No stored reasoning available yet."}
                  </div>
                </div>

                <div className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="text-[12px] font-medium text-white">Runtime efficiency</div>
                  <div className="mt-3 grid gap-3">
                    {data.efficiencyCards.map((card) => (
                      <div key={card.label} className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">{card.label}</div>
                          <div className={`text-[12px] font-semibold ${toneClass(card.tone)}`}>{card.value}</div>
                        </div>
                        <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">{card.helper}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
                <div className="yb-soft-card rounded-[16px] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Judge wallet</div>
                  <div className="mt-2 break-all text-[14px] font-semibold text-white">
                    {reviewWalletCard?.value ?? "Pending wallet"}
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">
                    {reviewWalletCard?.helper ?? "Judge mode follows the wallet active in this browser session."}
                  </div>
                </div>

                <div className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Proof store</div>
                  <div className={`mt-2 text-[14px] font-semibold ${toneClass(proofStoreCard?.tone)}`}>
                    {proofStoreValue}
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">{proofStoreCard?.helper}</div>
                </div>

                <div className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">Pinned wallet</div>
                  <div className="mt-2 break-all text-[13px] text-white">
                    Judge wallet: {reviewWalletCard?.value ?? "Pending wallet"}
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">
                    <BrowserTimeLabel
                      value={data.latestProof?.timestamp}
                      prefix="Latest proof recorded"
                      emptyLabel={latestProofHistoryCard?.helper ?? "No proof timestamp recorded yet."}
                    />
                  </div>
                </div>

                {inftComponent?.address ? (
                  <div className="glass-inset rounded-[16px] px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#9faab6]">INFT contract</div>
                    <div className="mt-2 break-all text-[13px] text-white">
                      {inftComponent.address}
                    </div>
                    <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">
                      Mainnet Agent NFT contract address used by the app.
                    </div>
                  </div>
                ) : null}
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

          </section>

          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-white">Data safety</h2>
                <p className="mt-1 text-[13px] text-[#9faab6]">
                  Kept short on purpose for judges, with deeper notes available in the docs center.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-[10px] md:grid-cols-3">
              {[
                {
                  title: "What is not stored",
                  body: "The proof flow does not store private keys, seed phrases, or wallet secrets in 0G Storage or the runtime proof ledger.",
                },
                {
                  title: "What is stored",
                  body: "The app stores optimization output, timestamps, wallet-scoped proof metadata, and the snapshot fields needed to audit the recorded result.",
                },
                {
                  title: "Judge-friendly truth",
                  body: "This page keeps the security story concise. Open `/docs/wallet-and-security` for the fuller explanation of current boundaries and limitations.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-inset rounded-[16px] px-4 py-4">
                  <div className="text-[14px] font-semibold text-white">{item.title}</div>
                  <div className="mt-2 text-[12px] leading-6 text-[#d6dee6]">{item.body}</div>
                </div>
              ))}
            </div>
          </section>
      </div>
    </section>
  );
}
