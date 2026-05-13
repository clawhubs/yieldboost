import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

interface SectionItem {
  title: string;
  body: string;
}

export default function DevSimpleInfoView({
  eyebrow,
  title,
  description,
  sections,
  ctaLabel = "Back to store",
  ctaHref = "/dev",
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: SectionItem[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <DeveloperPortalShell eyebrow={eyebrow} title={title} description={description}>
      <section className="glow-card fade-in-up fade-in-up-1 p-6 md:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.28)] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#72f3c7]" />
              {ctaLabel}
            </Link>
            <Link
              href="/dev/marketplace"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)] px-3 py-2 text-[12px] font-medium text-white transition hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
            >
              Open store
              <ArrowRight className="h-3.5 w-3.5 text-[#72f3c7]" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5"
              >
                <h2 className="text-[18px] font-bold text-white">{section.title}</h2>
                <p className="mt-2 text-[14px] leading-7 text-[#d0dde8]">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </DeveloperPortalShell>
  );
}
