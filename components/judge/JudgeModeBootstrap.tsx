"use client";

import { useEffect, useRef } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  DEFAULT_WALLET_ADDRESS,
  JUDGE_MODE_COOKIE_KEY,
  JUDGE_MODE_STORAGE_KEY,
  resolveWalletNetworkKey,
  WALLET_CHANGE_EVENT,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
  WALLET_OVERRIDE_STORAGE_KEY,
  WALLET_PROVIDER_STORAGE_KEY,
} from "@/lib/wallet";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function JudgeModeBootstrap() {
  const { networkKey, enterJudgeMode } = usePortfolio();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;

    enterJudgeMode();

    const preferredNetwork = resolveWalletNetworkKey(
      window.localStorage.getItem(WALLET_NETWORK_STORAGE_KEY) ?? networkKey,
    );

    window.localStorage.setItem(JUDGE_MODE_STORAGE_KEY, "true");
    setCookie(JUDGE_MODE_COOKIE_KEY, "true");
    window.localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, preferredNetwork);
    setCookie(WALLET_NETWORK_COOKIE_KEY, preferredNetwork);
    window.localStorage.removeItem(WALLET_PROVIDER_STORAGE_KEY);
    window.localStorage.setItem(WALLET_OVERRIDE_STORAGE_KEY, DEFAULT_WALLET_ADDRESS);
    setCookie(WALLET_COOKIE_KEY, DEFAULT_WALLET_ADDRESS);

    window.dispatchEvent(
      new CustomEvent(WALLET_CHANGE_EVENT, {
        detail: {
          walletAddress: DEFAULT_WALLET_ADDRESS,
          networkKey: preferredNetwork,
          connected: false,
        },
      }),
    );
  }, [enterJudgeMode, networkKey]);

  return null;
}
