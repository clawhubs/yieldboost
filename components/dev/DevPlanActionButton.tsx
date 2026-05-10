"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { getDefaultInjectedWallet, getInjectedWalletOptions } from "@/lib/browser-wallet";
import type { YaApiPlan } from "@/lib/ya-api-plans";

interface DevPlanActionButtonProps {
  plan: YaApiPlan;
  hasSession: boolean;
  prominent?: boolean;
}

function planUrl(planId: YaApiPlan["id"]) {
  return `/dev/apps?plan=${encodeURIComponent(planId)}#checkout`;
}

export default function DevPlanActionButton({
  plan,
  hasSession,
  prominent = false,
}: DevPlanActionButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutLabel = plan.checkoutPrice0g !== "0" ? `Open ${plan.name} checkout` : "Start free";
  const className = `mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold transition ${
    prominent
      ? "yb-teal-button text-slate-950"
      : "border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] text-[#9cf3e8] hover:border-[rgba(0,201,177,0.35)] hover:bg-[rgba(0,201,177,0.10)]"
  } disabled:cursor-not-allowed disabled:opacity-70`;

  async function connectAndContinue() {
    setBusy(true);
    setError(null);
    try {
      const wallet = getDefaultInjectedWallet();
      if (!wallet) {
        const detected = getInjectedWalletOptions();
        throw new Error(
          detected.length
            ? "No supported browser wallet is ready to sign."
            : "Install or unlock a browser wallet first.",
        );
      }

      const provider = wallet.provider;
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const walletAddress = accounts?.[0];
      if (!walletAddress) {
        throw new Error("No wallet account was returned.");
      }

      const challengeRes = await fetch("/dev/api/auth/challenge", {
        method: "POST",
      });
      const challengePayload = (await challengeRes.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!challengeRes.ok || !challengePayload.message) {
        throw new Error(challengePayload.error || "Failed to create wallet challenge.");
      }

      const signature = (await provider.request({
        method: "personal_sign",
        params: [challengePayload.message, walletAddress],
      })) as string;

      const verifyRes = await fetch("/dev/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          message: challengePayload.message,
          signature,
        }),
      });
      const verifyPayload = (await verifyRes.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!verifyRes.ok || !verifyPayload.success) {
        throw new Error(verifyPayload.error || "Wallet login failed.");
      }

      window.location.href = planUrl(plan.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Wallet login failed.");
      setBusy(false);
    }
  }

  if (hasSession) {
    return (
      <a href={planUrl(plan.id)} className={className}>
        {checkoutLabel}
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={connectAndContinue}
        disabled={busy}
        className={className}
      >
        {busy ? "Connecting wallet..." : "Connect wallet to continue"}
        <ArrowRight className="h-4 w-4" />
      </button>
      {error ? (
        <p className="mt-2 text-[12px] leading-5 text-[#ffb3b3]">{error}</p>
      ) : null}
    </div>
  );
}
