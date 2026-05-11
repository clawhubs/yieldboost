"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  X,
} from "lucide-react";

const securityLogs = [
  "Initializing Vault Swap Router...",
  "Running Alibaba Anti-Sybil Fingerprinting... [PASSED]",
  "Verifying Zero-Knowledge Proofs... [PASSED]",
  "TEE Secure Compute Enclave... [LOCKED]",
  "9-Layer Integrity Stack... [100% SECURED]",
  "Routing to 0G Mainnet Liquidity...",
];

const fromTokens = ["ETH", "USDT"] as const;

type FromToken = (typeof fromTokens)[number];
type SwapState = "idle" | "loading" | "success";

export default function VaultSwapView() {
  const [swapState, setSwapState] = useState<SwapState>("idle");
  const [fromToken, setFromToken] = useState<FromToken>("ETH");
  const [fromAmount, setFromAmount] = useState("1.00");
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  const estimatedYa = useMemo(() => {
    const amount = Number(fromAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return "0.00";
    const multiplier = fromToken === "ETH" ? 888 : 1.18;
    return (amount * multiplier).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }, [fromAmount, fromToken]);

  useEffect(() => {
    if (swapState !== "loading") return;

    setVisibleLogs([]);
    const timers = securityLogs.map((log, index) =>
      window.setTimeout(() => {
        setVisibleLogs((current) => [...current, log]);
      }, index * 600),
    );

    const successTimer = window.setTimeout(() => {
      setSwapState("success");
    }, securityLogs.length * 600 + 500);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(successTimer);
    };
  }, [swapState]);

  function startSecureSwap() {
    setSwapState("loading");
  }

  function resetSwap() {
    setSwapState("idle");
    setVisibleLogs([]);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#031008] text-[#fffdf2]">
      <section className="relative isolate min-h-screen px-4 py-6 sm:px-6 lg:px-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(143,255,198,0.16),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(234,198,104,0.14),transparent_28%),linear-gradient(135deg,#020704_0%,#06170d_48%,#020504_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(147,255,203,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(147,255,203,0.045)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 md:gap-6">
          <div className="fade-in-up relative overflow-hidden rounded-[28px] border border-[rgba(238,212,128,0.18)] bg-[rgba(4,18,10,0.56)] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-2xl md:px-7">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,213,107,0.85),transparent)]" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(143,255,198,0.24)] bg-[rgba(143,255,198,0.08)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9dffd4]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  UI-only preview
                </div>
                <h1 className="mt-4 flex flex-wrap items-center gap-3 text-[34px] font-black tracking-[-0.04em] text-[#fffdf2] md:text-[54px]">
                  Vault Swap
                  <span className="rounded-full bg-[linear-gradient(135deg,#ffe58f,#d9a92f)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1f1603] shadow-[0_0_28px_rgba(255,218,104,0.28)]">
                    Coming Soon
                  </span>
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#d8e6d8]">
                  A closed-alpha visual mockup for secure YA liquidity routing. No wallet calls, no backend calls, and no live swap execution are attached to this screen.
                </p>
              </div>
              <div className="rounded-[20px] border border-[rgba(238,212,128,0.18)] bg-[rgba(255,250,222,0.06)] px-4 py-3 text-right">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e9cc72]">
                  Phase 2 module
                </div>
                <div className="mt-1 text-[22px] font-black text-[#fff3bd]">Closed Alpha</div>
              </div>
            </div>
          </div>

          <div className="fade-in-up fade-in-up-1 grid gap-5 md:gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-[34px] border border-[rgba(143,255,198,0.18)] bg-[linear-gradient(180deg,rgba(8,35,18,0.72),rgba(2,10,6,0.82))] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.44)] backdrop-blur-2xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9dffd4]">
                    Secure swap interface
                  </div>
                  <h2 className="mt-1 text-[24px] font-black text-[#fffdf2]">Protected YA route</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(238,212,128,0.24)] bg-[rgba(238,212,128,0.1)] text-[#ffe08a]">
                  <LockKeyhole className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <TokenInput
                  label="From"
                  amount={fromAmount}
                  onAmountChange={setFromAmount}
                  token={fromToken}
                  onTokenChange={setFromToken}
                  disabled={swapState === "loading"}
                />

                <div className="flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(238,212,128,0.26)] bg-[rgba(238,212,128,0.12)] text-[#ffe08a] shadow-[0_0_26px_rgba(238,212,128,0.18)]">
                    <ArrowDown className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-[24px] border border-[rgba(143,255,198,0.16)] bg-[rgba(1,8,5,0.58)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9db4a5]">
                        To
                      </div>
                      <div className="mt-3 text-[36px] font-black tracking-[-0.04em] text-[#fffdf2]">
                        {estimatedYa}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[rgba(238,212,128,0.2)] bg-[rgba(238,212,128,0.1)] px-4 py-3 text-right">
                      <div className="text-[18px] font-black text-[#fff3bd]">YA</div>
                      <div className="text-[11px] font-semibold text-[#bea766]">YA Token</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["9-layer guarded", "0G mainnet route", "slippage shield"].map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-[rgba(143,255,198,0.16)] bg-[rgba(143,255,198,0.07)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#aaffd9]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {swapState === "idle" ? (
                  <button
                    type="button"
                    onClick={startSecureSwap}
                    className="group flex w-full items-center justify-center gap-3 rounded-[22px] bg-[linear-gradient(135deg,#fff7d1,#d9a92f)] px-5 py-4 text-[15px] font-black uppercase tracking-[0.08em] text-[#141005] shadow-[0_0_34px_rgba(255,218,104,0.26)] transition hover:scale-[1.01] hover:shadow-[0_0_48px_rgba(255,218,104,0.38)]"
                  >
                    <Sparkles className="h-5 w-5 transition group-hover:rotate-12" />
                    Execute Secure Swap
                  </button>
                ) : swapState === "loading" ? (
                  <TerminalLog logs={visibleLogs} />
                ) : (
                  <div className="rounded-[22px] border border-[rgba(88,255,141,0.28)] bg-[rgba(88,255,141,0.08)] px-5 py-4 text-[#cbffdd]">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#58ff8d]" />
                      <div className="font-bold">Security route prepared for Phase 2.</div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="fade-in-up fade-in-up-2 grid gap-4">
              <InfoPanel
                icon={Radar}
                title="Security Radar"
                body="A visual-only preview of how Vault Swap will present the 9-layer integrity stack before execution."
              />
              <InfoPanel
                icon={TerminalSquare}
                title="No Live Execution"
                body="This screen does not send transactions, connect to contracts, or call a backend route. It is a presentation mockup."
              />
              <InfoPanel
                icon={RefreshCw}
                title="Phase 2 Liquidity"
                body="The UI is ready to demonstrate the planned mainnet liquidity module without touching existing vault logic."
              />
            </aside>
          </div>

          <section className="fade-in-up fade-in-up-3 rounded-[24px] border border-[rgba(143,255,198,0.12)] bg-[rgba(4,18,10,0.5)] px-5 py-5 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9dffd4]">
                  Roadmap context
                </div>
                <h3 className="mt-2 text-[20px] font-black text-[#fffdf2]">
                  Vault Swap is the Phase 2 liquidity layer.
                </h3>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#c6d8c8]">
                  Phase 1 (Core Fortress) is live with 1-click optimize, the 9-layer stack, and 0G anchoring.
                  Vault Swap previews protected YA liquidity routing on top of the same security core.
                </p>
              </div>
              <div className="rounded-[18px] border border-[rgba(238,212,128,0.18)] bg-[rgba(255,250,222,0.06)] px-4 py-3 text-left lg:text-right">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e9cc72]">
                  Presentation CTA
                </div>
                <div className="mt-1 text-[18px] font-black text-[#fff3bd]">
                  Show the live stack first.
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/vault"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,255,198,0.24)] bg-[rgba(143,255,198,0.08)] px-3 py-1.5 text-[11px] font-bold text-[#9dffd4] transition hover:bg-[rgba(143,255,198,0.16)] hover:text-white"
              >
                Open Vault
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/judge"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,255,198,0.24)] bg-[rgba(143,255,198,0.08)] px-3 py-1.5 text-[11px] font-bold text-[#9dffd4] transition hover:bg-[rgba(143,255,198,0.16)] hover:text-white"
              >
                Judge Mode
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/judge/roadmap"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,255,198,0.24)] bg-[rgba(143,255,198,0.08)] px-3 py-1.5 text-[11px] font-bold text-[#9dffd4] transition hover:bg-[rgba(143,255,198,0.16)] hover:text-white"
              >
                Roadmap
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>

        {swapState === "success" ? <SuccessModal onClose={resetSwap} /> : null}
      </section>
    </main>
  );
}

