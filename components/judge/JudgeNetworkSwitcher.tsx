"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  getAvailableWalletNetworks,
  WALLET_NETWORK_CHANGE_REQUEST_EVENT,
  type WalletNetworkKey,
} from "@/lib/wallet";

const availableNetworks = getAvailableWalletNetworks();

export default function JudgeNetworkSwitcher() {
  const { networkKey } = usePortfolio();
  const orderedNetworks = useMemo(
    () =>
      [...availableNetworks].sort((left, right) =>
        left.key === "mainnet" ? -1 : right.key === "mainnet" ? 1 : 0,
      ),
    [],
  );

  function switchNetwork(nextNetwork: WalletNetworkKey) {
    window.dispatchEvent(
      new CustomEvent(WALLET_NETWORK_CHANGE_REQUEST_EVENT, {
        detail: { networkKey: nextNetwork },
      }),
    );
  }

  return (
    <div className="mt-5 w-full max-w-3xl rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
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
            const active = network.key === networkKey;
            return (
              <button
                key={network.key}
                type="button"
                disabled={!network.enabled || active}
                onClick={() => switchNetwork(network.key)}
                className={`rounded-full border px-3 py-2 text-left text-[12px] transition ${
                  active
                    ? "border-[rgba(34,221,208,0.34)] bg-[rgba(34,221,208,0.14)] text-white"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#d7e0e8] hover:border-[rgba(34,221,208,0.28)] hover:text-white"
                } ${!network.enabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="font-semibold">{network.key === "mainnet" ? "Mainnet" : "Testnet"}</div>
                <div className="mt-0.5 text-[11px] text-[#8ea1af]">
                  {active ? "Current review network" : network.chainName}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
