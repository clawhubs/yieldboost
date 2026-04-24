interface DocsTableOfContentsProps {
  items: Array<{
    id: string;
    title: string;
  }>;
}

export default function DocsTableOfContents({ items }: DocsTableOfContentsProps) {
  if (items.length === 0) return null;

  return (
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
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="glass-inset block rounded-[12px] px-3 py-3 text-[13px] text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.2)]"
            >
              {item.title}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