function TokenInput({
  label,
  amount,
  onAmountChange,
  token,
  onTokenChange,
  disabled,
}: {
  label: string;
  amount: string;
  onAmountChange: (value: string) => void;
  token: FromToken;
  onTokenChange: (value: FromToken) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(143,255,198,0.16)] bg-[rgba(1,8,5,0.58)] p-5">
      <div className="flex items-center justify-between gap-4">
        <label className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9db4a5]">
          {label}
        </label>
        <div className="flex rounded-full border border-[rgba(143,255,198,0.14)] bg-[rgba(143,255,198,0.06)] p-1">
          {fromTokens.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onTokenChange(option)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-black transition ${
                token === option
                  ? "bg-[#fff1ad] text-[#151005] shadow-[0_0_20px_rgba(255,224,138,0.22)]"
                  : "text-[#cfe8d3] hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          disabled={disabled}
          inputMode="decimal"
          className="min-w-0 flex-1 bg-transparent text-[42px] font-black tracking-[-0.05em] text-[#fffdf2] outline-none placeholder:text-[#506457] disabled:opacity-70"
          placeholder="0.00"
        />
        <div className="rounded-2xl border border-[rgba(238,212,128,0.2)] bg-[rgba(238,212,128,0.1)] px-4 py-3 text-right">
          <div className="text-[18px] font-black text-[#fff3bd]">{token}</div>
          <div className="text-[11px] font-semibold text-[#bea766]">From token</div>
        </div>
      </div>
    </div>
  );
}

