import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getDocsNavigation, type DocSlug } from "@/lib/docs/content";

interface DocsSidebarNavProps {
  activeSlug?: DocSlug;
}

export default function DocsSidebarNav({ activeSlug }: DocsSidebarNavProps) {
  const groups = getDocsNavigation();

  return (
    <nav
      aria-label="Documentation navigation"
      data-testid="docs-sidebar"
      className="yb-card rounded-[18px] p-4"
    >
      <div className="space-y-4">
        <Link
          href="/docs"
          className={`flex items-center justify-between rounded-[14px] border px-4 py-3 text-[13px] transition ${
            !activeSlug
              ? "border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.10)] text-white"
              : "border-white/6 text-[#d6dee6] hover:border-white/10 hover:bg-white/3"
          }`}
        >
          <span>Docs Home</span>
          <ChevronRight className="h-4 w-4 text-[#8ea1af]" />
        </Link>

        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
              {group.title}
            </h2>
            <div className="mt-2 space-y-2">
              {group.items.map((item) => {
                const active = item.slug === activeSlug;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-[14px] border px-4 py-3 transition ${
                      active
                        ? "border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.10)] text-white shadow-[inset_0_0_0_1px_rgba(0,201,177,0.12)]"
                        : "border-white/6 text-[#d6dee6] hover:border-white/10 hover:bg-white/3"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium">{item.label}</span>
                      <ChevronRight className={`h-4 w-4 ${active ? "text-[#22ddd0]" : "text-[#8ea1af]"}`} />
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-[#8ea1af]">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}
