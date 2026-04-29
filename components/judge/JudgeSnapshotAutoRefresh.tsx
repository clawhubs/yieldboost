"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_WALLET_ADDRESS,
  PROOF_STORED_EVENT,
  PROOF_STORED_STORAGE_KEY,
  sameWalletAddress,
} from "@/lib/wallet";

const REFRESH_INTERVAL_MS = 15000;

function shouldRefreshForWallet(walletAddress: unknown) {
  if (typeof walletAddress !== "string") {
    return true;
  }

  return sameWalletAddress(walletAddress, DEFAULT_WALLET_ADDRESS);
}

export default function JudgeSnapshotAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    function refreshJudgeSnapshot() {
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
    }, REFRESH_INTERVAL_MS);

    window.addEventListener(PROOF_STORED_EVENT, handleProofStored as EventListener);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshJudgeSnapshot);
    window.addEventListener("pageshow", refreshJudgeSnapshot);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(PROOF_STORED_EVENT, handleProofStored as EventListener);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshJudgeSnapshot);
      window.removeEventListener("pageshow", refreshJudgeSnapshot);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  return null;
}
