import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Presentation } from "lucide-react";

import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

export default function DevPitchdeckView() {
  return (
    <DeveloperPortalShell
      eyebrow="YieldBoost AI Protocol Pitch Deck"
      title="Pitch the store, the protocol, and the flagship proof path in one place."
      description="This deck stays inside the /dev world: YieldBoost AI is the company, YieldBoost AI Protocol is the platform, and TITAN X is the flagship full-stack product sold through the store."
    >
      <section className="glow-card fade-in-up fade-in-up-1 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dev"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.28)] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#72f3c7]" />
            Back to store
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pitchdeck/yieldboost-pitchdeck.html"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
            >
              <Presentation className="h-4 w-4 text-[#72f3c7]" />
              Open HTML
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pitchdeck/yieldboost-pitchdeck.pdf"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)]"
            >
              <FileText className="h-4 w-4 text-[#72f3c7]" />
              Open PDF
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[rgba(0,201,177,0.12)] bg-[rgba(3,8,16,0.65)]">
          <iframe
            src="/pitchdeck/yieldboost-pitchdeck.html"
            title="YieldBoost AI Protocol Pitch Deck"
            className="h-[78vh] w-full"
          />
        </div>
      </section>
    </DeveloperPortalShell>
  );
}
