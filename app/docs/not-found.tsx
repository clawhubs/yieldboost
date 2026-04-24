import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export default function DocsNotFound() {
  return (
    <DocsShell
      badge="Documentation"
      title="Page not found"
      description="The docs page you requested does not exist or is no longer part of the current docs map."
      actions={[
        { href: "/docs", label: "Back to Docs Home", tone: "primary" },
        { href: "/docs/getting-started", label: "Read Getting Started", tone: "secondary" },
      ]}
      metrics={[
        { label: "Suggested next step", value: "Restart at /docs", helper: "Use the docs index to find the current page map" },
        { label: "Routing model", value: "Static slugs", helper: "Pages are generated from the typed docs content source", tone: "teal" },
      ]}
      audience="Anyone following an outdated or mistyped docs link."
    >
      <section className="yb-card rounded-[18px] px-5 py-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa7b9]">Recovery</div>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[30px]">
          Use the docs index to continue
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-8 text-[#c6d4df]">
          The docs section is data-driven, so the source of truth is the docs index and the page links listed in the local docs sidebar.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="yb-teal-button inline-flex items-center rounded-[12px] px-5 py-3 text-[14px] font-semibold text-[#071217]"
          >
            Open Docs Home
          </Link>
          <Link
            href="/"
            className="glass-inset inline-flex items-center rounded-[12px] px-4 py-3 text-[13px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.25)]"
          >
            Return to Dashboard
          </Link>
        </div>
      </section>
    </DocsShell>
  );
}
