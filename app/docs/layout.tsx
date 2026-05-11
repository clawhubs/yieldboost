import type { ReactNode } from "react";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import DocsBackButton from "@/components/docs/DocsBackButton";
import DocsSidebar from "@/components/docs/DocsSidebar";
import { getDocsNavigation } from "@/lib/docs/content";

export default function DocsLayout({ children }: { children: ReactNode }) {
  const navigation = getDocsNavigation();

  return (
    <section className="space-y-[10px] p-[10px]">
      <header className="yb-card rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              <FileText className="h-3.5 w-3.5" />
              Documentation
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              YieldBoost AI Project Brief
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
              A plain-English map of how YieldBoost makes money, protects users, sells its security stack,
              and proves those claims on 0G.
            </p>
          </div>

          <div className="grid gap-[10px] md:grid-cols-2 xl:w-[430px]">
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
                <Sparkles className="h-3.5 w-3.5 text-[#22ddd0]" />
                Current Story
              </div>
              <p className="mt-2 text-[15px] font-medium text-white">Mainnet-first, proof-backed, and sold as both a user flow and a developer security product.</p>
            </div>
            <div className="yb-soft-card rounded-[16px] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ea1af]">
                Revenue Shape
              </p>
              <p className="mt-2 text-[15px] font-medium text-white">Yield optimization, API packages, SDK wrapping, and public security challenge surfaces.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <DocsBackButton label="Back" />
          <Link
            href="/"
            className="yb-teal-button inline-flex items-center rounded-[12px] px-4 py-3 text-[13px] font-semibold text-[#071217]"
          >
            Back to dashboard
          </Link>
          <Link
            href="/judge"
            className="glass-inset inline-flex items-center rounded-[12px] px-4 py-3 text-[13px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.25)]"
          >
            Open Judge Mode
          </Link>
        </div>
      </header>

      <div className="grid gap-[10px] xl:grid-cols-[290px_minmax(0,1fr)]">
        <div className="space-y-[10px]">
          <div className="xl:sticky xl:top-[10px]">
            <DocsSidebar groups={navigation} />
          </div>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
