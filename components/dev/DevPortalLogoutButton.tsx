"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function DevPortalLogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="yb-soft-card inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-white"
      >
        <LogOut className="h-4 w-4" />
        {busy ? "Disconnecting..." : "Disconnect wallet"}
      </button>
      {error ? <p className="text-[12px] text-[#ff8f8f]">{error}</p> : null}
    </div>
  );
}
