"use client";

import type { WalletNetworkKey } from "@/lib/wallet";

interface JudgeSyncOverlayProps {
  networkKey: WalletNetworkKey;
}

export default function JudgeSyncOverlay({ networkKey }: JudgeSyncOverlayProps) {
  const networkLabel = networkKey === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <div
      data-testid="judge-network-sync-overlay"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02070b]/78 px-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-[rgba(34,221,208,0.24)] bg-[linear-gradient(145deg,rgba(5,18,24,0.98),rgba(2,8,12,0.96))] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.62)]">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.8),transparent)]" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[rgba(34,221,208,0.28)] bg-[rgba(34,221,208,0.08)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(34,221,208,0.18)] border-t-[#22ddd0]" />
        </div>
        <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-[#86f7ef]">
          Syncing latest proof
        </div>
        <div className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold text-white">
          Loading {networkLabel} snapshot
        </div>
        <div className="mt-3 text-[13px] leading-6 text-[#b8c7d1]">
          Refreshing the server-rendered Judge Mode view and reopening it only after the wallet snapshot, proof history, and contract artifacts match 0G {networkLabel}.
        </div>
        <div className="mt-5 grid gap-2 text-left text-[12px] text-[#dbe7ed]">
          {[
            "Locking review network",
            "Fetching latest proof snapshot",
            "Matching deployment artifacts",
          ].map((item) => (
            <div
              key={item}
              className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22ddd0]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
