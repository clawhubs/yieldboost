import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Hash,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Wallet,
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
  const reviewingMainnet = data.reviewNetwork === "mainnet";
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
  const integrityAudit = data.latestProof?.integrityAudit;
  const integrityApproved = integrityAudit?.status === "APPROVED";
  const integrityEvidenceArtifacts = [
    {
      label: "Memory CID",
      value: data.sovereignMemory?.cid,
      empty: "No memory CID yet",
      href: data.sovereignMemory?.explorerUrl,
      linkLabel: "Open memory tx on Chainscan",
    },
    {
      label: "Blacklist CID",
      value: data.latestBlacklistEntry?.cid,
      empty: "No blacklist CID yet",
      href: data.latestBlacklistEntry?.explorerUrl,
      linkLabel: "Open blacklist tx on Chainscan",
    },
    {
      label: "Stress Report CID",
      value: data.latestStressReport?.reportCid,
      empty: "No report CID yet",
      href: data.latestStressReport?.explorerUrl,
      linkLabel: "Open stress tx on Chainscan",
    },
    {
      label: "Compliance CID",
      value: data.latestZkComplianceProof?.artifactCid,
      empty: "No compliance CID yet",
      href:
        data.latestZkComplianceProof?.proofRegistryExplorerUrl ??
        data.latestZkComplianceProof?.explorerUrl,
      linkLabel: data.latestZkComplianceProof?.proofRegistryExplorerUrl
        ? "Open compliance anchor on Chainscan"
        : "Open compliance tx on Chainscan",
    },
    {
      label: "ZK Proof CID",
      value: data.latestZkReasoningProof?.proofCid,
      empty: "No ZK proof CID yet",
      href:
        data.latestZkReasoningProof?.proofRegistryExplorerUrl ??
        data.latestZkReasoningProof?.explorerUrl,
      linkLabel: data.latestZkReasoningProof?.proofRegistryExplorerUrl
        ? "Open ZK proof anchor on Chainscan"
        : "Open ZK proof tx on Chainscan",
    },
    {
      label: "Governance CID",
      value: data.latestGovernanceDecision?.artifactCid,
      empty: "No governance CID yet",
      href: data.latestGovernanceDecision?.explorerUrl,
      linkLabel: "Open governance tx on Chainscan",
    },
    {
      label: "Handshake CID",
      value: data.latestCrossAgentHandshake?.artifactCid,
      empty: "No handshake CID yet",
      href: data.latestCrossAgentHandshake?.explorerUrl,
      linkLabel: "Open handshake tx on Chainscan",
    },
  ];
  const quickReviewPoints = [
    "Open `/judge` as the submission entry point to see the latest wallet result first.",
    `Follow the latest tx link and the CID to verify the current ${data.reviewNetworkLabel.toLowerCase()} proof externally.`,
    "Jump to `/history` or `/agents` only if you want more context on the same snapshot.",
    "Use `Exit judge mode` in the sidebar anytime to return to the normal wallet flow.",
  ];
  const projectProfiles = [
    {
      label: "GitHub",
      href: "https://github.com/clawhubs/yieldboost",
      sublabel: "clawhubs/yieldboost",
      icon: GitBranch,
      download: false,
    },
    {
      label: "X",
      href: "https://x.com/YieldboostAi",
      sublabel: "@YieldboostAi",
      icon: ArrowUpRight,
      download: false,
    },
    {
      label: "Pitch Deck",
      href: "/pitchdeck/yieldboost-pitchdeck.html",
      sublabel: "HTML preview",
      icon: ExternalLink,
      download: false,
    },
    {
      label: "PDF",
      href: "/pitchdeck/yieldboost-pitchdeck.pdf",
      sublabel: "Download deck",
      icon: ExternalLink,
      download: true,
    },
  ];

  const eyebrowClass =
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7e8d99]";
  const cardTitleClass = "text-[15px] font-semibold leading-tight text-white";
  const monoValueClass =
    "font-mono break-all text-[12px] leading-6 text-[#d8e4ee]";
  const linkPillClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,221,208,0.32)] bg-[rgba(34,221,208,0.10)] px-3 py-1.5 text-[11px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.55)] hover:bg-[rgba(34,221,208,0.18)] hover:text-white";
  const linkPillNeutralClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[11px] font-semibold text-[#d8e1e8] transition hover:border-[rgba(255,255,255,0.24)] hover:text-white";
  const sectionShellClass = "yb-card rounded-[20px] px-5 py-6";
  const sectionHeaderRowClass = "flex flex-wrap items-start justify-between gap-3";
  const sectionTitleClass =
    "font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight text-white";
  const sectionHelperClass = "mt-1 text-[13px] leading-6 text-[#9faab6]";
  const subCardClass =
    "rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4";

  return (
    <section data-testid="judge-page" className="space-y-3 p-[10px] md:space-y-4">
      <JudgeModeBootstrap />
      <JudgeSnapshotAutoRefresh />
      <header className="yb-card rounded-[20px] px-5 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Judge Mode
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              {reviewingMainnet ? "Mainnet review starts here." : "Testnet comparison snapshot."}
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#9daab6]">
              {reviewingMainnet
                ? "YieldBoost AI turns idle crypto balances into a better low-risk yield route, shows the decision clearly, and keeps the latest wallet proof ready for external verification. This page stays read-only so a judge can inspect the current result without rerunning the flow."
                : "This secondary view scopes the same judge wallet to the testnet proof ledger, so reviewers can compare build history without leaving the read-only audit surface."}
            </p>
            <div className="mt-5 grid w-full gap-[10px] md:grid-cols-3">
              {[
                {
                  title: "What it solves",
                  body: "Idle or underused wallet balances are routed into a clearer yield opportunity instead of sitting unproductive.",
                },
                {
                  title: "What to audit",
                  body: "Latest route, APY lift, snapshot value, and the proof receipt tied to the current judge wallet.",
                },
                {
                  title: "What is live",
                  body: reviewingMainnet
                    ? "0G Mainnet proof data, explorer links, and ProofRegistry anchoring from the latest recorded run."
                    : "A testnet proof snapshot for comparison, while Mainnet remains the production review target.",
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
            <JudgeNetworkSwitcher reviewNetworkKey={data.reviewNetwork} />
            <div className="mt-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-3">
              {projectProfiles.map((profile) => {
                const Icon = profile.icon;
                return (
                  <a
                    key={profile.label}
                    href={profile.href}
                    target="_blank"
                    rel="noreferrer"
                    download={profile.download ? "" : undefined}
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

      <div className="space-y-3 md:space-y-4">
        <details className="yb-card group rounded-[20px] px-5 py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>How judges should review this submission</h2>
                <p className={sectionHelperClass}>
                  Keep the main screen short, expand only if you want the review path.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d7e0e8] transition group-open:border-[rgba(34,221,208,0.32)] group-open:text-[#9ff7f0]">
              <span className="group-open:hidden">Expand</span>
              <span className="hidden group-open:inline">Collapse</span>
            </span>
          </summary>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {quickReviewPoints.map((step) => (
              <div
                key={step}
                className={`${subCardClass} flex items-start gap-3 text-[13px] leading-6 text-[#dce5ec]`}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#2fe06d]" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </details>

        <section className={sectionShellClass}>
          <div className={sectionHeaderRowClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>Latest proof and wallet snapshot</h2>
                <p className={sectionHelperClass}>
                  The current result for the active judge wallet, with proof and links kept visible in one place.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22ddd0] shadow-[0_0_12px_rgba(34,221,208,0.7)]" />
              Live snapshot
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.latestProofCards.map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-[16px] border border-[rgba(34,221,208,0.18)] bg-[linear-gradient(180deg,rgba(34,221,208,0.07)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.7),transparent)]" />
                <div className={eyebrowClass}>{card.label}</div>
                <div className={`mt-2 text-[22px] font-semibold leading-tight ${toneClass(card.tone)}`}>
                  {card.value}
                </div>
                <div className="mt-3 text-[12px] leading-6 text-[#cdd7e0]">
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
        </section>

        <section className={sectionShellClass}>
          <div className={sectionHeaderRowClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>Integrity memory stack</h2>
                <p className={sectionHelperClass}>
                  Backend-backed artifacts for memory persistence, blacklist defense, and historical validation.
                </p>
              </div>
            </div>
            {data.latestStressReport?.explorerUrl ? (
              <a
                href={data.latestStressReport.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className={linkPillClass}
              >
                Verify report
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.integrityStackCards.map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-[14px] border border-[rgba(34,221,208,0.16)] bg-[linear-gradient(180deg,rgba(34,221,208,0.07),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.7),transparent)]" />
                <div className="flex items-start justify-between gap-2">
                  <div className={cardTitleClass}>{card.label}</div>
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#22ddd0] shadow-[0_0_18px_rgba(34,221,208,0.72)]" />
                </div>
                <div className={`mt-3 text-[20px] font-semibold leading-tight ${toneClass(card.tone)}`}>
                  {card.value}
                </div>
                <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{card.helper}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
            <div className="flex items-center gap-2 text-[#9ff7f0]">
              <Hash className="h-4 w-4" />
              <span className={eyebrowClass}>Evidence anchors</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {integrityEvidenceArtifacts.map((artifact) => (
                <div key={artifact.label} className={subCardClass}>
                  <div className={eyebrowClass}>{artifact.label}</div>
                  <div className={`mt-2 ${monoValueClass}`}>
                    {artifact.value ?? (
                      <span className="font-sans text-[#7a8693]">{artifact.empty}</span>
                    )}
                  </div>
                  {artifact.href ? (
                    <a
                      href={artifact.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-3 ${linkPillClass}`}
                    >
                      {artifact.linkLabel}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={sectionShellClass}>
          <div className={sectionHeaderRowClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>Verification payload</h2>
                <p className={sectionHelperClass}>
                  Storage CID, registry contract, and explorer links to verify the latest proof externally.
                </p>
              </div>
            </div>
            {integrityAudit ? (
              <div
                data-testid="judge-integrity-auditor"
                className={`inline-flex flex-wrap items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                  integrityApproved
                    ? "border-[rgba(47,224,109,0.28)] bg-[rgba(47,224,109,0.08)] text-[#68ff7a]"
                    : "border-[rgba(255,105,105,0.32)] bg-[rgba(255,105,105,0.06)] text-[#ff9a9a]"
                }`}
              >
                <BadgeCheck className="h-4 w-4" />
                Integrity Auditor: {integrityApproved ? "Approved" : "Rejected"}
                <span className="font-medium text-[#d7e0e8]">
                  {integrityApproved ? "Logic Guardrail passed" : "Proof write blocked"}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className={subCardClass}>
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-[#9ff7f0]" />
                <div className={eyebrowClass}>Storage CID</div>
              </div>
              <div className={`mt-2 ${monoValueClass}`}>
                {data.latestProof?.cid ?? (
                  <span className="font-sans text-[#7a8693]">No proof recorded yet</span>
                )}
              </div>
            </div>
            <div className={subCardClass}>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#9ff7f0]" />
                <div className={eyebrowClass}>ProofRegistry contract</div>
              </div>
              <div className={`mt-2 ${monoValueClass}`}>{proofRegistryValue}</div>
            </div>
            <div className={subCardClass}>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-[#9ff7f0]" />
                <div className={eyebrowClass}>Explorer</div>
              </div>
              {latestExplorerUrl ? (
                <a
                  href={latestExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-3 ${linkPillClass}`}
                >
                  {latestExplorerLabel}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <div className="mt-2 text-[12px] leading-6 text-[#7a8693]">No explorer URL yet</div>
              )}
            </div>
            <div className={subCardClass}>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-3.5 w-3.5 text-[#9ff7f0]" />
                <div className={eyebrowClass}>ProofRegistry tx</div>
              </div>
              {data.latestProof?.proofRegistryExplorerUrl ? (
                <a
                  href={data.latestProof.proofRegistryExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-3 ${linkPillClass}`}
                >
                  Open anchor tx
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <div className="mt-2 text-[12px] leading-6 text-[#7a8693]">No registry tx yet</div>
              )}
            </div>
          </div>
        </section>

        <section className={sectionShellClass}>
          <div className="flex items-start gap-3">
            <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className={sectionTitleClass}>Wallet and proof store</h2>
              <p className={sectionHelperClass}>
                Pinned judge wallet, recorded proof store, and the active Agent NFT contract.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className={subCardClass}>
              <div className={eyebrowClass}>Judge wallet</div>
              <div className={`mt-2 ${monoValueClass} text-[13px] text-white`}>
                {reviewWalletCard?.value ?? "Pending wallet"}
              </div>
              <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">
                {reviewWalletCard?.helper ?? "Judge mode follows the wallet active in this browser session."}
              </div>
            </div>
            <div className={subCardClass}>
              <div className={eyebrowClass}>Proof store</div>
              <div className={`mt-2 text-[14px] font-semibold ${toneClass(proofStoreCard?.tone)}`}>
                {proofStoreValue}
              </div>
              <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{proofStoreCard?.helper}</div>
            </div>
            <div className={subCardClass}>
              <div className={eyebrowClass}>Pinned wallet</div>
              <div className={`mt-2 ${monoValueClass} text-[13px] text-white`}>
                Judge wallet: {reviewWalletCard?.value ?? "Pending wallet"}
              </div>
              <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">
                <BrowserTimeLabel
                  value={data.latestProof?.timestamp}
                  prefix="Latest proof recorded"
                  emptyLabel={latestProofHistoryCard?.helper ?? "No proof timestamp recorded yet."}
                />
              </div>
            </div>
            {inftComponent?.address ? (
              <div className={subCardClass}>
                <div className={eyebrowClass}>INFT contract</div>
                <div className={`mt-2 ${monoValueClass} text-[13px] text-white`}>
                  {inftComponent.address}
                </div>
                <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">
                  {data.reviewNetworkLabel} Agent NFT contract address used by the app.
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className={sectionShellClass}>
          <div className={sectionHeaderRowClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>{data.reviewNetworkLabel} deployment artifacts</h2>
                <p className={sectionHelperClass}>
                  Contract and NFT artifacts scoped to the active judge review network.
                </p>
              </div>
            </div>
            <Link href="/marketplace" className={linkPillNeutralClass}>
              Open marketplace
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.deploymentArtifacts.map((artifact) => (
              <div
                key={artifact.label}
                className="relative overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.6),transparent)]" />
                <div className="flex items-start justify-between gap-2">
                  <div className={eyebrowClass}>{artifact.label}</div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${statusBadgeClass(artifact.status)}`}
                  >
                    {artifact.status}
                  </span>
                </div>
                <div className={`mt-2 ${monoValueClass} text-[14px] font-semibold text-white`}>
                  {artifact.value}
                </div>
                <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{artifact.helper}</div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(255,255,255,0.05)] pt-3">
                  <span className="text-[11px] text-[#8ea1af]">{artifact.meta}</span>
                  {artifact.href ? (
                    <a
                      href={artifact.href}
                      target="_blank"
                      rel="noreferrer"
                      className={linkPillClass}
                    >
                      Open ChainScan
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionShellClass}>
          <div className="flex items-start gap-3">
            <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className={sectionTitleClass}>0G components in use</h2>
              <p className={sectionHelperClass}>
                Core 0G primitives wired into the optimizer flow, kept close for faster audit.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {primaryComponents.map((component) => (
              <div key={component.title} className={subCardClass}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-[#9ff7f0]" />
                    <div className={cardTitleClass}>{component.title}</div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${statusBadgeClass(component.status)}`}
                  >
                    {component.status}
                  </span>
                </div>
                <div className="mt-3 text-[12px] leading-6 text-[#cdd7e0]">{component.detail}</div>
                {component.address ? (
                  <div className={`mt-3 ${monoValueClass}`}>{component.address}</div>
                ) : null}
                {component.meta ? (
                  <div className="mt-2 text-[11px] text-[#8ea1af]">{component.meta}</div>
                ) : null}
                {component.href ? (
                  <a
                    href={component.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-3 ${linkPillClass}`}
                  >
                    Open reference
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-3 md:gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <section className={sectionShellClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>Reasoning snapshot</h2>
                <p className={sectionHelperClass}>
                  The decision narrative tied to the latest stored proof.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[14px] border-l-2 border-[rgba(34,221,208,0.55)] bg-[rgba(34,221,208,0.04)] px-4 py-4 text-[14px] leading-7 text-[#e2ecf3]">
              {data.latestProof?.decision.reasoning ?? "No stored reasoning available yet."}
            </div>
          </section>

          <section className={sectionShellClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>Runtime efficiency</h2>
                <p className={sectionHelperClass}>
                  Caching, embedding, and prompt-compression status for the optimizer.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.efficiencyCards.map((card) => (
                <div key={card.label} className={subCardClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className={eyebrowClass}>{card.label}</div>
                    <span className={`text-[12px] font-semibold ${toneClass(card.tone)}`}>{card.value}</span>
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#cdd7e0]">{card.helper}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className={sectionShellClass}>
          <div className="flex items-start gap-3">
            <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className={sectionTitleClass}>Data safety</h2>
              <p className={sectionHelperClass}>
                Kept short on purpose for judges, with deeper notes available in the docs center.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
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
              <div key={item.title} className={subCardClass}>
                <div className={cardTitleClass}>{item.title}</div>
                <div className="mt-2 text-[13px] leading-6 text-[#cdd7e0]">{item.body}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
