import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  ctaLabel: string;
  href: string;
}

export default function PagePlaceholder({
  title,
  description,
  icon: Icon,
  ctaLabel,
  href,
}: PagePlaceholderProps) {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
      <div className="surface-panel teal-ring w-full max-w-3xl rounded-[32px] p-8 md:p-12">
        <div className="mb-8 inline-flex rounded-2xl border border-[var(--border-strong)] bg-[rgba(0,201,177,0.09)] p-4 text-[var(--accent-teal)]">
          <Icon className="h-8 w-8" />
        </div>
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--accent-teal)]">
          YieldBoost Workspace
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={href}
            data-testid="placeholder-cta"
            className="rounded-full border border-[var(--border-strong)] bg-[linear-gradient(135deg,#00c9b1,#0ea5a8)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/agent"
            data-testid="placeholder-agent"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:text-[var(--accent-teal)]"
          >
            Ask AI Agent
          </Link>
        </div>
      </div>
    </section>
  );
}
