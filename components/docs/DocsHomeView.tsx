import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DocsShell from "@/components/docs/DocsShell";
import { docsPages, getDocsNavigation } from "@/lib/docs/content";

const homeTableOfContents = [
  { id: "start-here", title: "Start Here" },
  { id: "page-map", title: "Page Map" },
  { id: "workflow-map", title: "Workflow Map" },
  { id: "maintenance-model", title: "Maintenance Model" },
];

export default function DocsHomeView() {
  const navigation = getDocsNavigation();
  const totalSections = docsPages.reduce((count, page) => count + page.sections.length, 0);

  return (
    <DocsShell
      badge="Documentation"
      title="YieldBoost Docs Workspace"
      description="A docs foundation built to live inside the existing app shell, scale with typed content, and stay aligned with the current dashboard and agent architecture."
      actions={[
        { href: "/docs/getting-started", label: "Read Getting Started", tone: "primary" },
        { href: "/", label: "Open Dashboard", tone: "secondary" },
      ]}
      metrics={[
        { label: "Docs guides", value: String(docsPages.length), helper: "Production-ready pages with static params and metadata" },
        { label: "Mapped sections", value: String(totalSections), helper: "Structured headings ready for table-of-contents links", tone: "green" },
        { label: "Styling approach", value: "Native", helper: "Uses the existing card and glass classes already in the app", tone: "teal" },
      ]}
      toc={homeTableOfContents}
      audience="Teammates onboarding to the repo, demo flows, and docs maintenance."
    >
      <div className="space-y-[10px]">
        <section id="start-here" className="yb-card scroll-mt-24 rounded-[18px] px-5 py-5">
          <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Start here</div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[30px]">
              What this docs section is for
            </h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9aaab7]">
              This section is designed to document the repo as it exists today: a shared-shell Next.js
              application with dashboard surfaces, reusable feature pages, and an agent-to-proof story that
              can run with graceful fallbacks.
            </p>
          </div>

          <div className="mt-5 grid gap-[10px] md:grid-cols-2 xl:grid-cols-3">
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">Server-friendly</div>
              <div className="mt-2 text-[16px] font-semibold text-white">App-router compatible</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Pages are generated from typed content with static params and route-level metadata.
              </p>
            </div>
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">Reusable</div>
              <div className="mt-2 text-[16px] font-semibold text-white">Shared docs components</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Navigation, article shells, rich blocks, and table-of-contents rails are all isolated for reuse.
              </p>
            </div>
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">Low-friction</div>
              <div className="mt-2 text-[16px] font-semibold text-white">No shared layout changes</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                The docs section fits inside the current app chrome without changing the main sidebar or root layout.
              </p>
            </div>
          </div>
        </section>

        <section id="page-map" className="yb-card scroll-mt-24 rounded-[18px] px-5 py-5">
          <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Page map</div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[30px]">
              Current docs pages
            </h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9aaab7]">
              The page map is grouped by category so new long-form docs can slot into the section without changing the route structure.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {navigation.map((group) => (
              <div key={group.title}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">{group.title}</div>
                <div className="mt-3 grid gap-[10px] md:grid-cols-2">
                  {group.pages.map((page) => {
                    const Icon = page.icon;

                    return (
                      <Link
                        key={page.slug}
                        href={`/docs/${page.slug}`}
                        className="glass-inset block rounded-[16px] px-4 py-4 transition hover:border-[rgba(0,201,177,0.22)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="glass-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[#22ddd0]">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-[14px] font-semibold text-white">{page.title}</div>
                              <p className="mt-2 text-[13px] leading-6 text-[#9aaab7]">{page.summary}</p>
                              <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[#6e8493]">
                                {page.readTime} read
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 text-[#22ddd0]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow-map" className="yb-card scroll-mt-24 rounded-[18px] px-5 py-5">
          <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Workflow map</div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[30px]">
              Suggested reading paths
            </h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9aaab7]">
              Different teammates need different entry points, so the docs are arranged to support fast orientation as well as deeper implementation work.
            </p>
          </div>

          <div className="mt-5 grid gap-[10px] lg:grid-cols-3">
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">For demos</div>
              <div className="mt-2 text-[16px] font-semibold text-white">Start with product flow</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Read Getting Started first, then jump to Agent And Proof Flow for the strongest reviewer narrative.
              </p>
            </div>
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">For engineering</div>
              <div className="mt-2 text-[16px] font-semibold text-white">Understand the route pattern</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Read App Architecture to understand the shared shell, server loaders, and feature-page rendering model.
              </p>
            </div>
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa7b9]">For maintainers</div>
              <div className="mt-2 text-[16px] font-semibold text-white">Extend the docs safely</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Use Authoring Docs when you need to add more long-form content without stepping into shared files.
              </p>
            </div>
          </div>
        </section>

        <section id="maintenance-model" className="yb-card scroll-mt-24 rounded-[18px] px-5 py-5">
          <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Maintenance model</div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[30px]">
              How this docs foundation scales
            </h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#9aaab7]">
              The simplest way to grow the docs is to treat content, rendering, and routing as separate layers.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="glass-inset rounded-[16px] px-4 py-4">
              <div className="text-[15px] font-semibold text-white">1. Add or update typed content</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Update the page definitions in the docs content module when the product changes or a new guide is needed.
              </p>
            </div>
            <div className="glass-inset rounded-[16px] px-4 py-4">
              <div className="text-[15px] font-semibold text-white">2. Reuse the shared docs components</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                Shell, navigation, rich content rendering, and article framing are already separated so the new page shape stays consistent.
              </p>
            </div>
            <div className="glass-inset rounded-[16px] px-4 py-4">
              <div className="text-[15px] font-semibold text-white">3. Keep the app shell untouched</div>
              <p className="mt-2 text-[14px] leading-7 text-[#b8c9d4]">
                This route tree deliberately avoids changing the shared sidebar and root layout, which keeps ownership boundaries clear in a busy repo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DocsShell>
  );
}
