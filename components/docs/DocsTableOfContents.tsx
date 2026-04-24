import type { DocsTableOfContentsItem } from "@/lib/docs/content";

interface DocsTableOfContentsProps {
  items: DocsTableOfContentsItem[];
  audience?: string;
  readTime?: string;
  updatedAt?: string;
}

export default function DocsTableOfContents({
  items,
  audience,
  readTime,
  updatedAt,
}: DocsTableOfContentsProps) {
  return (
    <div className="space-y-[10px] xl:sticky xl:top-[10px]">
      {(audience || readTime || updatedAt) ? (
        <div className="yb-card rounded-[18px] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Page Details</div>
          <div className="mt-3 space-y-3">
            {audience ? (
              <div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#6e8493]">Audience</div>
                <div className="mt-1 text-[13px] leading-6 text-[#d8e1e8]">{audience}</div>
              </div>
            ) : null}
            {readTime ? (
              <div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#6e8493]">Read Time</div>
                <div className="mt-1 text-[13px] text-white">{readTime}</div>
              </div>
            ) : null}
            {updatedAt ? (
              <div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#6e8493]">Updated</div>
                <div className="mt-1 text-[13px] text-white">{updatedAt}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="yb-card rounded-[18px] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">On This Page</div>
          <nav className="mt-3 space-y-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="glass-inset block rounded-[12px] px-3 py-3 text-[12px] leading-5 text-[#d5dee6] transition hover:border-[rgba(0,201,177,0.22)] hover:text-white"
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
