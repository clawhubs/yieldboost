"use client";

import { useMemo, useState } from "react";

interface CreatedApiKeyCardProps {
  apiKey: string;
  label: string | null;
}

export default function CreatedApiKeyCard({ apiKey, label }: CreatedApiKeyCardProps) {
  const [copied, setCopied] = useState<"key" | "env" | null>(null);

  const envSnippet = useMemo(() => {
    const normalized =
      (label || "yieldboost_api")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "YIELDBOOST_API";

    return `YIELDBOOST_API_KEY_${normalized}=${apiKey}`;
  }, [apiKey, label]);

  async function copyValue(kind: "key" | "env", value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        fallbackCopy(value);
      }
    } else {
      fallbackCopy(value);
    }
    setCopied(kind);
    window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1800);
  }

  function fallbackCopy(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function downloadEnvSnippet() {
    const blob = new Blob([`${envSnippet}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(label || "yieldboost-api-key").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.env.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="glass-accent rounded-[24px] p-5">
      <p className="text-[12px] uppercase tracking-[0.2em] text-[#8ff7ea]">Fresh API Key</p>
      <h2 className="mt-2 text-[22px] font-semibold text-white">
        {label ? `${label} is ready.` : "A new API key is ready."}
      </h2>
      <div className="mt-3 rounded-[18px] border border-[rgba(255,112,112,0.28)] bg-[rgba(255,112,112,0.1)] px-4 py-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffb3b3]">
          Copy this now
        </p>
        <p className="mt-2 text-[14px] leading-7 text-[#ffd3d3]">
          Ini satu-satunya saat raw API key ditampilkan. Daftar managed keys hanya menyimpan
          preview. Setelah refresh, tutup halaman, atau revoke, raw key ini tidak bisa dilihat
          lagi.
        </p>
      </div>

      <div className="mt-4 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(5,12,18,0.55)] px-4 py-4 font-mono text-[13px] text-[#e6fffb]">
        {apiKey}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => copyValue("key", apiKey)}
          className="rounded-[16px] border border-[rgba(143,247,234,0.2)] bg-[rgba(143,247,234,0.08)] px-4 py-3 text-[13px] font-semibold text-[#cffff7]"
        >
          {copied === "key" ? "Copied raw key" : "Copy raw key"}
        </button>
        <button
          type="button"
          onClick={() => copyValue("env", envSnippet)}
          className="rounded-[16px] border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[13px] font-semibold text-white"
        >
          {copied === "env" ? "Copied env snippet" : "Copy env snippet"}
        </button>
        <button
          type="button"
          onClick={downloadEnvSnippet}
          className="rounded-[16px] border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[13px] font-semibold text-white"
        >
          Download env file
        </button>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.04)] px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8aa2b1]">Suggested .env line</p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] leading-6 text-[#d7f8f2]">
          {envSnippet}
        </pre>
      </div>
    </section>
  );
}
