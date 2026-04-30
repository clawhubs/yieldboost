"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_WALLET_ADDRESS,
  PROOF_STORED_EVENT,
  PROOF_STORED_STORAGE_KEY,
  sameWalletAddress,
} from "@/lib/wallet";

const MIN_REFRESH_GAP_MS = 12000;

function shouldRefreshForWallet(walletAddress: unknown) {
  if (typeof walletAddress !== "string") {
    return true;
  }

  return sameWalletAddress(walletAddress, DEFAULT_WALLET_ADDRESS);
}

export default function JudgeSnapshotAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let lastRefreshAt = 0;

    function refreshJudgeSnapshot() {
      const now = Date.now();
      if (now - lastRefreshAt < MIN_REFRESH_GAP_MS) {
        return;
      }

      lastRefreshAt = now;
      router.refresh();
    }

    function handleProofStored(event: Event) {
      const detail = (event as CustomEvent<{ walletAddress?: string }>).detail;
      if (shouldRefreshForWallet(detail?.walletAddress)) {
        refreshJudgeSnapshot();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === PROOF_STORED_STORAGE_KEY) {
        refreshJudgeSnapshot();
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        refreshJudgeSnapshot();
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshJudgeSnapshot();
      }
    }, 45000);

    window.addEventListener(PROOF_STORED_EVENT, handleProofStored as EventListener);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshJudgeSnapshot);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(PROOF_STORED_EVENT, handleProofStored as EventListener);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshJudgeSnapshot);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  return null;
}
