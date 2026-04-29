"use client";

import { useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  JUDGE_MODE_COOKIE_KEY,
  JUDGE_MODE_STORAGE_KEY,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
} from "@/lib/wallet";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function JudgeModeBootstrap() {
  const { networkKey, enterJudgeMode, exitJudgeMode } = usePortfolio();

  useEffect(() => {
    enterJudgeMode();

    const preferredNetwork = resolveWalletNetworkKey(
      window.localStorage.getItem(WALLET_NETWORK_STORAGE_KEY) ?? networkKey,
    );

    window.localStorage.setItem(JUDGE_MODE_STORAGE_KEY, "true");
    setCookie(JUDGE_MODE_COOKIE_KEY, "true");
    window.localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, preferredNetwork);
    setCookie(WALLET_NETWORK_COOKIE_KEY, preferredNetwork);

    return () => {
      exitJudgeMode();
    };
  }, [enterJudgeMode, exitJudgeMode, networkKey]);

  return null;
}
