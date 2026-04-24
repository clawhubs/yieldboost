import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DocsRichContent from "@/components/docs/DocsRichContent";
import DocsShell from "@/components/docs/DocsShell";
import {
  getAdjacentDocsPages,
  getDocsTableOfContents,
  getRelatedDocsPages,
  type DocsPage,
} from "@/lib/docs/content";

interface DocsPageViewProps {
  page: DocsPage;
}

export default function DocsPageView({ page }: DocsPageViewProps) {
  const Icon = page.icon;
  const toc = getDocsTableOfContents(page);
  const relatedPages = getRelatedDocsPages(page);
  const adjacentPages = getAdjacentDocsPages(page.slug);

  return (
    <DocsShell
      activeSlug={page.slug}
      badge={page.badge}
      title={page.title}
      description={page.description}
      actions={page.actions}
      metrics={page.metrics}
      toc={toc}
      audience={page.audience}
      readTime={page.readTime}
      updatedAt={page.updatedAt}
    >
      <div className="space-y-[10px]">
        <section className="yb-card rounded-[18px] px-5 py-5">
          <div className="grid gap-[10px] lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex items-start gap-4">
              <div className="glass-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[#22ddd0]">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Page summary</div>
                <p className="mt-2 max-w-3xl text-[15px] leading-8 text-[#c6d4df]">{page.summary}</p>
              </div>
            </div>

            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">Section guide</div>
              <div className="mt-3 space-y-2">
                {toc.map((item, index) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="glass-inset flex items-center gap-3 rounded-[12px] px-3 py-3 text-[13px] text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.22)]"
                  >
                    <span className="text-[#22ddd0]">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <DocsRichContent sections={page.sections} />

        {relatedPages.length > 0 ? (
          <section className="yb-card rounded-[18px] px-5 py-5">
            <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Related reading</div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white">
                Keep going
              </h2>
              <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9aaab7]">
                These pages are the most relevant next stops from this article.
              </p>
            </div>

            <div className="mt-5 grid gap-[10px] md:grid-cols-2 xl:grid-cols-3">
              {relatedPages.map((relatedPage) => {
                const RelatedIcon = relatedPage.icon;

                return (
                  <Link
                    key={relatedPage.slug}
                    href={`/docs/${relatedPage.slug}`}
                    className="glass-inset block rounded-[16px] px-4 py-4 transition hover:border-[rgba(0,201,177,0.22)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="glass-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[#22ddd0]">
                        <RelatedIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-white">{relatedPage.title}</div>
                        <p className="mt-2 text-[13px] leading-6 text-[#9aaab7]">{relatedPage.summary}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {(adjacentPages.previous || adjacentPages.next) ? (
          <section className="grid gap-[10px] md:grid-cols-2">
            {adjacentPages.previous ? (
              <Link
                href={`/docs/${adjacentPages.previous.slug}`}
                className="yb-card block rounded-[18px] px-5 py-5 transition hover:border-[rgba(0,201,177,0.22)]"
              >
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">Previous</div>
                <div className="mt-3 flex items-center gap-3 text-white">
                  <ArrowLeft className="h-4 w-4 text-[#22ddd0]" />
                  <span className="text-[16px] font-semibold">{adjacentPages.previous.title}</span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-[#9aaab7]">{adjacentPages.previous.description}</p>
              </Link>
            ) : (
              <div />
            )}

            {adjacentPages.next ? (
              <Link
                href={`/docs/${adjacentPages.next.slug}`}
                className="yb-card block rounded-[18px] px-5 py-5 transition hover:border-[rgba(0,201,177,0.22)]"
              >
                <div className="text-right text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">Next</div>
                <div className="mt-3 flex items-center justify-end gap-3 text-white">
                  <span className="text-[16px] font-semibold">{adjacentPages.next.title}</span>
                  <ArrowRight className="h-4 w-4 text-[#22ddd0]" />
                </div>
                <p className="mt-2 text-right text-[13px] leading-6 text-[#9aaab7]">{adjacentPages.next.description}</p>
              </Link>
            ) : (
              <div />
            )}
          </section>
        ) : null}
      </div>
    </DocsShell>
  );
}
