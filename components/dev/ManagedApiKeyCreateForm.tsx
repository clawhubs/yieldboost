"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createApiKeyAction,
  type CreateApiKeyActionState,
} from "@/app/dev/actions";
import CreatedApiKeyCard from "@/components/dev/CreatedApiKeyCard";

const initialCreateApiKeyActionState: CreateApiKeyActionState = {
  success: false,
  apiKey: null,
  label: null,
  error: null,
};

interface ManagedApiKeyCreateFormProps {
  ownerWalletAddress?: string | null;
  submitLabel?: string;
}

export default function ManagedApiKeyCreateForm({
  ownerWalletAddress,
  submitLabel = "Generate API key",
}: ManagedApiKeyCreateFormProps) {
  const router = useRouter();
  const createdCardRef = useRef<HTMLDivElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [state, formAction, pending] = useActionState<CreateApiKeyActionState, FormData>(
    createApiKeyAction,
    initialCreateApiKeyActionState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
      createdCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [router, state.success]);

  return (
    <>
      {state.apiKey ? (
        <div ref={createdCardRef}>
          <CreatedApiKeyCard apiKey={state.apiKey} label={state.label} />
        </div>
      ) : null}

      <form action={formAction} className="mt-5 grid gap-3">
        {ownerWalletAddress ? (
          <input type="hidden" name="owner_wallet_address" value={ownerWalletAddress} />
        ) : null}

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">App name</span>
          <input
            name="app_name"
            required
            placeholder="Acme Vault SDK"
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Owner label</span>
          <input
            name="owner_label"
            placeholder="Acme Research Team"
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Environment</span>
          <select
            name="environment"
            defaultValue="testnet"
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          >
            <option value="testnet">testnet</option>
            <option value="mainnet">mainnet</option>
            <option value="multi">multi</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Notes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Scope, contract phase, or internal owner notes."
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          />
        </label>

        <div className="rounded-[18px] border border-[rgba(255,184,77,0.22)] bg-[rgba(255,184,77,0.08)] px-4 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffd38a]">
            Important
          </p>
          <p className="mt-2 text-[14px] leading-7 text-[#ffe4bb]">
            Raw API key hanya muncul satu kali setelah key dibuat. Daftar key di bawah hanya
            menampilkan preview, bukan raw key. Setelah halaman ditutup, di-refresh, atau key
            di-revoke, raw key tidak bisa dipulihkan lagi.
          </p>
          <label className="mt-4 flex items-start gap-3 text-[13px] leading-6 text-[#fff1d6]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
            />
            <span>
              Saya paham raw API key harus dicopy saat itu juga, dan tidak bisa dilihat lagi
              dari daftar key atau setelah revoke.
            </span>
          </label>
        </div>

        {state.error ? (
          <div className="rounded-[16px] border border-[rgba(255,112,112,0.22)] bg-[rgba(255,112,112,0.08)] px-4 py-3 text-[13px] text-[#ffb3b3]">
            {state.error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending || !acknowledged}
          className="yb-teal-button mt-2 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Generating..." : submitLabel}
        </button>
      </form>
    </>
  );
}
