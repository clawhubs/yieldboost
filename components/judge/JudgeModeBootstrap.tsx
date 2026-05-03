"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  DEFAULT_WALLET_ADDRESS,
  JUDGE_MODE_COOKIE_KEY,
  JUDGE_MODE_STORAGE_KEY,
  WALLET_CHANGE_EVENT,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";
import JudgeSyncOverlay from "@/components/judge/JudgeSyncOverlay";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

interface JudgeModeBootstrapProps {
  reviewNetworkKey: WalletNetworkKey;
}

export default function JudgeModeBootstrap({
  reviewNetworkKey,
}: JudgeModeBootstrapProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enterJudgeMode } = usePortfolio();
  const [isPending, startTransition] = useTransition();
  const [syncingNetwork, setSyncingNetwork] = useState<WalletNetworkKey | null>(null);
  const didBootstrapRef = useRef(false);

  useEffect(() => {
    setSyncingNetwork((current) => (current === reviewNetworkKey ? null : current));
  }, [reviewNetworkKey]);

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    enterJudgeMode();

    const preferredNetwork: WalletNetworkKey = "mainnet";
    const activeSearchNetwork = searchParams.get("network");
    const hasExplicitReviewNetwork =
      activeSearchNetwork === "mainnet" || activeSearchNetwork === "testnet";
    const shouldSyncToMainnet = !hasExplicitReviewNetwork;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("network", preferredNetwork);

    window.localStorage.setItem(JUDGE_MODE_STORAGE_KEY, "true");
    setCookie(JUDGE_MODE_COOKIE_KEY, "true");
    setCookie(WALLET_COOKIE_KEY, DEFAULT_WALLET_ADDRESS);
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

    if (!shouldSyncToMainnet) {
      return;
    }

    setSyncingNetwork(preferredNetwork);
    startTransition(() => {
      router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
    });
  }, [enterJudgeMode, pathname, reviewNetworkKey, router, searchParams, startTransition]);

  return syncingNetwork && isPending ? <JudgeSyncOverlay networkKey={syncingNetwork} /> : null;
}
