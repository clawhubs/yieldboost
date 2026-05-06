"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Gift,
  Send,
  Wallet,
  TicketCheck,
  Zap,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Coins,
  Globe,
  Fingerprint,
  LockKeyhole,
} from "lucide-react";
import ParticleCanvas from "@/components/dev/ParticleCanvas";

const HOW_IT_WORKS = [
  { step: "1", icon: Zap, title: "Earn a voucher", desc: "Run optimizer or seal a vault on 0G testnet." },
  { step: "2", icon: Wallet, title: "Use the same wallet", desc: "The voucher is bound to the wallet that earned it." },
  { step: "3", icon: TicketCheck, title: "Paste your voucher", desc: "The unique code from your testnet action." },
  { step: "4", icon: Coins, title: "Receive 888 YA", desc: "One migration-eligible claim per wallet." },
];

export default function YaFaucetView() {
  const searchParams = useSearchParams();
  const initialVoucher = useMemo(() => searchParams.get("voucher") || "", [searchParams]);
  const [walletAddress, setWalletAddress] = useState("");
  const [voucher, setVoucher] = useState(initialVoucher);
  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");

  async function claimVoucher() {
    setStatus("claiming");
    setMessage("Sending 888 YA on 0G Galileo testnet...");
    setTxHash("");
    setExplorerUrl("");
    try {
      const response = await fetch("/api/ya/faucet/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress, voucher }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        amountYa?: number;
        txHash?: string;
        explorerUrl?: string;
        migrationEligible?: boolean;
        antiSybil?: {
          walletBound?: boolean;
          oneWalletOneClaim?: boolean;
          l8Throttle?: string;
          alibabaBehaviorFingerprint?: string;
        };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to claim voucher.");
      }

      setStatus("success");
      setMessage(
        payload.migrationEligible
          ? `Claimed ${payload.amountYa ?? 888} YA. This wallet is now migration-eligible.`
          : `Claimed ${payload.amountYa ?? 888} YA. Token transfer is on 0G Galileo testnet.`,
      );
      setTxHash(payload.txHash || "");
      setExplorerUrl(payload.explorerUrl || "");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to claim voucher.");
    }
  }

  const canClaim = walletAddress.trim().length > 0 && voucher.trim().length > 0 && status !== "claiming";

  return (
    <main className="bunker-grid faucet-screen relative min-h-screen w-full font-[family-name:var(--font-inter)] text-white">
      <ParticleCanvas />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-10 md:px-8 md:py-16">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="hero-panel fade-in-up fade-in-up-1 p-8 md:p-12">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,201,177,0.30)] bg-[rgba(0,201,177,0.08)] shadow-[0_0_40px_rgba(0,201,177,0.15)]">
              <Gift className="h-8 w-8 text-[#72f3c7]" />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] px-4 py-1.5">
              <span className="status-active" />
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8ff7ea]">YA Testnet Faucet</span>
            </div>
            <h1 className="shimmer-text mt-6 max-w-2xl text-[36px] font-extrabold leading-[1.1] tracking-tight md:text-[52px]">
              Claim 888 YA with a voucher.
            </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-8 text-[#d0e0ec] md:text-[17px]">
                Vouchers are earned after a successful 0G testnet optimizer run or vault seal.
                Claims are wallet-bound, one-time, and protected by the 9-layer anti-sybil gate.
              </p>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section className="fade-in-up fade-in-up-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="glow-card group p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.25)] bg-[rgba(0,201,177,0.08)] text-[#72f3c7] transition-all group-hover:shadow-[0_0_20px_rgba(0,201,177,0.15)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(0,201,177,0.20)] bg-[rgba(0,201,177,0.06)] text-[11px] font-bold text-[#72f3c7]">
                  {item.step}
                </div>
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-white">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-[#c8dae6]">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* ── Claim Form + Info ─────────────────────────────── */}
        <section className="fade-in-up fade-in-up-3 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Form card */}
          <div className="glow-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)]">
                <Send className="h-5 w-5 text-[#72f3c7]" />
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-white">Claim your tokens</h2>
                <p className="text-[13px] text-[#c0d4e2]">Fill both fields, then hit claim.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d0e0ec]">
                  Recipient wallet address
                </span>
                <input
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  placeholder="0x1234...abcd"
                  className="rounded-xl border border-white/10 bg-[rgba(3,10,18,0.60)] px-4 py-3.5 text-[15px] text-white placeholder:text-[#7a95a8] outline-none transition-all duration-200 focus:border-[rgba(0,201,177,0.40)] focus:shadow-[0_0_20px_rgba(0,201,177,0.08)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d0e0ec]">
                  Voucher code
                </span>
                <input
                  value={voucher}
                  onChange={(event) => setVoucher(event.target.value.toUpperCase())}
                  placeholder="YA-XXXX-XXXX-XXXX"
                  className="rounded-xl border border-white/10 bg-[rgba(3,10,18,0.60)] px-4 py-3.5 font-mono text-[15px] tracking-wider text-white placeholder:text-[#7a95a8] outline-none transition-all duration-200 focus:border-[rgba(0,201,177,0.40)] focus:shadow-[0_0_20px_rgba(0,201,177,0.08)]"
                />
              </label>

              <button
                type="button"
                onClick={claimVoucher}
                disabled={!canClaim}
                className="yb-teal-button mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-[16px] font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "claiming" ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Send className="h-4.5 w-4.5" />
                    Claim 888 YA
                  </>
                )}
              </button>

              {/* Status feedback */}
              {message ? (
                <div
                  className={`rounded-xl border px-5 py-4 text-[14px] leading-7 ${
                    status === "success"
                      ? "border-[rgba(114,243,199,0.30)] bg-[rgba(114,243,199,0.08)] text-[#d4f6f1]"
                      : status === "error"
                        ? "border-[rgba(255,112,112,0.30)] bg-[rgba(255,112,112,0.08)] text-[#ffc8c8]"
                        : "border-white/12 bg-[rgba(255,255,255,0.04)] text-[#d0e0ec]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {status === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#72f3c7]" />
                    ) : null}
                    <div className="min-w-0">
                      <p>{message}</p>
                      {txHash ? (
                        <p className="mt-2 break-all font-mono text-[12px] text-[#b8ece5]">{txHash}</p>
                      ) : null}
                      {explorerUrl ? (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#72f3c7] transition hover:text-white"
                        >
                          View on explorer
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Info sidebar */}
          <div className="flex flex-col gap-4">
            <div className="glow-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)]">
                  <Coins className="h-4.5 w-4.5 text-[#72f3c7]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c0d4e2]">Reward per claim</p>
                  <p className="text-[24px] font-bold text-white">888 <span className="text-[16px] font-semibold text-[#72f3c7]">YA</span></p>
                </div>
              </div>
            </div>

            <div className="glow-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)]">
                  <Fingerprint className="h-4.5 w-4.5 text-[#72f3c7]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c0d4e2]">Anti-Sybil Gate</p>
                  <p className="text-[14px] font-medium leading-6 text-[#e0eaf2]">Not a public faucet. This is a proof-of-use migration gate.</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5 text-[13px] leading-6 text-[#d0e0ec]">
                <li className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                  1 wallet = 1 migration claim forever
                </li>
                <li className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                  Voucher must be claimed by the wallet that earned it
                </li>
                <li className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                  IP, device, timing, and retry behavior pass L8 throttling
                </li>
                <li className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#72f3c7]" />
                  Alibaba behavior fingerprinting supports anomaly review
                </li>
              </ul>
            </div>

            <div className="glow-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)]">
                  <Globe className="h-4.5 w-4.5 text-[#72f3c7]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c0d4e2]">Network</p>
                  <p className="text-[17px] font-semibold text-white">0G Galileo Testnet</p>
                </div>
              </div>
            </div>

            <div className="glow-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.06)]">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#72f3c7]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c0d4e2]">Safety</p>
                  <p className="text-[14px] font-medium leading-6 text-[#e0eaf2]">Testnet only — no mainnet assets are ever affected.</p>
                </div>
              </div>
            </div>

            <div className="glow-card flex-1 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">How to get vouchers</p>
              <ul className="mt-3 space-y-2.5 text-[13px] leading-6 text-[#d0e0ec]">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#72f3c7]" />
                  Run the optimizer on 0G testnet
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#72f3c7]" />
                  Seal a vault record on 0G testnet
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#72f3c7]" />
                  Only one wallet-bound claim can become migration-eligible
                </li>
              </ul>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(114,243,199,0.28)] bg-[rgba(114,243,199,0.08)] px-4 py-3 text-[13px] font-bold text-[#d8fff8] transition hover:border-[rgba(114,243,199,0.48)] hover:bg-[rgba(114,243,199,0.14)]"
                >
                  <Zap className="h-4 w-4 text-[#72f3c7]" />
                  Run optimizer
                </Link>
                <Link
                  href="/vault"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(114,243,199,0.28)] bg-[rgba(114,243,199,0.08)] px-4 py-3 text-[13px] font-bold text-[#d8fff8] transition hover:border-[rgba(114,243,199,0.48)] hover:bg-[rgba(114,243,199,0.14)]"
                >
                  <ShieldCheck className="h-4 w-4 text-[#72f3c7]" />
                  Seal vault
                </Link>
              </div>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#72f3c7] transition hover:text-white"
              >
                Back to home
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
