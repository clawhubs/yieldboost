"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getApiMarketplaceProduct } from "@/lib/military-grade-api-marketplace";

const product = getApiMarketplaceProduct("aws-nitro-fortress");
const publicDemoEndpoint = "/api/dev/store/aws-nitro-fortress/demo";

const attackLogSteps = [
  "Initializing Nitro fortress perimeter...",
  "Running Alibaba distraction screen... [PASSED]",
  "Checking 0G TEE badge... [VERIFIED]",
  "Writing incident memory to 0G Storage... [ANCHORED]",
  "Attack absorbed by enclave wall... [NO EFFECT]",
  "Soldier integrity restored from journal replay...",
];

const sealLogSteps = [
  "Opening enclave-only secret lane...",
  "Hashing secret for Nitro seal path...",
  "Attaching 0G TEE badge... [VERIFIED]",
  "Writing immutable memory receipt to 0G Storage...",
  "Secret sealed inside the fortress...",
];

type ActionMode = "idle" | "seal" | "attack" | "destruct";

export default function NitroFortressPlayground() {
  const [secret, setSecret] = useState("My private route alpha stays inside the bunker.");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ActionMode>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [destroyed, setDestroyed] = useState(false);
  const [visitorId, setVisitorId] = useState("nitro-visitor-local");

  const endpoint = product?.endpoint ?? "/api/dev/store/aws-nitro-fortress";
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("yieldboost:nitro-visitor-id");
    if (existing) {
      setVisitorId(existing);
      return;
    }
    const nextValue = `nitro-${crypto.randomUUID()}`;
    window.localStorage.setItem("yieldboost:nitro-visitor-id", nextValue);
    setVisitorId(nextValue);
  }, []);

  const curlSnippet = useMemo(() => {
    return `curl -X POST https://dev.yieldboostai.xyz${publicDemoEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"operation":"seal_secret","secret":"arb route alpha","operator":"public-demo-visitor","visitorId":"${visitorId}"}'`;
  }, [visitorId]);
  const resultStatus = typeof result?.status === "string" ? result.status : null;

  useEffect(() => {
    if (!loading) return;

    const queue = mode === "attack" || mode === "destruct" ? attackLogSteps : sealLogSteps;
    setLogs([]);
    const timeouts = queue.map((line, index) =>
      window.setTimeout(() => {
        setLogs((current) => [...current, line]);
      }, 650 * (index + 1)),
    );

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [loading, mode]);

  async function runAction(nextMode: Exclude<ActionMode, "idle">) {
    setLoading(true);
    setMode(nextMode);
    setError(null);
    setResult(null);
    if (nextMode === "destruct") {
      setDestroyed(true);
    }

    const payload =
      nextMode === "seal"
        ? {
            requestId: `nitro-seal-${Date.now()}`,
            network: "mainnet",
            operation: "seal_secret",
            secret,
            operator: "judge-demo",
            sdkMode: "marketplace-playground",
          }
        : {
            requestId: `nitro-attack-${Date.now()}`,
            network: "mainnet",
            operation: nextMode === "destruct" ? "destruct_recovery" : "attack_simulation",
            secret,
            attackVector: nextMode === "destruct" ? "destruct-button" : "try-to-kill-the-soldier",
            operator: "judge-demo",
            sdkMode: "marketplace-playground",
          };

    try {
      const response = await fetch(publicDemoEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          visitorId,
        }),
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setResult(data);
        throw new Error(typeof data.error === "string" ? data.error : `Request failed with ${response.status}`);
      }

      const queueLength = (nextMode === "attack" || nextMode === "destruct" ? attackLogSteps : sealLogSteps).length;
      window.setTimeout(() => {
        setResult(data);
        setLoading(false);
        if (nextMode !== "destruct") {
          setDestroyed(false);
        }
      }, 650 * (queueLength + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nitro playground request failed");
      setLoading(false);
      setDestroyed(false);
    }
  }

  function resetState() {
    setLoading(false);
    setMode("idle");
    setLogs([]);
    setError(null);
    setResult(null);
    setDestroyed(false);
  }

  if (!product) return null;

  return (
    <main className="min-h-screen bg-[#04080d] p-4 text-white md:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[rgba(34,221,208,0.18)] bg-[radial-gradient(circle_at_18%_12%,rgba(175,132,34,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,221,208,0.18),transparent_24%),linear-gradient(135deg,#08110f_0%,#05070c_58%,#090b11_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dev/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-[#cfe7e3] transition hover:border-[#22ddd0]/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Modular Immunity Armory
          </Link>
          <a
            href="https://nitro.yieldboostai.xyz"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)] px-3 py-2 text-[12px] font-semibold text-[#ffe7a3]"
          >
            nitro.yieldboostai.xyz
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-[18px] border border-[rgba(212,175,55,0.34)] bg-black">
                <Image src={product.logoPath} alt={`${product.name} logo`} fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffe7a3]">
                  AWS Nitro Fortress SDK
                </div>
                <h1 className="mt-1 text-[34px] font-bold leading-tight text-white">{product.name}</h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#c9d4dc]">
              A playful security product for the marketplace: secrets are framed as enclave-only inputs, the soldier carries a 0G TEE badge, and every attack or recovery event is journaled into 0G Storage memory.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {product.layers.map((layer) => (
                <div key={layer.id} className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-[#ffe7a3]">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em]">{layer.id}</span>
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-white">{layer.label}</div>
                  <p className="mt-2 text-[12px] leading-6 text-[#afbfca]">{layer.proof}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[18px] border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.06)] p-4">
              <div className="flex items-center gap-2 text-[#ffe7a3]">
                <Sparkles className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-[0.16em]">The fun part</span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-[#f8edd0]">
                Click the attack button, try to “kill” the soldier, and the playground answers with a bunker-style recovery story: Nitro keeps the soul sealed, 0G TEE keeps the badge visible, and 0G Storage keeps the memory alive.
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#071017] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#22ddd0]">Playground endpoint</div>
                <div className="mt-1 break-all font-mono text-[13px] text-[#dce7ef]">{publicDemoEndpoint}</div>
              </div>
              <div className="rounded-full border border-[rgba(104,255,122,0.24)] bg-[rgba(104,255,122,0.08)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#dfffe4]">
                Live demo lane
              </div>
            </div>

            <div className="mt-4 rounded-[16px] border border-[rgba(0,201,177,0.16)] bg-[rgba(0,201,177,0.05)] p-4">
              <div className="flex items-center gap-2 text-[#9ff7f0]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-[0.16em]">Protected perimeter</span>
              </div>
              <div className="mt-3 grid gap-2 text-[12px] leading-6 text-[#d7e7ef]">
                <div>Anti-Sybil throttle active</div>
                <div>Alibaba behavior fingerprint active when configured</div>
                <div>Visitor/IP abuse checks active before enclave entry</div>
                <div>Protocol SDK remains available for unrestricted store access</div>
              </div>
              <div className="mt-3 text-[11px] leading-5 text-[#96b0c2]">
                Visitor lane: <span className="font-mono text-[#dce7ef]">{visitorId}</span>
              </div>
              <div className="mt-2 text-[11px] leading-5 text-[#96b0c2]">
                Public requests use the live demo lane. The paid SDK endpoint stays at{" "}
                <span className="font-mono text-[#dce7ef]">{endpoint}</span>.
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-[#dce7ef]">Kasih rahasia lu ke prajurit ini</span>
              <textarea
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-[12px] border border-white/[0.08] bg-black/30 px-3 py-3 text-[13px] leading-6 outline-none focus:border-[#22ddd0]/50"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => runAction("seal")}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#22ddd0] px-4 py-3 text-[13px] font-semibold text-[#061014] transition hover:brightness-110 disabled:opacity-70"
              >
                {loading && mode === "seal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Seal inside Nitro
              </button>
              <button
                type="button"
                onClick={() => runAction("attack")}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[rgba(212,175,55,0.26)] bg-[rgba(212,175,55,0.07)] px-4 py-3 text-[13px] font-semibold text-[#ffe7a3] transition hover:border-[rgba(212,175,55,0.42)] disabled:opacity-70"
              >
                {loading && mode === "attack" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Try to Kill/Hack the Soldier
              </button>
              <button
                type="button"
                onClick={() => runAction("destruct")}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-red-400/24 bg-red-500/10 px-4 py-3 text-[13px] font-semibold text-red-100 transition hover:border-red-400/40 disabled:opacity-70"
              >
                {loading && mode === "destruct" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Destruct
              </button>
            </div>

            <div className={`mt-4 rounded-[18px] border p-4 transition ${destroyed ? "border-red-400/24 bg-red-500/10" : "border-[rgba(255,255,255,0.08)] bg-black/20"}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#8ea1af]">Fortress status</div>
                  <div className="mt-1 text-[16px] font-semibold text-white">
                    {destroyed ? "Bunker destroyed on the surface..." : "Soldier online inside the enclave"}
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${destroyed ? "bg-red-500/20 text-red-100" : "bg-[#68ff7a]/10 text-[#dfffe4]"}`}>
                  {destroyed ? "Recovery pending" : "Secure"}
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[#c8dae6]">
              {destroyed
                  ? "UI shell looks damaged, but the memory journal and badge path are still alive."
                  : "The soldier claims the soul lives in AWS Nitro, the badge comes from 0G TEE, and the memory lives in 0G Storage."}
              </p>

              {(loading || logs.length > 0) ? (
                <div className="mt-4 rounded-[14px] border border-[rgba(0,201,177,0.18)] bg-[#031116] p-3 font-mono text-[12px] leading-6 text-[#8ffbe1]">
                  {logs.map((line) => (
                    <div key={line}>&gt; {line}</div>
                  ))}
                  {loading ? <div className="text-[#5ecdbf]">&gt; awaiting enclave response...</div> : null}
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-[14px] border border-amber-400/20 bg-amber-500/10 p-3 text-[13px] text-amber-100">
                  {error}
                </div>
              ) : null}

              {result ? (
                <div
                  className={`mt-4 rounded-[14px] border p-3 ${
                    resultStatus === "throttled"
                      ? "border-amber-400/20 bg-amber-500/10"
                      : "border-[#68ff7a]/20 bg-[#68ff7a]/[0.06]"
                  }`}
                >
                  <div
                    className={`mb-2 flex items-center gap-2 ${
                      resultStatus === "throttled" ? "text-amber-100" : "text-[#68ff7a]"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">
                      {resultStatus === "throttled" ? "Protected perimeter active" : "Fortress response verified"}
                    </span>
                  </div>
                  {typeof result.public_demo_note === "string" ? (
                    <p className="mb-3 text-[12px] leading-5 text-[#dfffe4]">{result.public_demo_note}</p>
                  ) : null}
                  <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[#dcefe0]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ) : null}

              {result && typeof result.screening === "object" && result.screening !== null ? (
                <div className="mt-4 rounded-[14px] border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.05)] p-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                    Protected by anti-sybil + Alibaba fingerprinting
                  </div>
                  <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[#dce7ef]">
                    {JSON.stringify(result.screening, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-[14px] border border-white/[0.06] bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#8ea1af]">cURL</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(curlSnippet)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#9ff7f0]"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] leading-5 text-[#cdd7e0]">{curlSnippet}</pre>
            </div>

            <button
              type="button"
              onClick={resetState}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-[#cfe7e3] transition hover:border-[#22ddd0]/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset playground
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
