"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

import type { ApiMarketplaceProduct } from "@/lib/military-grade-api-marketplace";

const veilSolverPath = [
  {
    id: "ZK1",
    label: "Isolated secure execution",
    proof: "Developer payload is processed away from the public app surface.",
  },
  {
    id: "ZK2",
    label: "Partner solver response",
    proof: "YieldBoost forwards the request to VeilSolver and receives the private intent result.",
  },
  {
    id: "ZK3",
    label: "ZK proof envelope",
    proof: "Request and response digests are sealed into a verification envelope.",
  },
  {
    id: "ZK4",
    label: "0G response anchor",
    proof: "The verified response gets an anchor reference for developer audit trails.",
  },
];

function buildDefaultPayload(product: ApiMarketplaceProduct) {
  if (product.id === "anti-sybil-zk-fingerprint") {
    return {
      requestId: "anti-sybil-demo-001",
      walletAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
      network: "mainnet",
      intent: "screen a wallet before issuing a high-value API key",
      sessionId: "sess_live_01",
      deviceLabel: "chrome-macbook-pro",
    };
  }

  if (product.id === "veilsolver") {
    return {
      action: "SWAP",
      chainId: 16661,
      tokenIn: "0x0000000000000000000000000000000000000000",
      tokenOut: "0x0000000000000000000000000000000000000000",
      amountIn: "1.0",
      decimalsIn: 18,
      maxSlippageBps: 50,
      userAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
    };
  }

  if (product.category === "single-layer") {
    return {
      payload: {
        layer: product.id,
        requestId: "dev-demo-layer-001",
        decision: "validate this single YieldBoost security layer",
        input: {
          strategy: "low-risk 0G route",
          amount: "1.0",
        },
        network: "mainnet",
      },
    };
  }

  return {
    payload: {
      requestId: "dev-demo-full-001",
      intent: "verify a proof-backed optimizer decision",
      input: {
        strategy: "low-risk 0G yield route",
        amount: "1.0",
      },
      network: "mainnet",
    },
  };
}

