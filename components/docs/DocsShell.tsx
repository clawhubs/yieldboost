import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import DocsSidebarNav from "@/components/docs/DocsSidebarNav";
import DocsTableOfContents from "@/components/docs/DocsTableOfContents";
import type {
  DocsAction,
  DocsMetric,
  DocsTableOfContentsItem,
} from "@/lib/docs/content";

function accentValueClass(tone: DocsMetric["tone"] = "white") {
  if (tone === "green") return "text-[#2fe06d]";
  if (tone === "teal") return "text-[#22ddd0]";
  return "text-white";
}

interface DocsShellProps {
  activeSlug?: string;
  badge: string;
  title: string;
  description: string;
  actions?: DocsAction[];
  metrics?: DocsMetric[];
  toc?: DocsTableOfContentsItem[];
  audience?: string;
  readTime?: string;
  updatedAt?: string;
  children: ReactNode;
}

export default function DocsShell({
  activeSlug,
  badge,
  title,
  description,
  actions = [],
  metrics = [],
  toc = [],
  audience,
  readTime,
  updatedAt,
  children,
}: DocsShellProps) {
  return (
    <section className="space-y-[10px] p-[10px]">
      <header className="yb-card rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              {badge}
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">{description}</p>
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {actions.map((action) =>
                action.tone === "primary" ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="yb-teal-button inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-[14px] font-semibold text-[#071217]"
                  >
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="glass-inset inline-flex items-center gap-2 rounded-[12px] px-4 py-3 text-[13px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.25)]"
                  >
                    {action.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ),
              )}
            </div>
          ) : null}
        </div>

        {metrics.length > 0 ? (
          <div className="mt-5 grid gap-[10px] md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="yb-soft-card rounded-[14px] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#a7b3be]">
                  {metric.label}
                </div>
                <div className={`mt-2 text-[24px] font-semibold ${accentValueClass(metric.tone)}`}>
                  {metric.value}
                </div>
                <div className="mt-1 text-[12px] leading-6 text-[#d6dee6]">{metric.helper}</div>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <div className="grid gap-[10px] xl:grid-cols-[260px_minmax(0,1fr)_240px]">
        <aside className="min-w-0">
          <DocsSidebarNav activeSlug={activeSlug} />
        </aside>

        <div className="min-w-0">{children}</div>

        <aside className="hidden min-w-0 xl:block">
          <DocsTableOfContents
            items={toc}
            audience={audience}
            readTime={readTime}
            updatedAt={updatedAt}
          />
        </aside>
      </div>
    </section>
  );
}
