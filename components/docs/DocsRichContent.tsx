import type { DocsBlock, DocsCalloutTone, DocsSection } from "@/lib/docs/content";

function calloutClasses(tone: DocsCalloutTone) {
  if (tone === "success") {
    return "border-[rgba(47,224,109,0.18)] bg-[rgba(47,224,109,0.07)]";
  }

  if (tone === "warning") {
    return "border-[rgba(247,185,85,0.18)] bg-[rgba(247,185,85,0.07)]";
  }

  return "border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.07)]";
}

function calloutTitleClasses(tone: DocsCalloutTone) {
  if (tone === "success") return "text-[#2fe06d]";
  if (tone === "warning") return "text-[#f7b955]";
  return "text-[#22ddd0]";
}

function renderBlock(block: DocsBlock, index: number) {
  if (block.type === "paragraph") {
    return (
      <p key={index} className="text-[15px] leading-8 text-[#c6d4df]">
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";

    return (
      <ListTag
        key={index}
        className={`space-y-3 pl-5 text-[15px] leading-7 text-[#c6d4df] ${
          block.ordered ? "list-decimal" : "list-disc"
        }`}
      >
        {block.items.map((item, itemIndex) => (
          <li key={`${itemIndex}-${item}`}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "cards") {
    return (
      <div key={index} className="grid gap-[10px] md:grid-cols-2 xl:grid-cols-3">
        {block.items.map((item) => (
          <div key={item.title} className="yb-soft-card rounded-[16px] px-4 py-4">
            {item.eyebrow ? (
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">
                {item.eyebrow}
              </div>
            ) : null}
            <div className="mt-2 text-[16px] font-semibold text-white">{item.title}</div>
            <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">{item.body}</p>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "steps") {
    return (
      <div key={index} className="space-y-3">
        {block.items.map((item, itemIndex) => (
          <div key={item.title} className="glass-inset rounded-[16px] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="glass-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-[#22ddd0]">
                {itemIndex + 1}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">{item.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div key={index} className={`rounded-[16px] border px-4 py-4 ${calloutClasses(block.tone)}`}>
        <div className={`text-[13px] font-semibold ${calloutTitleClasses(block.tone)}`}>{block.title}</div>
        <p className="mt-2 text-[14px] leading-7 text-[#d3dde5]">{block.body}</p>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div key={index} className="yb-soft-card rounded-[16px] p-4">
        {(block.title || block.caption) ? (
          <div className="mb-3">
            {block.title ? <div className="text-[13px] font-semibold text-white">{block.title}</div> : null}
            {block.caption ? <div className="mt-1 text-[12px] leading-6 text-[#8fa7b9]">{block.caption}</div> : null}
          </div>
        ) : null}
        <div className="glass-inset overflow-x-auto rounded-[14px] px-4 py-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#6e8493]">{block.language}</div>
          <pre className="m-0 text-[13px] leading-6 text-[#d8e1e8]">
            <code>{block.code}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div key={index} className="yb-soft-card overflow-x-auto rounded-[16px] p-4">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr>
            {block.table.columns.map((column) => (
              <th
                key={column}
                className="border-b border-[rgba(255,255,255,0.08)] px-3 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8fa7b9]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("-")}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="border-b border-[rgba(255,255,255,0.05)] px-3 py-3 text-[14px] leading-7 text-[#d6dee6]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.table.caption ? (
        <div className="mt-3 text-[12px] leading-6 text-[#8fa7b9]">{block.table.caption}</div>
      ) : null}
    </div>
  );
}

interface DocsRichContentProps {
  sections: DocsSection[];
}

export default function DocsRichContent({ sections }: DocsRichContentProps) {
  return (
    <div className="space-y-[10px]">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="yb-card scroll-mt-24 rounded-[18px] px-5 py-5"
        >
          <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">{section.id}</div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[28px]">
              {section.title}
            </h2>
            {section.description ? (
              <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9aaab7]">
                {section.description}
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            {section.blocks.map((block, index) => renderBlock(block, index))}
          </div>
        </section>
      ))}
    </div>
  );
}
