import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
} from "lucide-react";

import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

type SnapshotTone = "teal" | "green" | "amber" | "white";

type SnapshotCard = {
  label: string;
  value: string;
  helper: string;
  tone?: SnapshotTone;
};

function toneClass(tone: SnapshotTone = "white") {
  if (tone === "green") return "text-[#68ff7a]";
  if (tone === "amber") return "text-[#ffd666]";
  if (tone === "teal") return "text-[#72f3c7]";
  return "text-white";
}

export default function DevAuditView({
  reviewNetworkLabel,
  proofCount,
  latestProofAt,
  latestProofCards,
  integrityStackCards,
  latestExplorerUrl,
}: {
  reviewNetworkLabel: string;
  proofCount: number;
  latestProofAt: string | null;
  latestProofCards: SnapshotCard[];
  integrityStackCards: SnapshotCard[];
  latestExplorerUrl: string | null;
}) {
  return (
    <DeveloperPortalShell
      eyebrow="YieldBoost AI Protocol Audit"
      title="Verification mirror for buyers who want proof in the same world."
      description="This page mirrors the latest proof-backed result inside the store shell. The logic stays on the same proof backend; this surface is read-only and buyer-facing."
    >
      <section className="glow-card fade-in-up fade-in-up-1 p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/dev"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.28)] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#72f3c7]" />
              Back to store
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.24)] bg-[rgba(0,201,177,0.08)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ff7ea]">
              <FileText className="h-3.5 w-3.5" />
              Audit proof mirror
            </div>
            <h2 className="mt-4 text-[30px] font-extrabold tracking-tight text-white md:text-[38px]">
              One proof path, mirrored inside the store shell.
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#d0dde8]">
              This is the buyer-facing mirror of the latest verification result. The proof logic has not been moved. We only mirror the latest route, artifacts, and 10-layer state here so the store and the proof surface live in one world.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">Review network</p>
              <p className="mt-1 text-[14px] font-semibold text-white">{reviewNetworkLabel}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">Proof runs</p>
              <p className="mt-1 text-[14px] font-semibold text-white">{proofCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-2 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
        <div className="grid gap-3 md:grid-cols-2">
          {latestProofCards.map((card) => (
            <article
              key={card.label}
              className="glow-card px-4 py-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ea1af]">{card.label}</p>
              <p className={`mt-2 text-[22px] font-bold leading-tight ${toneClass(card.tone)}`}>{card.value}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">{card.helper}</p>
            </article>
          ))}
        </div>

        <div className="glow-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">10-layer mirror</p>
              <p className="mt-1 text-[14px] leading-6 text-[#c8dae6]">
                Latest integrity state mirrored from the same backend proof path.
              </p>
            </div>
            {latestProofAt ? (
              <p className="text-right text-[11px] leading-5 text-[#8ea1af]">
                Updated
                <br />
                {new Date(latestProofAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {integrityStackCards.map((card, idx) => (
              <div
                key={card.label}
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.08)] text-[10px] font-bold text-[#72f3c7]">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white">{card.label}</p>
                    <p className={`mt-1 text-[13px] font-semibold ${toneClass(card.tone)}`}>{card.value}</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#a9bfce]">{card.helper}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {latestExplorerUrl ? (
              <Link
                href={latestExplorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)]"
              >
                Open latest proof tx
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href="/dev/brief"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
            >
              Read brief
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </DeveloperPortalShell>
  );
}
