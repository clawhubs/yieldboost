import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDocsNavigation } from "@/lib/docs/content";

interface DocsSidebarNavProps {
  activeSlug?: string;
}

export default function DocsSidebarNav({ activeSlug }: DocsSidebarNavProps) {
  const navigation = getDocsNavigation();
  const overviewActive = !activeSlug;

  return (
    <div className="yb-card rounded-[18px] px-4 py-4 xl:sticky xl:top-[10px]">
      <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
        Docs Index
      </div>

      <div className="mt-4 space-y-2">
        <Link
          href="/docs"
          className={`flex items-center justify-between rounded-[14px] px-3 py-3 transition ${
            overviewActive
              ? "glass-accent text-white"
              : "glass-inset text-[#d1dbe3] hover:border-[rgba(0,201,177,0.22)]"
          }`}
        >
          <div>
            <div className="text-[13px] font-semibold">Overview</div>
            <div className="mt-1 text-[11px] text-[#94a8b7]">Entry point for the docs workspace</div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 space-y-5">
        {navigation.map((group) => (
          <div key={group.title}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">
                {group.title}
              </div>
              <div className="text-[11px] text-[#6e8493]">{group.pages.length}</div>
            </div>

            <div className="mt-2 space-y-2">
              {group.pages.map((page) => {
                const Icon = page.icon;
                const isActive = page.slug === activeSlug;

                return (
                  <Link
                    key={page.slug}
                    href={`/docs/${page.slug}`}
                    className={`block rounded-[14px] px-3 py-3 transition ${
                      isActive
                        ? "glass-accent text-white"
                        : "glass-inset text-[#d1dbe3] hover:border-[rgba(0,201,177,0.22)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#22ddd0]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold">{page.title}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#94a8b7]">
                          {page.summary}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
