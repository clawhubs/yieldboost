import Link from "next/link";
import { Code2, KeyRound, Shield, TerminalSquare } from "lucide-react";

interface DeveloperPortalShellProps {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}

const navigation = [
  { href: "/dev", label: "Overview", icon: Shield },
  { href: "/dev/docs", label: "Docs", icon: Code2 },
  { href: "/dev/apps", label: "Dashboard", icon: KeyRound },
  { href: "https://api.yieldboostai.xyz/docs", label: "OpenAPI", icon: TerminalSquare },
];

export default function DeveloperPortalShell({
  title,
  eyebrow,
  description,
  children,
}: DeveloperPortalShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
      <header className="surface-panel overflow-hidden rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="glass-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#8ff7ea]">
              {eyebrow}
            </div>
            <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-[34px] font-semibold leading-[1.02] text-white md:text-[56px]">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#9cb0c1] md:text-[17px]">
              {description}
            </p>
          </div>

          <nav className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="yb-soft-card flex items-center gap-3 rounded-[18px] px-4 py-4 transition hover:border-[rgba(0,201,177,0.22)]"
              >
                <div className="glass-accent flex h-10 w-10 items-center justify-center rounded-[14px] text-[#6ef3dd]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{label}</p>
                  <p className="text-[12px] text-[#8097a8]">{href.startsWith("http") ? "Live API ref" : "Developer portal"}</p>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
