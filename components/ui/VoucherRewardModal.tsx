"use client";

import Link from "next/link";
import { useState } from "react";

export interface VoucherReward {
  voucher: string;
  amountYa: number;
  source: "optimize" | "vault-seal";
}

export default function VoucherRewardModal({
  reward,
  onClose,
}: {
  reward: VoucherReward | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!reward) return null;
  const activeReward = reward;

  async function copyVoucher() {
    try {
      await navigator.clipboard.writeText(activeReward.voucher);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-[460px] rounded-[24px] border border-[rgba(114,243,199,0.28)] bg-[rgba(5,12,18,0.96)] p-6 shadow-[0_0_80px_rgba(0,201,177,0.18)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#8ff7ea]">
          Congratulations
        </p>
        <h2 className="mt-3 text-[28px] font-semibold text-white">
          You earned {activeReward.amountYa} YA.
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-[#9db0c0]">
          Your 0G testnet action unlocked a YA voucher. Claim it from the faucet with any EVM
          address.
        </p>
        <div className="mt-5 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8aa2b1]">Voucher</p>
          <p className="mt-2 break-all font-mono text-[18px] font-semibold text-[#e6fffb]">
            {activeReward.voucher}
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={copyVoucher}
            className="rounded-[14px] border border-[rgba(143,247,234,0.2)] bg-[rgba(143,247,234,0.08)] px-4 py-3 text-[13px] font-semibold text-[#cffff7]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <Link
            href={`/faucet?voucher=${encodeURIComponent(activeReward.voucher)}`}
            className="yb-teal-button inline-flex items-center justify-center rounded-[14px] px-4 py-3 text-[13px] font-semibold text-slate-950"
          >
            Open faucet
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[13px] font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
