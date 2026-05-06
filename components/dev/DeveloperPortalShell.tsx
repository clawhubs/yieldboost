import Link from "next/link";
import { Code2, KeyRound, Shield, TerminalSquare } from "lucide-react";
import ParticleCanvas from "@/components/dev/ParticleCanvas";

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

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Large teal orb — top left, drifts slowly */}
      <div
        className="orb-float absolute -left-[10%] -top-[15%] h-[500px] w-[500px] rounded-full md:h-[700px] md:w-[700px]"
        style={{
          background: "radial-gradient(circle, rgba(0,201,177,0.18) 0%, rgba(0,201,177,0.04) 40%, transparent 70%)",
          animationDuration: "18s",
        }}
      />
      {/* Cyan orb — top right */}
      <div
        className="orb-float-reverse absolute -right-[8%] -top-[10%] h-[400px] w-[400px] rounded-full md:h-[550px] md:w-[550px]"
        style={{
          background: "radial-gradient(circle, rgba(15,181,200,0.14) 0%, rgba(15,181,200,0.03) 45%, transparent 70%)",
          animationDuration: "22s",
          animationDelay: "-5s",
        }}
      />
      {/* Small bright orb — mid left */}
      <div
        className="orb-float absolute left-[15%] top-[40%] h-[250px] w-[250px] rounded-full md:h-[350px] md:w-[350px]"
        style={{
          background: "radial-gradient(circle, rgba(0,201,177,0.12) 0%, transparent 60%)",
          animationDuration: "15s",
          animationDelay: "-8s",
        }}
      />
      {/* Bottom center glow */}
      <div
        className="orb-float-reverse absolute -bottom-[10%] left-[30%] h-[500px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(0,201,177,0.12) 0%, rgba(15,181,200,0.04) 40%, transparent 70%)",
          animationDuration: "20s",
          animationDelay: "-3s",
        }}
      />
      {/* Small accent orb — right side */}
      <div
        className="orb-float absolute right-[10%] top-[60%] h-[200px] w-[200px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,230,200,0.10) 0%, transparent 60%)",
          animationDuration: "12s",
          animationDelay: "-6s",
        }}
      />
      {/* Tiny bright particle dots */}
      <div className="particle-dot absolute left-[20%] top-[25%] h-1.5 w-1.5 rounded-full bg-[rgba(0,201,177,0.5)]" style={{ animationDelay: "0s" }} />
      <div className="particle-dot absolute left-[70%] top-[15%] h-1 w-1 rounded-full bg-[rgba(15,181,200,0.4)]" style={{ animationDelay: "-2s" }} />
      <div className="particle-dot absolute left-[45%] top-[55%] h-1.5 w-1.5 rounded-full bg-[rgba(0,201,177,0.35)]" style={{ animationDelay: "-4s" }} />
      <div className="particle-dot absolute left-[85%] top-[40%] h-1 w-1 rounded-full bg-[rgba(0,230,200,0.45)]" style={{ animationDelay: "-1s" }} />
      <div className="particle-dot absolute left-[10%] top-[70%] h-1 w-1 rounded-full bg-[rgba(15,181,200,0.4)]" style={{ animationDelay: "-3s" }} />
      <div className="particle-dot absolute left-[55%] top-[80%] h-1.5 w-1.5 rounded-full bg-[rgba(0,201,177,0.3)]" style={{ animationDelay: "-5s" }} />
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

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="hero-panel p-6 md:p-10">
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
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="nav-card-hover flex items-center gap-3 rounded-xl border border-[rgba(0,201,177,0.12)] bg-[rgba(0,201,177,0.04)] px-4 py-3.5 transition-all duration-300 hover:border-[rgba(0,201,177,0.35)] hover:bg-[rgba(0,201,177,0.08)] hover:shadow-[0_0_20px_rgba(0,201,177,0.12)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] text-[#72f3c7]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{label}</p>
                  <p className="text-[12px] text-[#96b0c2]">{href.startsWith("http") ? "Live API ref" : "Developer portal"}</p>
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
