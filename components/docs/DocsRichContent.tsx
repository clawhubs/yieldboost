import { Link2 } from "lucide-react";
import type { DocSection } from "@/lib/docs/content";

function calloutClasses(tone: "teal" | "green" | "amber") {
  if (tone === "green") {
    return "border-[rgba(97,242,159,0.18)] bg-[rgba(97,242,159,0.08)] text-[#e8fff1]";
  }

  if (tone === "amber") {
    return "border-[rgba(247,185,85,0.18)] bg-[rgba(247,185,85,0.08)] text-[#fff4da]";
  }

  return "border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] text-[#ebfffd]";
}

interface DocsRichContentProps {
  sections: DocSection[];
}

export default function DocsRichContent({ sections }: DocsRichContentProps) {
  return (
    <>
      {sections.map((section) => (
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
    </>
  );
}