export default function DeveloperApiPlayground({
  product,
}: {
  product: ApiMarketplaceProduct;
}) {
  const isAntiSybilDemo = product.id === "anti-sybil-zk-fingerprint";
  const [visitorId, setVisitorId] = useState("anti-sybil-demo-visitor");
  const [apiKey, setApiKey] = useState("yb_free_tier_local");
  const [payloadText, setPayloadText] = useState(JSON.stringify(buildDefaultPayload(product), null, 2));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endpoint = isAntiSybilDemo
    ? "/api/dev/store/anti-sybil-zk-fingerprint/demo"
    : product.endpoint;

  useEffect(() => {
    if (!isAntiSybilDemo || typeof window === "undefined") return;
    const existing = window.localStorage.getItem("yieldboost:anti-sybil-demo-visitor");
    if (existing) {
      setVisitorId(existing);
      return;
    }
    const nextValue = `anti-sybil-${crypto.randomUUID()}`;
    window.localStorage.setItem("yieldboost:anti-sybil-demo-visitor", nextValue);
    setVisitorId(nextValue);
  }, [isAntiSybilDemo]);

  const curlSnippet = useMemo(() => {
    const headers = isAntiSybilDemo
      ? [`-H "Content-Type: application/json"`]
      : [
          `-H "Authorization: Bearer ${apiKey || "yb_free_tier_local"}"`,
          `-H "Content-Type: application/json"`,
        ];
    const payload = isAntiSybilDemo
      ? payloadText.replace(/\}$/, `,\n  "sessionId":"${visitorId}"\n}`).replace(/\n/g, "")
      : payloadText.replace(/\n/g, "");

    return `curl -X POST ${endpoint} \\
  ${headers.join(" \\\n  ")} \\
  -d '${payload}'`;
  }, [apiKey, endpoint, isAntiSybilDemo, payloadText, visitorId]);

  async function runPlayground() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = JSON.parse(payloadText) as Record<string, unknown>;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAntiSybilDemo ? {} : { Authorization: `Bearer ${apiKey}` }),
        },
        body: JSON.stringify(
          isAntiSybilDemo
            ? {
                ...payload,
                sessionId: typeof payload.sessionId === "string" ? payload.sessionId : visitorId,
              }
            : payload,
        ),
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `Request failed with ${response.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playground request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#04080d] p-4 text-white md:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[rgba(34,221,208,0.18)] bg-[radial-gradient(circle_at_12%_8%,rgba(34,221,208,0.16),transparent_26%),linear-gradient(135deg,#071018_0%,#05070c_58%,#07120f_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dev/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-[#cfe7e3] transition hover:border-[#22ddd0]/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Modular Immunity Armory
          </Link>
          <div className="rounded-xl border border-[#68ff7a]/20 bg-[#68ff7a]/10 px-3 py-2 text-[12px] font-bold text-[#dfffe4]">
            {product.category === "single-layer"
              ? `Layer ${product.layerId}`
              : product.category === "partner-sdk"
                ? "Partner SDK"
                : product.category === "full-stack"
                  ? "Full 10-layer"
                  : "Mainnet module"}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-[18px] border border-[rgba(34,221,208,0.28)] bg-black">
                <Image src={product.logoPath} alt={`${product.name} logo`} fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9ff7f0]">
                  YieldBoost API Playground
                </div>
                <h1 className="mt-1 text-[32px] font-bold leading-tight text-white">{product.name}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#b8c7d4]">{product.description}</p>

            <div className="mt-5 rounded-[18px] border border-[rgba(34,221,208,0.14)] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[#9ff7f0]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {product.id === "veilsolver"
                    ? "ZK Secure Proxy Path"
                    : product.id === "anti-sybil-zk-fingerprint"
                      ? "Anti-Sybil Verification Path"
                      : product.category === "full-stack"
                        ? "10-Layer TITAN X"
                        : `${product.layers.length}-Layer Coverage`}
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {(product.id === "veilsolver" ? veilSolverPath : product.layers).map((layer) => (
                  <div key={layer.id} className="flex items-start gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                    <span className="mt-0.5 rounded-full border border-[#22ddd0]/25 bg-[#22ddd0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9ff7f0]">
                      {product.id === "veilsolver" || product.id === "anti-sybil-zk-fingerprint"
                        ? layer.id
                        : `L${layer.id}`}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{layer.label}</div>
                      <div className="text-[12px] leading-5 text-[#aebcca]">{layer.proof}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {product.category === "full-stack" ? (
              <div className="mt-4 rounded-[18px] border border-[rgba(34,221,208,0.14)] bg-black/20 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                  TITAN X
                </div>
                <p className="mt-2 text-[12px] leading-6 text-[#c8dae6]">
                  Full-stack calls return the complete 10-layer proof family, ending with the Layer 10 AWS Nitro Enclaves continuity witness.
                </p>
              </div>
            ) : null}

            {product.id === "veilsolver" ? (
              <a
                href={product.endpoint}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#22ddd0]/20 px-3 py-2 text-[12px] font-semibold text-[#9ff7f0]"
              >
                YieldBoost wrapper endpoint <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#071017] p-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#22ddd0]">Playground endpoint</div>
              <div className="mt-1 break-all font-mono text-[13px] text-[#dce7ef]">{endpoint}</div>
            </div>

            {isAntiSybilDemo ? (
              <div className="mt-4 rounded-[14px] border border-[rgba(34,221,208,0.16)] bg-[rgba(34,221,208,0.05)] p-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                  Live public demo lane
                </div>
                <p className="mt-2 text-[12px] leading-6 text-[#d7e7ef]">
                  This playground intentionally blocks repeated success from the same IP or wallet inside a rolling 24h window, so the anti-sybil demo cannot be gamed from another phone on the same network.
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#96b0c2]">
                  Visitor lane: <span className="font-mono text-[#dce7ef]">{visitorId}</span>
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#96b0c2]">
                  Paid SDK endpoint stays at <span className="font-mono text-[#dce7ef]">{product.endpoint}</span>.
                </p>
              </div>
            ) : (
              <label className="mt-4 block">
                <span className="text-[12px] font-semibold text-[#dce7ef]">API key</span>
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  className="mt-2 w-full rounded-[12px] border border-white/[0.08] bg-black/30 px-3 py-3 font-mono text-[13px] outline-none focus:border-[#22ddd0]/50"
                />
              </label>
            )}

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-[#dce7ef]">Payload</span>
              <textarea
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                rows={10}
                className="mt-2 w-full rounded-[12px] border border-white/[0.08] bg-black/30 px-3 py-3 font-mono text-[13px] leading-6 outline-none focus:border-[#22ddd0]/50"
              />
            </label>

            <button
              type="button"
              onClick={runPlayground}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#22ddd0] px-4 py-3 text-[14px] font-semibold text-[#061014] transition hover:brightness-110 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Run endpoint
            </button>

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

            {error ? (
              <div className="mt-4 rounded-[14px] border border-red-400/20 bg-red-500/10 p-3 text-[13px] text-red-100">{error}</div>
            ) : null}

            {result ? (
              <div className="mt-4 rounded-[14px] border border-[#68ff7a]/20 bg-[#68ff7a]/[0.06] p-3">
                <div className="mb-2 flex items-center gap-2 text-[#68ff7a]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">Verified response ready</span>
                </div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-[#dcefe0]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
