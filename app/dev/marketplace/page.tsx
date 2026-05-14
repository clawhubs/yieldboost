import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DeveloperApiStore from "@/components/dev/DeveloperApiStore";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

export const metadata: Metadata = {
  title: "Modular Immunity Armory - YieldBoost Developer Portal",
  description: "Developer API store for YieldBoost AI Protocol: TITAN X, single-layer APIs, fortress modules, and selected partner SDK wrappers.",
};

export default function DevMarketplacePage() {
  return (
    <DeveloperPortalShell
      eyebrow="Modular Immunity Armory"
      title="Modular Immunity Armory for APIs."
      description="Browse ready-to-call verification APIs, compare endpoint tiers, open playgrounds, and copy integration docs from one modular developer armory."
    >
      <section className="fade-in-up fade-in-up-1 flex flex-wrap gap-3">
        <Link
          href="/dev"
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.25)] hover:bg-[rgba(0,201,177,0.06)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </section>
      <DeveloperApiStore />
    </DeveloperPortalShell>
  );
}
