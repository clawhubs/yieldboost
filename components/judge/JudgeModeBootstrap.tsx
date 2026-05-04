"use client";

import { useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  DEFAULT_WALLET_ADDRESS,
  getDefaultWalletNetworkKey,
  getServer0GNetworkConfig,
  JUDGE_NETWORK_COOKIE_KEY,
  JUDGE_NETWORK_STORAGE_KEY,
  JUDGE_MODE_COOKIE_KEY,
  JUDGE_MODE_STORAGE_KEY,
  WALLET_COOKIE_KEY,
  resolveWalletNetworkKey,
  WALLET_CHANGE_EVENT,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
  WALLET_OVERRIDE_STORAGE_KEY,
  WALLET_PROVIDER_STORAGE_KEY,
} from "@/lib/wallet";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function getCookieValue(name: string) {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return match ? match.slice(prefix.length) : undefined;
}

export default function JudgeModeBootstrap() {
  const { enterJudgeMode } = usePortfolio();

  useEffect(() => {
    enterJudgeMode();

    const savedJudgeNetwork =
      window.localStorage.getItem(JUDGE_NETWORK_STORAGE_KEY) ??
      getCookieValue(JUDGE_NETWORK_COOKIE_KEY);
    const preferredNetwork = savedJudgeNetwork
      ? resolveWalletNetworkKey(savedJudgeNetwork)
      : getServer0GNetworkConfig("mainnet").enabled
        ? "mainnet"
        : getDefaultWalletNetworkKey();

    window.localStorage.setItem(JUDGE_MODE_STORAGE_KEY, "true");
    setCookie(JUDGE_MODE_COOKIE_KEY, "true");
    window.localStorage.removeItem(WALLET_OVERRIDE_STORAGE_KEY);
    window.localStorage.removeItem(WALLET_PROVIDER_STORAGE_KEY);
    document.cookie = `${WALLET_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    window.localStorage.setItem(JUDGE_NETWORK_STORAGE_KEY, preferredNetwork);
    setCookie(JUDGE_NETWORK_COOKIE_KEY, preferredNetwork);
    window.localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, preferredNetwork);
    setCookie(WALLET_NETWORK_COOKIE_KEY, preferredNetwork);
    window.dispatchEvent(
      new CustomEvent(WALLET_CHANGE_EVENT, {
        detail: {
          walletAddress: DEFAULT_WALLET_ADDRESS,
          networkKey: preferredNetwork,
          walletLabel: "Judge demo wallet",
          connected: false,
        },
      }),
    );
  }, [enterJudgeMode]);

  return null;
}
