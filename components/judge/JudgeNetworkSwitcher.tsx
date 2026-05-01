"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getAvailableWalletNetworks,
  WALLET_NETWORK_CHANGE_REQUEST_EVENT,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";

const availableNetworks = getAvailableWalletNetworks();

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

interface JudgeNetworkSwitcherProps {
  reviewNetworkKey: WalletNetworkKey;
}

export default function JudgeNetworkSwitcher({
  reviewNetworkKey,
}: JudgeNetworkSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedNetwork, setSelectedNetwork] = useState(reviewNetworkKey);
  const [pendingNetwork, setPendingNetwork] = useState<WalletNetworkKey | null>(null);
  const orderedNetworks = useMemo(
    () =>
      [...availableNetworks].sort((left, right) =>
        left.key === "mainnet" ? -1 : right.key === "mainnet" ? 1 : 0,
      ),
    [],
  );

  useEffect(() => {
    setSelectedNetwork(reviewNetworkKey);
    setPendingNetwork((current) => (current === reviewNetworkKey ? null : current));
  }, [reviewNetworkKey]);

  function switchNetwork(nextNetwork: WalletNetworkKey) {
    setSelectedNetwork(nextNetwork);
    setPendingNetwork(nextNetwork);
    window.localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, nextNetwork);
    setCookie(WALLET_NETWORK_COOKIE_KEY, nextNetwork);
    window.dispatchEvent(
      new CustomEvent(WALLET_NETWORK_CHANGE_REQUEST_EVENT, {
        detail: { networkKey: nextNetwork },
      }),
    );
    startTransition(() => {
      router.refresh();
    });
  }

  const syncingNetwork = pendingNetwork
    ? orderedNetworks.find((network) => network.key === pendingNetwork)
    : null;
  const syncing = Boolean(syncingNetwork);

  return (
    <>
      {syncingNetwork ? (
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
              Loading {syncingNetwork.key === "mainnet" ? "Mainnet" : "Testnet"} snapshot
            </div>
            <div className="mt-3 text-[13px] leading-6 text-[#b8c7d1]">
              Refreshing the server-rendered Judge Mode view and reopening it only after the wallet snapshot, proof history, and contract artifacts match {syncingNetwork.label}.
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
      ) : null}

      <div
        data-testid="judge-network-switcher"
        className="mt-5 w-full max-w-3xl rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#87a0ad]">
              Review network
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#d7e0e8]">
              Switch the judge snapshot between mainnet and testnet without leaving this page.
            </div>
          </div>
          <div className="inline-flex flex-wrap gap-2">
            {orderedNetworks.map((network) => {
              const active = network.key === selectedNetwork;
              return (
                <button
                  key={network.key}
                  type="button"
                  data-testid={`judge-network-${network.key}`}
                  disabled={!network.enabled || active || isPending || syncing}
                  onClick={() => switchNetwork(network.key)}
                  className={`rounded-full border px-3 py-2 text-left text-[12px] transition ${
                    active
                      ? "border-[rgba(34,221,208,0.34)] bg-[rgba(34,221,208,0.14)] text-white"
                      : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#d7e0e8] hover:border-[rgba(34,221,208,0.28)] hover:text-white"
                  } ${!network.enabled || syncing ? "cursor-not-allowed opacity-75" : ""}`}
                >
                  <div className="font-semibold">{network.key === "mainnet" ? "Mainnet" : "Testnet"}</div>
                  <div className="mt-0.5 text-[11px] text-[#8ea1af]">
                    {active
                      ? syncing
                        ? "Syncing latest proof"
                        : "Current review network"
                      : network.chainName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