function TerminalLog({ logs }: { logs: string[] }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[rgba(88,255,141,0.24)] bg-[#020805] shadow-[inset_0_0_34px_rgba(88,255,141,0.06),0_0_40px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between border-b border-[rgba(88,255,141,0.12)] bg-[rgba(88,255,141,0.06)] px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-[#9dffd4]">
          <TerminalSquare className="h-4 w-4" />
          9-layer security radar
        </div>
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#58ff8d] shadow-[0_0_18px_rgba(88,255,141,0.8)]" />
      </div>
      <div className="min-h-[212px] space-y-3 px-4 py-4 font-mono text-[13px] leading-6 text-[#80ffad]">
        {logs.map((log) => (
          <div key={log} className="animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-[#ffe08a]">&gt;</span> {log}
          </div>
        ))}
        {logs.length < securityLogs.length ? (
          <div className="text-[#4cff83]">
            <span className="text-[#ffe08a]">&gt;</span> <span className="animate-pulse">Awaiting next integrity signal...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Radar;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(143,255,198,0.14)] bg-[rgba(4,18,10,0.5)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(238,212,128,0.2)] bg-[rgba(238,212,128,0.09)] text-[#ffe08a]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-[16px] font-black text-[#fffdf2]">{title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#c6d8c8]">{body}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-[rgba(238,212,128,0.28)] bg-[linear-gradient(180deg,rgba(13,36,18,0.96),rgba(3,10,6,0.98))] p-6 text-[#fffdf2] shadow-[0_0_80px_rgba(255,218,104,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#d8e6d8] transition hover:bg-white/10 hover:text-white"
          aria-label="Close Vault Swap modal"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[rgba(88,255,141,0.28)] bg-[rgba(88,255,141,0.1)] text-[#58ff8d] shadow-[0_0_34px_rgba(88,255,141,0.18)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-[30px] font-black tracking-[-0.04em]">Security Cleared. Route Pending.</h2>
        <p className="mt-3 text-[15px] leading-7 text-[#d8e6d8]">
          Vault Swap is successfully synchronized with the 9-Layer Security Stack. Mainnet liquidity integration is scheduled for Phase 2. Currently operating in Closed Alpha.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#fff7d1,#d9a92f)] px-5 py-3 text-[14px] font-black uppercase tracking-[0.08em] text-[#151005] shadow-[0_0_34px_rgba(255,218,104,0.24)] transition hover:scale-[1.01]"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
