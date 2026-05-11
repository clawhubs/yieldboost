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
  Map,
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

function formatJudgePercent(value: number | undefined) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "Pending proof";
}

function formatJudgeCurrency(value: number | undefined) {
  if (typeof value !== "number") return "Pending proof";

  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value > 0 && value < 1 ? 4 : 2,
  })}`;
}

export default async function JudgePage() {
  const data = await getJudgePageData();
  const reviewingMainnet = data.reviewNetwork === "mainnet";
  const latestDecision = data.latestProof?.decision;
  const primaryComponents = data.components.filter((component) =>
    ["0G Storage", "0G Compute Network", "ProofRegistry"].includes(component.title),
  );
  const inftComponent = data.components.find((component) => component.title === "Yield Strategy INFT");
  const proofRegistryValue =
    data.latestProof?.proofRegistryAddress ?? "Placeholder: set ProofRegistry env for the active network";
  const reviewWalletCard = data.statusCards.find((card) => card.label === "Review Wallet");
  const proofStoreCard = data.statusCards.find((card) => card.label === "Proof Store");
  const latestProofHistoryCard = data.latestProofCards.find((card) => card.label === "Proof History");
  const proofStoreValue = proofStoreCard?.value?.includes(".artifacts/runtime-store")
    ? "Recorded review snapshot"
    : proofStoreCard?.value ?? "Recorded review snapshot";
  const latestExplorerUrl =
    data.latestProof?.proofRegistryExplorerUrl ?? data.latestProof?.explorerUrl;
  const latestExplorerLabel = data.latestProof?.proofRegistryExplorerUrl
    ? "Open ProofRegistry tx"
    : "Open latest tx";
  const integrityAudit = data.latestProof?.integrityAudit;
  const integrityApproved = integrityAudit?.status === "APPROVED";
  const sentinelProof = data.latestProof?.sentinelProof;
  const teeVerified = data.latestProof?.teeVerified === true;
  const teeResponseSignatureVerified =
    teeVerified &&
    data.latestProof?.teeVerificationMethod === "broker-response-signature";
  const teeServiceVerified =
    data.latestProof?.teeServiceAttestationVerified === true ||
    data.latestProof?.teeServiceSignerMatched === true ||
    data.latestProof?.teeServiceComposeVerified === true;
  const networkProofStackCards: Array<{
    label: string;
    value: string;
    helper: string;
    tone: "teal" | "green" | "amber" | "white";
  }> = [
    {
      label: "ZK Agent Identity",
      value:
        sentinelProof?.status === "verified"
          ? "Verified"
        : sentinelProof?.status
          ? sentinelProof.status
          : data.latestProof
            ? "ZK proof pending"
            : "Awaiting first proof",
      helper: sentinelProof
        ? `Circuit ${sentinelProof.circuit}; verifier ${sentinelProof.verifier}; nullifier ${sentinelProof.publicSignals.sessionNullifier ?? "pending"}.`
        : data.latestProof
          ? `Latest ${data.reviewNetworkLabel.toLowerCase()} proof has storage/TEE evidence; run 1-click optimize once more after the ZK prover is enabled to attach agent_identity.`
          : `Run 1-click optimize on ${data.reviewNetworkLabel.toLowerCase()} to attach the ZK agent_identity proof to the judge snapshot.`,
      tone: sentinelProof?.status === "verified" ? "green" : "amber",
    },
    {
      label: "0G Compute model",
      value: data.latestProof?.teeModel ?? (reviewingMainnet ? "openai/gpt-5.4-mini" : "Pending"),
      helper: data.latestProof?.teeProvider
        ? `Provider ${data.latestProof.teeProvider}. ${data.reviewNetworkLabel} compute requests are tied to this snapshot.`
        : reviewingMainnet
          ? "Mainnet provider is configured for GPT-5.4 Mini; the next verified run will attach the provider address."
          : `Run 1-click optimize on ${data.reviewNetworkLabel.toLowerCase()} to attach the compute model and provider address.`,
      tone: data.latestProof?.teeModel || reviewingMainnet ? "teal" : "amber",
    },
    {
      label: "TEE response signature",
      value: teeResponseSignatureVerified ? "Verified" : teeVerified ? "Service verified" : "Pending",
      helper: teeResponseSignatureVerified
        ? `broker.processResponse returned true using ZG-Res-Key ${data.latestProof?.teeChatId ?? "from the response header"}.`
        : teeServiceVerified
          ? "TEE service attestation is verified; response-level signature is shown only after a ZG-Res-Key run."
          : "The UI does not claim response verification until ZG-Res-Key signature verification succeeds.",
      tone: teeResponseSignatureVerified ? "green" : teeVerified ? "teal" : "amber",
    },
    {
      label: "0G Storage / anchor",
      value: data.latestProof?.proofRegistryProofId
        ? `Proof #${data.latestProof.proofRegistryProofId}`
        : data.latestProof?.cid
          ? "Storage CID ready"
          : "Pending",
      helper: data.latestProof?.proofRegistryExplorerUrl
        ? "Latest optimization is stored on 0G and anchored through ProofRegistry."
        : data.latestProof?.cid
          ? "Latest optimization is stored on 0G; ProofRegistry anchor is shown when available."
          : `The next ${data.reviewNetworkLabel.toLowerCase()} optimize run will attach storage and anchor metadata.`,
      tone: data.latestProof?.proofRegistryProofId ? "green" : data.latestProof?.cid ? "teal" : "amber",
    },
  ];
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
      label: "ZK Policy CID",
      value: data.latestZkComplianceProof?.artifactCid,
      empty: "No policy seal CID yet",
      href:
        data.latestZkComplianceProof?.proofRegistryExplorerUrl ??
        data.latestZkComplianceProof?.explorerUrl,
      linkLabel: data.latestZkComplianceProof?.proofRegistryExplorerUrl
        ? "Open policy seal anchor on Chainscan"
        : "Open policy seal tx on Chainscan",
    },
    {
      label: "Zero-Knowledge Proof CID",
      value: data.latestZkReasoningProof?.proofCid,
      empty: "No zero-knowledge proof CID yet",
      href:
        data.latestZkReasoningProof?.proofRegistryExplorerUrl ??
        data.latestZkReasoningProof?.explorerUrl,
      linkLabel: data.latestZkReasoningProof?.proofRegistryExplorerUrl
        ? "Open zero-knowledge proof anchor on Chainscan"
        : "Open zero-knowledge proof tx on Chainscan",
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
      external: true,
    },
    {
      label: "X",
      href: "https://x.com/YieldboostAi",
      sublabel: "@YieldboostAi",
      icon: ArrowUpRight,
      download: false,
      external: true,
    },
    {
      label: "Pitch Deck",
      href: "/pitchdeck/yieldboost-pitchdeck.html",
      sublabel: "HTML preview",
      icon: ExternalLink,
      download: false,
      external: true,
    },
    {
      label: "Judge Brief",
      href: "/judge/project",
      sublabel: "30-second read",
      icon: FileText,
      download: false,
      external: false,
    },
    {
      label: "Roadmap",
      href: "/judge/roadmap",
      sublabel: "2026-2027 plan",
      icon: Map,
      download: false,
      external: false,
    },
    {
      label: "PDF",
      href: "/pitchdeck/yieldboost-pitchdeck.pdf",
      sublabel: "Download deck",
      icon: ExternalLink,
      download: true,
      external: false,
    },
  ];
  const reasoningNarrative =
    latestDecision?.reasoning?.trim() ||
    "No stored reasoning is available yet. Judge Mode is still ready for review through the latest proof cards, deployment artifacts, and evidence anchors below.";
  const reasoningAuditCards: Array<{
    label: string;
    value: string;
    helper: string;
    tone: "teal" | "green" | "amber" | "white";
  }> = [
    {
      label: "Decision under review",
      value: latestDecision?.recommended ?? "Pending proof",
      helper: "The narrative must explain this exact route, not generic DeFi advice.",
      tone: latestDecision ? "teal" : "amber",
    },
    {
      label: "APY claim",
      value: latestDecision
        ? `${formatJudgePercent(latestDecision.current_apy)} -> ${formatJudgePercent(latestDecision.optimized_apy)}`
        : "Pending proof",
      helper: "Before/after APY is pulled from the stored proof payload.",
      tone: latestDecision ? "green" : "amber",
    },
    {
      label: "Projected annual gain",
      value: formatJudgeCurrency(
        latestDecision?.estimatedAnnualGain ?? latestDecision?.yield_increase,
      ),
      helper: "Financial upside is review context, not a guaranteed return.",
      tone: latestDecision ? "white" : "amber",
    },
    {
      label: "Guardrail result",
      value: integrityAudit
        ? integrityApproved
          ? `Approved - score ${integrityAudit.score}`
          : `Rejected - score ${integrityAudit.score}`
        : "Auditor pending",
      helper: integrityAudit
        ? "Integrity Auditor checked the decision before downstream proof surfaces rely on it."
        : "The page will expose approval or rejection as soon as the latest proof includes an audit result.",
      tone: integrityAudit ? (integrityApproved ? "green" : "amber") : "white",
    },
  ];
  const reasoningTrace = [
    "Wallet-scoped snapshot constrains the recommendation to the review wallet and active network.",
    "Prompt compression, cache, and embedding reuse keep repeated asks consistent before inference.",
    "Storage CID and ProofRegistry links bind the decision narrative to an external verification path.",
  ];

  const eyebrowClass =
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]";
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
  const sectionHelperClass = "mt-1 text-[13px] leading-6 text-[#b3c0cc]";
  const subCardClass =
    "rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4";

  return (
    <section data-testid="judge-page" className="space-y-3 p-[10px] md:space-y-4">
      <JudgeModeBootstrap />
      <JudgeSnapshotAutoRefresh />
      <header className="fade-in-up relative overflow-hidden yb-card rounded-[20px] px-5 py-6">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.85),transparent)]" />
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Judge Mode
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.08] text-white md:text-[40px]">
              {reviewingMainnet ? "Mainnet review starts here." : "Testnet comparison snapshot."}
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#b8c6d2]">
              {reviewingMainnet
                ? "YieldBoost AI turns idle crypto balances into a better low-risk yield route, shows the decision clearly, and keeps the latest wallet proof ready for external verification. This page stays read-only so a judge can inspect the current result without rerunning the flow."
                : "This secondary view scopes the same judge wallet to the testnet proof ledger, so reviewers can compare build history without leaving the read-only audit surface."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
              {[
                { v: "9", l: "Layers", c: "text-[#22ddd0]" },
                { v: String(data.proofCount || (data.latestProof ? 1 : 0)), l: "Proofs", c: "text-[#68ff7a]" },
                { v: reviewingMainnet ? "MAINNET" : "TESTNET", l: "Network", c: "text-[#f6c166]" },
                { v: "0G", l: "Native", c: "text-[#63d8ff]" },
              ].map((m) => (
                <div key={m.l} className="text-center">
                  <div className={`text-[24px] font-bold leading-none ${m.c}`}>{m.v}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8ea1af]">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid w-full gap-[10px] md:grid-cols-3">
              {[
                {
                  title: "What it solves",
                  body: "Idle wallet balances routed into better yield with proof behind the route.",
                },
                {
                  title: "What to audit",
                  body: "Latest route, APY lift, snapshot value, and the proof receipt tied to the judge wallet.",
                },
                {
                  title: "What is live",
                  body: reviewingMainnet
                    ? "0G Mainnet proof data, explorer links, and ProofRegistry anchoring."
                    : "0G Testnet proof data, explorer links, and ProofRegistry anchoring.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-inset rounded-[14px] px-4 py-3">
                  <div className="text-[14px] font-semibold text-white">{item.title}</div>
                  <div className="mt-1.5 text-[13px] leading-6 text-[#dce5ec]">{item.body}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2">
              <Link
                href="/"
                className="yb-teal-button inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-[13px] font-semibold text-[#071217]"
              >
                Open dashboard
              </Link>
              <Link
                href="/history"
                className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#d8e1e8]"
              >
                History
              </Link>
              <Link
                href="/agent"
                className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#d8e1e8]"
              >
                Boost flow
              </Link>
              <Link
                href="/agents"
                className="glass-inset inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-[13px] font-medium text-[#d8e1e8]"
              >
                Agents
              </Link>
            </div>
            <JudgeNetworkSwitcher reviewNetworkKey={data.reviewNetwork} />
            <div className="mt-3 flex w-full max-w-3xl flex-wrap items-center justify-center gap-3">
              {projectProfiles.map((profile) => {
                const Icon = profile.icon;
                return (
                  <a
                    key={profile.label}
                    href={profile.href}
                    target={profile.external ? "_blank" : undefined}
                    rel={profile.external ? "noreferrer" : undefined}
                    download={profile.download ? "" : undefined}
                    data-testid={profile.label === "Roadmap" ? "judge-roadmap-link" : undefined}
                    className="glass-inset inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] text-[#d8e1e8] transition hover:border-[rgba(34,221,208,0.28)] hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#22ddd0]" />
                    <span className="font-medium">{profile.label}</span>
                    <span className="text-[#8ea1af]">{profile.sublabel}</span>
                  </a>
                );
              })}
            </div>
            <p className="mt-4 text-[13px] text-[#d8e1e8]">
              Reviewing {data.reviewNetworkLabel} snapshot for the active judge wallet.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-3 md:space-y-4">
        <details className="fade-in-up fade-in-up-1 yb-card group rounded-[20px] px-5 py-5 [&_summary::-webkit-details-marker]:hidden">
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

        <section className={`fade-in-up fade-in-up-2 ${sectionShellClass}`}>
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
                <div className="mt-3 text-[12px] leading-6 text-[#d6e2ea]">
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

        <section
          data-testid="judge-network-sentinel-tee-stack"
          className={`fade-in-up fade-in-up-3 ${sectionShellClass}`}
        >
          <div className={sectionHeaderRowClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>{data.reviewNetworkLabel} ZK + TEE proof stack</h2>
                <p className={sectionHelperClass}>
                  The review path is explicit: ZK agent identity proof, 0G Compute model evidence, response signature status, and 0G Storage anchoring for the active judge network.
                </p>
              </div>
            </div>
            <span
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                teeResponseSignatureVerified && sentinelProof?.status === "verified"
                  ? "border-[rgba(47,224,109,0.28)] bg-[rgba(47,224,109,0.08)] text-[#68ff7a]"
                  : "border-[rgba(246,193,102,0.24)] bg-[rgba(246,193,102,0.08)] text-[#f6c166]"
              }`}
            >
              {teeResponseSignatureVerified && sentinelProof?.status === "verified"
                ? "Response verified"
                : "Transparent status"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {networkProofStackCards.map((card) => (
              <div key={card.label} className={subCardClass}>
                <div className={eyebrowClass}>{card.label}</div>
                <div className={`mt-2 text-[18px] font-semibold leading-tight ${toneClass(card.tone)}`}>
                  {card.value}
                </div>
                <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">{card.helper}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={`fade-in-up fade-in-up-4 ${sectionShellClass}`}>
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
              <div className={`mt-2 ${monoValueClass}`} style={{ wordBreak: "break-all" }}>{proofRegistryValue}</div>
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

        <section className={`fade-in-up fade-in-up-5 ${sectionShellClass}`}>
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
              <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">
                {reviewWalletCard?.helper ?? "Judge mode follows the wallet active in this browser session."}
              </div>
            </div>
            <div className={subCardClass}>
              <div className={eyebrowClass}>Proof store</div>
              <div className={`mt-2 text-[14px] font-semibold ${toneClass(proofStoreCard?.tone)}`}>
                {proofStoreValue}
              </div>
              <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">{proofStoreCard?.helper}</div>
            </div>
            <div className={subCardClass}>
              <div className={eyebrowClass}>Pinned wallet</div>
              <div className={`mt-2 ${monoValueClass} text-[13px] text-white`}>
                Judge wallet: {reviewWalletCard?.value ?? "Pending wallet"}
              </div>
              <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">
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
                <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">
                  {data.reviewNetworkLabel} Agent NFT contract address used by the app.
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className={`fade-in-up ${sectionShellClass}`}>
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
                <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">{artifact.helper}</div>
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

        <section data-testid="judge-integrity-evidence-package" className={`fade-in-up ${sectionShellClass}`}>
          <div className={sectionHeaderRowClass}>
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className={sectionTitleClass}>Military-grade integrity pipeline</h2>
                <p className={sectionHelperClass}>
                  Nine ordered layers use the same YieldBoost names across 1-click optimize, Vault, and the developer marketplace: blacklist, auditor, secure compute, memory, storage proof, ZK proof, registry anchor, governance, and cross-agent handshake.
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
            {data.integrityStackCards.map((card, index) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-[14px] border border-[rgba(34,221,208,0.16)] bg-[linear-gradient(180deg,rgba(34,221,208,0.07),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(34,221,208,0.7),transparent)]" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
                      Layer {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className={`mt-1 ${cardTitleClass}`}>{card.label}</div>
                  </div>
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#22ddd0] shadow-[0_0_18px_rgba(34,221,208,0.72)]" />
                </div>
                <div className={`mt-3 text-[20px] font-semibold leading-tight ${toneClass(card.tone)}`}>
                  {card.value}
                </div>
                <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">{card.helper}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[18px] border border-[rgba(34,221,208,0.16)] bg-[linear-gradient(135deg,rgba(34,221,208,0.08),rgba(255,255,255,0.02)_45%,rgba(47,224,109,0.05))]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.07)] px-4 py-4">
              <div className="flex items-center gap-2 text-[#9ff7f0]">
                <Hash className="h-4 w-4" />
                <span className={eyebrowClass}>Evidence anchors</span>
              </div>
              <span className="rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
                Reviewable trail
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">
              {integrityEvidenceArtifacts.map((artifact) => (
                <div
                  key={artifact.label}
                  className="border-t border-[rgba(255,255,255,0.06)] px-4 py-4 first:border-t-0 md:[&:nth-child(-n+2)]:border-t-0 xl:[&:nth-child(-n+3)]:border-t-0 xl:[&:nth-child(3n+1)]:border-l-0 md:border-l md:border-[rgba(255,255,255,0.06)] md:[&:nth-child(2n+1)]:border-l-0 xl:[&:nth-child(2n+1)]:border-l xl:[&:nth-child(3n+1)]:border-l-0"
                >
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

        <section className={`fade-in-up ${sectionShellClass}`}>
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
                <div className="mt-3 text-[12px] leading-6 text-[#d6e2ea]">{component.detail}</div>
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

        <div className="fade-in-up grid gap-3 md:gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <section data-testid="judge-reasoning-snapshot" className={sectionShellClass}>
            <div className={sectionHeaderRowClass}>
              <div className="flex items-start gap-3">
                <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[14px] text-[#22ddd0]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={sectionTitleClass}>Reasoning snapshot</h2>
                  <p className={sectionHelperClass}>
                    A judge-readable decision brief: what the agent recommended, which numbers it claimed, and how the proof trail keeps that reasoning accountable.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
                Proof-bound narrative
              </span>
            </div>

            <div className="mt-5 rounded-[18px] border border-[rgba(34,221,208,0.18)] bg-[linear-gradient(135deg,rgba(34,221,208,0.10),rgba(255,255,255,0.025)_55%,rgba(47,224,109,0.06))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.24)]">
              <div className="flex items-center gap-2 text-[#9ff7f0]">
                <BadgeCheck className="h-4 w-4" />
                <span className={eyebrowClass}>Stored decision narrative</span>
              </div>
              <p className="mt-3 text-[14px] leading-7 text-[#e8f2f7]">{reasoningNarrative}</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {reasoningAuditCards.map((card) => (
                <div key={card.label} className={subCardClass}>
                  <div className={eyebrowClass}>{card.label}</div>
                  <div className={`mt-2 text-[18px] font-semibold leading-tight ${toneClass(card.tone)}`}>
                    {card.value}
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">{card.helper}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              {reasoningTrace.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] px-3 py-3 text-[12px] leading-6 text-[#d6e2ea]"
                >
                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 flex-none text-[#2fe06d]" />
                  <span>{item}</span>
                </div>
              ))}
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
                  <div className="mt-2 text-[12px] leading-6 text-[#d6e2ea]">{card.helper}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className={`fade-in-up ${sectionShellClass}`}>
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
                <div className="mt-2 text-[13px] leading-6 text-[#d6e2ea]">{item.body}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="fade-in-up relative overflow-hidden yb-card rounded-[20px] px-5 py-8 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.7),transparent)]" />
          <div className="mx-auto max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ea1af]">Continue review</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight text-white md:text-[28px]">
              Proof-first. User product second. All on 0G.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[13px] leading-6 text-[#b3c0cc]">
              Open the project brief for a 30-second overview, the roadmap for timeline context, or the pitch deck for the full story.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/judge/project"
                className={linkPillClass}
              >
                <FileText className="h-3.5 w-3.5" />
                Project brief
              </Link>
              <Link
                href="/judge/roadmap"
                className={linkPillClass}
              >
                <Map className="h-3.5 w-3.5" />
                Roadmap
              </Link>
              <a
                href="/pitchdeck/yieldboost-pitchdeck.html"
                target="_blank"
                rel="noreferrer"
                className={linkPillClass}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Pitch deck
              </a>
              <a
                href="/pitchdeck/yieldboost-pitchdeck.pdf"
                download=""
                className={linkPillNeutralClass}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Download PDF
              </a>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
