import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type AccentTone = "green" | "teal" | "white";
type VisualKind = "bars" | "line" | "ring" | "grid";

interface ActionConfig {
  href: string;
  label: string;
  tone: "primary" | "secondary";
}

interface HeroMetric {
  label: string;
  value: string;
  helper: string;
  tone?: AccentTone;
}

interface HighlightRow {
  label: string;
  value: string;
  helper: string;
  tone?: AccentTone;
}

interface HighlightConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  visual: VisualKind;
  rows: HighlightRow[];
  footer: string;
}

interface TableRow {
  cells: [string, string, string, string];
  badge?: string;
}

interface TableConfig {
  title: string;
  subtitle: string;
  columns: [string, string, string, string];
  rows: TableRow[];
  footnote: string;
}

interface SideItem {
  label: string;
  value: string;
  tone?: AccentTone;
}

interface SideCardConfig {
  title: string;
  icon: LucideIcon;
  accent?: AccentTone;
  items: SideItem[];
  footer: string;
  cta?: ActionConfig;
}

interface BottomCardConfig {
  title: string;
  icon: LucideIcon;
  points: string[];
  footer: string;
}

export interface FeaturePageConfig {
  badge: string;
  title: string;
  description: string;
  actions: [ActionConfig, ActionConfig];
  heroMetrics: HeroMetric[];
  highlight: HighlightConfig;
  table: TableConfig;
  sideCards: [SideCardConfig, SideCardConfig];
  bottomCards: [BottomCardConfig, BottomCardConfig, BottomCardConfig];
}

function accentValueClass(tone: AccentTone = "white") {
  if (tone === "green") return "text-[#2fe06d]";
  if (tone === "teal") return "text-[#22ddd0]";
  return "text-white";
}

function accentIconShellClass(tone: AccentTone = "teal") {
  if (tone === "green") return "border-[#17351c] bg-[#0c1711] text-[#2fe06d]";
  if (tone === "white") return "border-[#24303a] bg-[#0c1218] text-white";
  return "border-[#173832] bg-[#081313] text-[#22ddd0]";
}

