"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import PulsingDot from "@/components/ui/PulsingDot";

interface OptimizationBannerProps {
  onOpenProof: () => void;
}

export default function OptimizationBanner({
  onOpenProof,
}: OptimizationBannerProps) {
  return (
    <section
      data-testid="proof-banner"
      className="surface-panel teal-ring flex flex-col gap-4 rounded-[28px] p-5 md:flex-row md:items-center md:justify-between md:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[rgba(0,201,177,0.12)] p-3 text-[var(--accent-teal)]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">Live On-Chain Optimization</p>
            <PulsingDot color="#61f29f" />
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Analyzed by 0G Compute, stored on 0G Storage, and ready for proof inspection.
          </p>
        </div>
      </div>

      <button
        type="button"
        data-testid="view-proof-banner"
        onClick={onOpenProof}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-[var(--accent-teal)] transition hover:bg-[rgba(0,201,177,0.08)]"
      >
        View Latest Proof
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </section>
  );
}
