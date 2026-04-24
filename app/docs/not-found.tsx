import Link from "next/link";

export default function DocsNotFound() {
  return (
    <section className="space-y-[10px]">
      <section className="yb-card rounded-[18px] px-5 py-5">
        <div className="glass-accent inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
          Documentation
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
          Page not found
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
          The docs page you requested does not exist or is no longer part of the current documentation map.
        </p>
      </section>

      <section className="yb-card rounded-[18px] px-5 py-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#8fa1af]">Recovery</div>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white md:text-[30px]">
          Use the docs index to continue
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-8 text-[#c6d4df]">
          The source of truth for available pages is the docs home and the sidebar navigation in this section.
        </p>

        <div className="mt-5 grid gap-[10px] md:grid-cols-2">
          <div className="yb-soft-card rounded-[16px] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa1af]">Suggested next step</div>
            <div className="mt-2 text-[16px] font-semibold text-white">Restart at `/docs`</div>
            <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">
              Use the docs landing page to find the current page tree and featured paths.
            </p>
          </div>
          <div className="yb-soft-card rounded-[16px] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa1af]">Routing model</div>
            <div className="mt-2 text-[16px] font-semibold text-[#22ddd0]">Static typed slugs</div>
            <p className="mt-2 text-[14px] leading-6 text-[#9daab6]">
              Docs pages are generated from the typed content source under `lib/docs/content.ts`.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="yb-teal-button inline-flex items-center rounded-[12px] px-5 py-3 text-[14px] font-semibold text-[#071217]"
          >
            Open Docs Home
          </Link>
          <Link
            href="/docs/getting-started"
            className="glass-inset inline-flex items-center rounded-[12px] px-4 py-3 text-[13px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.25)]"
          >
            Read Getting Started
          </Link>
          <Link
            href="/"
            className="glass-inset inline-flex items-center rounded-[12px] px-4 py-3 text-[13px] font-medium text-[#d8e1e8] transition hover:border-[rgba(0,201,177,0.25)]"
          >
            Return to Dashboard
          </Link>
        </div>
      </section>
    </section>
  );
}
