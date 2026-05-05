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

  return (
    <section className="glass-accent rounded-[24px] p-5">
      <p className="text-[12px] uppercase tracking-[0.2em] text-[#8ff7ea]">Fresh API Key</p>
      <h2 className="mt-2 text-[22px] font-semibold text-white">
        {label ? `${label} is ready.` : "A new API key is ready."}
      </h2>
      <p className="mt-3 text-[14px] leading-7 text-[#d4f6f1]">
        The raw key is visible once by design. YieldBoost stores only a hashed version after creation, so if this value is lost the safe recovery path is to rotate and mint a new key.
      </p>

      <div className="mt-4 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(5,12,18,0.55)] px-4 py-4 font-mono text-[13px] text-[#e6fffb]">
        {apiKey}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
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
