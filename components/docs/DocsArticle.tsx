import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Link2 } from "lucide-react";
import type { DocNavItem, DocPage } from "@/lib/docs/content";

interface DocsArticleProps {
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

function calloutClasses(tone: "teal" | "green" | "amber") {
  if (tone === "green") {
    return "border-[rgba(97,242,159,0.18)] bg-[rgba(97,242,159,0.08)] text-[#e8fff1]";
  }

  if (tone === "amber") {
    return "border-[rgba(247,185,85,0.18)] bg-[rgba(247,185,85,0.08)] text-[#fff4da]";
  }

  return "border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] text-[#ebfffd]";
}

export default function DocsArticle({
  page,
  previous,
  next,
}: DocsArticleProps) {
  return (
    <div className="grid gap-[10px] 2xl:grid-cols-[minmax(0,1fr)_260px]">
      <article
        data-testid="docs-article"
        className="space-y-[10px]"
      >
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

        {page.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="yb-card rounded-[18px] px-5 py-5 scroll-mt-24"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <Link2 className="h-3.5 w-3.5" />
              <a href={`#${section.id}`}>{section.id}</a>
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[26px] font-semibold text-white md:text-[32px]">
              {section.title}
            </h2>
            {section.intro ? (
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#d8e1e8]">
                {section.intro}
              </p>
            ) : null}

            {section.paragraphs ? (
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="max-w-4xl text-[15px] leading-7 text-[#9daab6]">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {section.bullets ? (
              <ul className="mt-5 space-y-3">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="glass-inset rounded-[14px] px-4 py-4 text-[14px] leading-6 text-[#d8e1e8]"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            {section.steps ? (
              <ol className="mt-5 grid gap-3 lg:grid-cols-2">
                {section.steps.map((step, index) => (
                  <li key={step.title} className="yb-soft-card rounded-[16px] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="glass-accent flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-[#22ddd0]">
                        {index + 1}
                      </div>
                      <h3 className="text-[16px] font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="mt-3 text-[14px] leading-6 text-[#9daab6]">{step.body}</p>
                  </li>
                ))}
              </ol>
            ) : null}

            {section.callout ? (
              <aside
                className={`mt-5 rounded-[16px] border px-4 py-4 ${calloutClasses(section.callout.tone)}`}
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                  {section.callout.title}
                </p>
                <p className="mt-2 text-[14px] leading-6 text-inherit/90">
                  {section.callout.body}
                </p>
              </aside>
            ) : null}

            {section.table ? (
              <div className="mt-5 overflow-hidden rounded-[16px] border border-white/7">
                {section.table.caption ? (
                  <div className="bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[12px] text-[#9daab6]">
                    {section.table.caption}
                  </div>
                ) : null}
                <div
                  className="grid gap-3 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#8ea1af]"
                  style={{ gridTemplateColumns: `repeat(${section.table.columns.length}, minmax(0, 1fr))` }}
                >
                  {section.table.columns.map((column) => (
                    <div key={column}>{column}</div>
                  ))}
                </div>
                <div className="divide-y divide-white/6">
                  {section.table.rows.map((row, rowIndex) => (
                    <div
                      key={`${section.id}-row-${rowIndex}`}
                      className="grid gap-3 px-4 py-4 text-[13px] leading-6 text-[#d8e1e8]"
                      style={{ gridTemplateColumns: `repeat(${section.table!.columns.length}, minmax(0, 1fr))` }}
                    >
                      {row.map((cell, cellIndex) => (
                        <div key={`${section.id}-${rowIndex}-${cellIndex}`}>{cell}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {section.code ? (
              <div className="mt-5 overflow-hidden rounded-[16px] border border-white/7">
                <div className="flex items-center justify-between gap-3 bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-[12px] uppercase tracking-[0.16em] text-[#8ea1af]">
                    {section.code.title}
                  </p>
                  <code className="text-[12px] text-[#22ddd0]">{section.code.language}</code>
                </div>
                <pre className="overflow-x-auto bg-[#050a11] px-4 py-4 text-[13px] leading-6 text-[#d8e1e8]">
                  <code>{section.code.code}</code>
                </pre>
              </div>
            ) : null}
          </section>
        ))}

        <nav
          aria-label="Documentation pagination"
          className="grid gap-[10px] md:grid-cols-2"
        >
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

      <aside
        aria-label="Page outline"
        data-testid="docs-toc"
        className="hidden 2xl:block"
      >
        <div className="yb-card sticky top-[10px] rounded-[18px] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
            On This Page
          </p>
          <div className="mt-3 space-y-2">
            {page.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="glass-inset block rounded-[12px] px-3 py-3 text-[13px] text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.2)]"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
