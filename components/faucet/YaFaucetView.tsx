"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Gift, Send } from "lucide-react";

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
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to claim voucher.");
      }

      setStatus("success");
      setMessage(`Claimed ${payload.amountYa ?? 888} YA. Token transfer is on 0G Galileo testnet.`);
      setTxHash(payload.txHash || "");
      setExplorerUrl(payload.explorerUrl || "");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to claim voucher.");
    }
  }

  return (
    <main className="min-h-screen bg-[#03070b] px-5 py-10 text-white md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[960px] items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-[rgba(114,243,199,0.16)] bg-[rgba(255,255,255,0.04)] p-7">
            <div className="glass-accent flex h-14 w-14 items-center justify-center rounded-[18px] text-[#76f0df]">
              <Gift className="h-7 w-7" />
            </div>
            <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#8ff7ea]">
              YA Testnet Faucet
            </p>
            <h1 className="mt-3 text-[42px] font-semibold leading-tight text-white">
              Claim 888 YA with a voucher.
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[#9db0c0]">
              Vouchers are earned after a successful 0G testnet optimizer run or vault seal. Claims
              only send testnet YA and never touch mainnet assets.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 shadow-[0_0_80px_rgba(0,201,177,0.08)]">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">
                  EVM address
                </span>
                <input
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  placeholder="0x..."
                  className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">
                  Voucher
                </span>
                <input
                  value={voucher}
                  onChange={(event) => setVoucher(event.target.value.toUpperCase())}
                  placeholder="YA-XXXX-XXXX-XXXX"
                  className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 font-mono text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
                />
              </label>

              <button
                type="button"
                onClick={claimVoucher}
                disabled={status === "claiming"}
                className="yb-teal-button mt-2 inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {status === "claiming" ? "Claiming..." : "Claim 888 YA"}
              </button>

              {message ? (
                <div
                  className={`rounded-[16px] border px-4 py-3 text-[13px] leading-6 ${
                    status === "success"
                      ? "border-[rgba(114,243,199,0.22)] bg-[rgba(114,243,199,0.08)] text-[#9cf3e8]"
                      : status === "error"
                        ? "border-[rgba(255,112,112,0.22)] bg-[rgba(255,112,112,0.08)] text-[#ffb3b3]"
                        : "border-white/10 bg-[rgba(255,255,255,0.04)] text-[#9db0c0]"
                  }`}
                >
                  {message}
                  {txHash ? (
                    <div className="mt-2 break-all font-mono text-[12px]">{txHash}</div>
                  ) : null}
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-[12px] font-semibold text-white underline decoration-[#72f3c7]/50 underline-offset-4"
                    >
                      Open transaction
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
