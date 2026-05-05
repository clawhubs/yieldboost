"use client";

import { useState } from "react";
import { LogOut, Shield, Wallet } from "lucide-react";

import { getDefaultInjectedWallet, getInjectedWalletOptions } from "@/lib/browser-wallet";
import { getDefaultWalletNetworkKey } from "@/lib/wallet";

interface DevPortalAccessCardProps {
  session:
    | {
        walletAddress: string;
        role: "owner" | "developer";
      }
    | null
    | undefined;
}

export default function DevPortalAccessCard({ session }: DevPortalAccessCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
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
        session?: { role?: "owner" | "developer" };
      };
      if (!verifyRes.ok || !verifyPayload.success) {
        throw new Error(verifyPayload.error || "Wallet login failed.");
      }

      window.location.href =
        verifyPayload.session?.role === "owner" ? "/dev/console" : "/dev/apps";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Wallet login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/dev/api/auth/logout", { method: "POST" });
      window.location.href = "/dev";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Logout failed.");
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="yb-card rounded-[24px] p-6">
        <div className="flex items-center gap-3">
          <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[16px] text-[#76f0df]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8aa2b1]">Portal Session</p>
            <h2 className="text-[20px] font-semibold text-white">
              {session.role === "owner" ? "Owner access active" : "Developer access active"}
            </h2>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-7 text-[#a5b8c7]">
          Wallet {session.walletAddress.slice(0, 8)}...{session.walletAddress.slice(-4)} is signed in.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={session.role === "owner" ? "/dev/console" : "/dev/apps"}
            className="yb-teal-button rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950"
          >
            {session.role === "owner" ? "Open owner dashboard" : "Open developer dashboard"}
          </a>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="yb-soft-card flex items-center gap-2 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="yb-card rounded-[24px] p-6">
      <div className="flex items-center gap-3">
        <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[16px] text-[#76f0df]">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-[#8aa2b1]">Wallet Login</p>
          <h2 className="text-[20px] font-semibold text-white">Register or sign in with wallet</h2>
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-7 text-[#a5b8c7]">
        No email is required. Connect a browser wallet, sign one login message, and the portal will auto-register you as a developer. If the connected wallet is the founder wallet, you go straight to the owner dashboard.
      </p>
      <p className="mt-3 text-[13px] leading-6 text-[#93aabd]">
        Recommended beta posture: use a 0G {getDefaultWalletNetworkKey()} wallet first.
      </p>
      {error ? <p className="mt-4 text-[13px] text-[#ff8f8f]">{error}</p> : null}
      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        className="yb-teal-button mt-5 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950"
      >
        {busy ? "Connecting wallet..." : "Connect wallet to continue"}
      </button>
    </div>
  );
}
