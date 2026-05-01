"use client";

import { useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  DEFAULT_WALLET_ADDRESS,
  JUDGE_MODE_COOKIE_KEY,
  JUDGE_MODE_STORAGE_KEY,
  resolveWalletNetworkKey,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
} from "@/lib/wallet";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function JudgeModeBootstrap() {
  const { enterJudgeMode } = usePortfolio();

  useEffect(() => {
    enterJudgeMode();

    const savedNetworkValue = window.localStorage.getItem(WALLET_NETWORK_STORAGE_KEY) ?? undefined;
    const preferredNetwork = savedNetworkValue
      ? resolveWalletNetworkKey(savedNetworkValue)
      : "mainnet";

    window.localStorage.setItem(JUDGE_MODE_STORAGE_KEY, "true");
    setCookie(JUDGE_MODE_COOKIE_KEY, "true");
    setCookie(WALLET_COOKIE_KEY, DEFAULT_WALLET_ADDRESS);
    window.localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, preferredNetwork);
    setCookie(WALLET_NETWORK_COOKIE_KEY, preferredNetwork);

  }, [enterJudgeMode]);

  return null;
}
