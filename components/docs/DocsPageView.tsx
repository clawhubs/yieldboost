import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import DocsRichContent from "@/components/docs/DocsRichContent";
import DocsShell from "@/components/docs/DocsShell";
import type { DocNavItem, DocPage } from "@/lib/docs/content";

interface DocsPageViewProps {
  page: DocPage;
  previous: DocNavItem | null;
  next: DocNavItem | null;
}

function summaryToneClass(tone: DocPage["summary"][number]["tone"] = "white") {
  if (tone === "teal") return "text-[#22ddd0]";
  if (tone === "green") return "text-[#61f29f]";
  if (tone === "amber") return "text-[#f7b955]";
  return "text-white";
}

export default function DocsPageView({ page, previous, next }: DocsPageViewProps) {
  return (
    <DocsShell
      toc={page.sections.map((section) => ({ id: section.id, title: section.title }))}
    >
      <article data-testid="docs-article" className="space-y-[10px]">
        <header className="yb-card rounded-[18px] px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="glass-accent inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
                {page.category}
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
                {page.label}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
                {page.description}
              </p>
            </div>

            <aside className="yb-soft-card rounded-[16px] px-4 py-4 xl:max-w-[320px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
                Quick Links
              </p>
              <div className="mt-3 space-y-2">
                {page.quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="glass-inset flex items-center justify-between rounded-[12px] px-3 py-3 text-[13px] text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.2)]"
                  >
                    <span>{item.label}</span>
                    <ExternalLink className="h-4 w-4 text-[#8ea1af]" />
                  </Link>
                ))}
              </div>
            </aside>
          </div>

          <div className="mt-5 grid gap-[10px] md:grid-cols-3">
            {page.summary.map((item) => (
              <div key={item.label} className="yb-soft-card rounded-[14px] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#8ea1af]">
                  {item.label}
                </p>
                <p className={`mt-2 text-[20px] font-semibold leading-7 ${summaryToneClass(item.tone)}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <DocsRichContent sections={page.sections} />

        <nav aria-label="Documentation pagination" className="grid gap-[10px] md:grid-cols-2">
          {previous ? (
            <Link
              href={previous.href}
              className="yb-card rounded-[18px] px-5 py-4 transition hover:border-[rgba(0,201,177,0.2)]"
            >
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </p>
              <p className="mt-2 text-[18px] font-semibold text-white">{previous.label}</p>
              <p className="mt-1 text-[13px] leading-6 text-[#9daab6]">{previous.description}</p>
            </Link>
          ) : (
            <div className="yb-soft-card rounded-[18px] px-5 py-4 text-[13px] text-[#8ea1af]">
              You are at the first page in the docs flow.
            </div>
          )}

          {next ? (
            <Link
              href={next.href}
              className="yb-card rounded-[18px] px-5 py-4 text-right transition hover:border-[rgba(0,201,177,0.2)]"
            >
              <p className="flex items-center justify-end gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </p>
              <p className="mt-2 text-[18px] font-semibold text-white">{next.label}</p>
              <p className="mt-1 text-[13px] leading-6 text-[#9daab6]">{next.description}</p>
            </Link>
          ) : (
            <div className="yb-soft-card rounded-[18px] px-5 py-4 text-[13px] text-[#8ea1af]">
              You have reached the current end of the docs flow.
            </div>
          )}
        </nav>
      </article>
    </DocsShell>
  );
}
