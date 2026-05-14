"use client";

import { useState } from "react";
import { BrowserProvider } from "ethers";

export default function DevHideRevokedKeyButton({
  keyId,
  walletAddress,
}: {
  keyId: string;
  walletAddress: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleHide() {
    setBusy(true);
    setError(null);
    try {
      if (!window.ethereum?.request) {
        throw new Error("Install or unlock a browser wallet first.");
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const account = accounts?.[0];
      if (!account || account.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("The connected wallet must match the wallet signed into this dashboard.");
      }

      const challengeRes = await fetch("/dev/api/keys/hide/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          keyId,
        }),
      });
      const challengePayload = (await challengeRes.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!challengeRes.ok || !challengePayload.message) {
        throw new Error(challengePayload.error || "Unable to prepare key removal.");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(challengePayload.message);

      const hideRes = await fetch("/dev/api/keys/hide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          keyId,
          message: challengePayload.message,
          signature,
        }),
      });
      const hidePayload = (await hideRes.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!hideRes.ok || !hidePayload.success) {
        throw new Error(hidePayload.error || "Unable to remove this key from the dashboard.");
      }

      window.location.reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to remove this key from the dashboard.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleHide}
        disabled={busy}
        className="w-full rounded-lg border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[12px] font-semibold text-white transition hover:border-[rgba(255,255,255,0.16)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Waiting for wallet signature..." : "Remove from this dashboard"}
      </button>
      {error ? <p className="text-[12px] leading-5 text-[#ffb3b3]">{error}</p> : null}
    </div>
  );
}
