import Link from "next/link";
import { Code2, KeyRound, Layers3, ShieldCheck, TerminalSquare } from "lucide-react";
import ParticleCanvas from "@/components/dev/ParticleCanvas";

interface DeveloperPortalShellProps {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}

const navigation = [
  { href: "/dev/marketplace", label: "Modular Immunity Armory", sublabel: "Store catalog", icon: Layers3 },
  { href: "/dev/docs", label: "Docs", sublabel: "Integration guide", icon: Code2 },
  { href: "/dev/apps", label: "Dashboard", sublabel: "Connect wallet / app keys", icon: KeyRound },
  { href: "/dev/audit", label: "Verification", sublabel: "Proof console", icon: ShieldCheck },
  { href: "https://api.yieldboostai.xyz/docs", label: "OpenAPI", sublabel: "Live API ref", icon: TerminalSquare },
];

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Subtle top-left brand ambient — static, no animation */}
      <div
        className="absolute -left-[5%] -top-[10%] h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,201,177,0.06) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      {/* Faint cool accent — top right */}
      <div
        className="absolute -right-[5%] -top-[5%] h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(100,160,200,0.04) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

export default function DeveloperPortalShell({
  title,
  eyebrow,
  description,
  children,
}: DeveloperPortalShellProps) {
  return (
    <div className="bunker-grid min-h-screen w-full font-[family-name:var(--font-inter)]">
      {/* Particle network canvas */}
      <ParticleCanvas />
      {/* Floating animated orbs */}
      <FloatingOrbs />

      <div className="relative z-10 mx-auto -mt-6 flex w-full flex-col gap-4 px-3 pt-0.5 pb-6 md:-mt-8 md:px-5 md:pt-1 md:pb-8">
      <header className="hero-panel p-4 md:p-6">
        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#8ff7ea]">
              <span className="status-active" />
              {eyebrow}
            </div>
            <h1 className="shimmer-text mt-5 max-w-3xl text-[32px] font-extrabold leading-[1.08] tracking-tight md:text-[44px]">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-8 text-[#d0dde8] md:text-[17px]">
              {description}
            </p>
          </div>

          <nav className="grid gap-2.5 sm:grid-cols-2 xl:w-[400px]">
            {navigation.map(({ href, label, sublabel, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                className="nav-card-hover flex min-w-0 items-start gap-3 rounded-xl border border-[rgba(0,201,177,0.12)] bg-[rgba(0,201,177,0.04)] px-4 py-3.5 transition-all duration-300 hover:border-[rgba(0,201,177,0.35)] hover:bg-[rgba(0,201,177,0.08)] hover:shadow-[0_0_20px_rgba(0,201,177,0.12)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] text-[#72f3c7]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-[14px] font-semibold leading-5 text-white">{label}</p>
                  <p className="break-words text-[12px] leading-4 text-[#b0c8d8]">{sublabel}</p>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}
      </div>
    </div>
  );
}
