"use client";

import Link from "next/link";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";

const COOKIE_PREF_KEY = "yb_protocol_cookie_pref";

export default function DevCookieBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(COOKIE_PREF_KEY);
    setVisible(!savedPreference);
  }, []);

  function savePreference(value: "essential" | "all") {
    window.localStorage.setItem(COOKIE_PREF_KEY, value);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 md:px-5 md:pb-5">
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-3 rounded-2xl border border-[rgba(255,214,102,0.16)] bg-[rgba(7,10,16,0.94)] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(255,214,102,0.2)] bg-[rgba(255,214,102,0.08)] text-[#ffd666]">
            <Cookie className="h-4 w-4" />
          </div>
          <p className="min-w-0 text-[13px] leading-6 text-[#d0dde8] md:text-[13.5px]">
            We use cookies to improve the store experience and keep wallet-bound flows stable. By continuing, you agree to essential storage and optional analytics preferences.{" "}
            <Link href="/dev/privacy" className="font-semibold text-[#f7f8fb] underline decoration-[rgba(255,255,255,0.4)] underline-offset-4 transition hover:text-[#72f3c7]">
              Learn more
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => savePreference("essential")}
            className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d0dde8] transition hover:border-[rgba(0,201,177,0.28)] hover:text-white"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => savePreference("all")}
            className="inline-flex items-center justify-center rounded-full bg-[#f7f8fb] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-white"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