function renderVisual(kind: VisualKind) {
  if (kind === "bars") {
    const heights = [18, 26, 22, 34, 28, 42, 39, 32, 45, 37, 33, 40];

    return (
      <div className="flex h-[112px] items-end gap-[6px]">
        {heights.map((height, index) => (
          <div
            key={index}
            className="min-w-0 flex-1 rounded-t-[10px] bg-[linear-gradient(180deg,#5cf48e_0%,#2ecf67_45%,#0c1a12_100%)] shadow-[0_0_14px_rgba(76,235,130,0.14)]"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
    );
  }

  if (kind === "ring") {
    return (
      <div className="flex h-[112px] items-center justify-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#1d2a33] bg-[#0a1117]">
          <div className="absolute inset-2 rounded-full border-4 border-[#13231f]" />
          <div
            className="absolute inset-2 rounded-full border-4 border-[#22ddd0]"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 64%, 55% 64%, 55% 100%, 0 100%)",
            }}
          />
          <div className="text-center">
            <div className="text-[28px] font-semibold text-white">96%</div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#8fa7b9]">confidence</div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "grid") {
    return (
      <div className="grid h-[112px] grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className={`rounded-[10px] border ${
              index % 4 === 0 || index === 9
                ? "border-[#174642] bg-[rgba(34,221,208,0.12)]"
                : "border-[#1b242d] bg-[#0b1117]"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <svg viewBox="0 0 360 112" className="h-[112px] w-full" aria-hidden="true">
      <defs>
        <linearGradient id="featureLineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22ddd0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22ddd0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 88C28 79 39 71 58 66C78 61 90 60 111 52C132 44 145 32 166 29C186 26 198 33 219 27C241 20 254 10 274 12C295 14 311 27 328 24C341 22 349 16 356 14V108H12V88Z"
        fill="url(#featureLineFill)"
      />
      <path
        d="M12 88C28 79 39 71 58 66C78 61 90 60 111 52C132 44 145 32 166 29C186 26 198 33 219 27C241 20 254 10 274 12C295 14 311 27 328 24C341 22 349 16 356 14"
        fill="none"
        stroke="#22ddd0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line x1="12" y1="86" x2="356" y2="86" stroke="#9aaab7" strokeOpacity="0.18" strokeDasharray="4 6" />
    </svg>
  );
}

export default function FeaturePageView({
  badge,
  title,
  description,
  actions,
  heroMetrics,
  highlight,
  table,
  sideCards,
  bottomCards,
}: FeaturePageConfig) {
  const HighlightIcon = highlight.icon;

  return (
    <section className="space-y-[10px] p-[10px]">
      <header className="yb-card rounded-[18px] px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#153632] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#22ddd0]">
              {badge}
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold leading-[1.08] text-white md:text-[40px]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#9daab6]">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {actions.map((action) =>
              action.tone === "primary" ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className="yb-teal-button inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-[14px] font-semibold text-[#071217]"
                >
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-[12px] border border-[#24303a] px-4 py-3 text-[13px] font-medium text-[#d8e1e8]"
                >
                  {action.label}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-[10px] md:grid-cols-2 xl:grid-cols-4">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="yb-soft-card rounded-[14px] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#a7b3be]">{metric.label}</div>
              <div className={`mt-2 text-[24px] font-semibold ${accentValueClass(metric.tone)}`}>
                {metric.value}
              </div>
              <div className="mt-1 text-[12px] text-[#d6dee6]">{metric.helper}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-[10px] xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="space-y-[10px]">
          <div className="yb-card rounded-[16px] px-4 py-4">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[12px] border ${accentIconShellClass("teal")}`}>
                    <HighlightIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white">{highlight.title}</div>
                    <div className="mt-1 text-[12px] text-[#9faab6]">{highlight.description}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {highlight.rows.map((row) => (
                    <div key={row.label} className="rounded-[12px] border border-[#182028] bg-[#091117] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.06em] text-[#9faab6]">{row.label}</div>
                      <div className={`mt-2 text-[19px] font-semibold ${accentValueClass(row.tone)}`}>{row.value}</div>
                      <div className="mt-1 text-[12px] text-[#d6dee6]">{row.helper}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-[12px] text-[#22ddd0]">{highlight.footer}</div>
              </div>

              <div className="rounded-[14px] border border-[#17212a] bg-[radial-gradient(circle_at_top_right,rgba(34,221,208,0.14),transparent_30%),linear-gradient(180deg,#081017_0%,#070c11_100%)] px-4 py-4">
                {renderVisual(highlight.visual)}
              </div>
            </div>
          </div>

          <div className="yb-card rounded-[16px] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-medium text-white">{table.title}</div>
                <div className="mt-1 text-[12px] text-[#9faab6]">{table.subtitle}</div>
              </div>
              <div className="rounded-[10px] border border-[#174642] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22ddd0]">
                mock data
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#182028]">
              <div className="grid grid-cols-[1.25fr_1fr_1fr_0.9fr_auto] gap-3 bg-[#091117] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-[#9faab6]">
                {table.columns.map((column) => (
                  <div key={column}>{column}</div>
                ))}
                <div className="text-right">State</div>
              </div>

              <div className="divide-y divide-[#182028]">
                {table.rows.map((row) => (
                  <div
                    key={row.cells.join("-")}
                    className="grid grid-cols-[1.25fr_1fr_1fr_0.9fr_auto] gap-3 px-4 py-3 text-[13px] text-[#d8e1e8]"
                  >
                    {row.cells.map((cell, index) => (
                      <div key={`${cell}-${index}`}>{cell}</div>
                    ))}
                    <div className="text-right">
                      <span className="rounded-full border border-[#12453f] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#25d6c6]">
                        {row.badge ?? "tracked"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-[12px] text-[#9faab6]">{table.footnote}</div>
          </div>
        </div>

        <div className="space-y-[10px]">
          {sideCards.map((card) => {
            const CardIcon = card.icon;

            return (
              <div key={card.title} className="yb-card rounded-[16px] px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[12px] border ${accentIconShellClass(card.accent ?? "teal")}`}>
                    <CardIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-white">{card.title}</div>
                    <div className="mt-4 space-y-3">
                      {card.items.map((item) => (
                        <div key={item.label} className="rounded-[12px] border border-[#182028] bg-[#091117] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.06em] text-[#9faab6]">{item.label}</div>
                          <div className={`mt-1 text-[15px] font-medium ${accentValueClass(item.tone)}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-[12px] text-[#9faab6]">{card.footer}</div>
                    {card.cta ? (
                      <Link
                        href={card.cta.href}
                        className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-[#24303a] px-3 py-2 text-[12px] font-medium text-[#d8e1e8]"
                      >
                        {card.cta.label}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-[10px] xl:grid-cols-3">
        {bottomCards.map((card) => {
          const CardIcon = card.icon;

          return (
            <div key={card.title} className="yb-card rounded-[16px] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#173832] bg-[#081313] text-[#22ddd0]">
                  <CardIcon className="h-4.5 w-4.5" />
                </div>
                <div className="text-[14px] font-medium text-white">{card.title}</div>
              </div>
              <div className="mt-4 space-y-2">
                {card.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-[13px] text-[#d8e1e8]">
                    <span className="mt-[7px] inline-flex h-1.5 w-1.5 rounded-full bg-[#22ddd0]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[12px] text-[#9faab6]">{card.footer}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
