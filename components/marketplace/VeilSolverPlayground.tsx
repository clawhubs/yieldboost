"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { getApiMarketplaceProduct } from "@/lib/military-grade-api-marketplace";

const product = getApiMarketplaceProduct("veilsolver");

const defaultPayload = {
  action: "SWAP",
  chainId: 16602,
  tokenIn: "0x0000000000000000000000000000000000000000",
  tokenOut: "0x0000000000000000000000000000000000000000",
  amountIn: "1.0",
  decimalsIn: 18,
  maxSlippageBps: 50,
  userAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
};

export default function VeilSolverPlayground() {
  const [apiKey, setApiKey] = useState("yb_free_tier_local");
  const [payloadText, setPayloadText] = useState(JSON.stringify(defaultPayload, null, 2));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const layerCount = product?.layers.length ?? 9;
  const curlSnippet = useMemo(() => {
    const endpoint = product?.endpoint ?? "/api/dev/store/veilsolver";
    return `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${apiKey || "yb_free_tier_local"}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadText.replace(/\n/g, "")}'`;
  }, [apiKey, payloadText]);

  async function runPlayground() {
    setLoading(true);
    setError(null);
      setResult(null);

    try {
      const endpoint = product?.endpoint ?? "/api/dev/store/veilsolver";
      const payload = JSON.parse(payloadText) as Record<string, unknown>;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
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

  if (!product) return null;

  return (
    <main className="min-h-screen bg-[#04080d] p-4 text-white md:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[rgba(34,221,208,0.18)] bg-[radial-gradient(circle_at_12%_8%,rgba(34,221,208,0.18),transparent_26%),linear-gradient(135deg,#071018_0%,#05070c_58%,#090816_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:p-7">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-[18px] border border-[rgba(151,109,255,0.34)] bg-black">
                <Image src={product.logoPath} alt="VeilSolver logo" fill className="object-cover" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#9ff7f0]">YieldBoost API Store</div>
                <h1 className="mt-1 text-[34px] font-semibold leading-tight">{product.name}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#b8c7d4]">{product.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {product.plans.map((plan) => (
                <div key={plan.id} className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-white/[0.035] p-4">
                  <div className="text-[13px] font-semibold">{plan.name}</div>
                  <div className="mt-2 flex items-center gap-2 text-[22px] font-semibold text-[#68ff7a]">
                    <Image src="/ya-icon.png" alt="YA" width={22} height={22} />
                    {plan.priceYa} YA
                  </div>
                  <div className="mt-1 text-[12px] text-[#9fb0be]">{plan.quota}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[18px] border border-[rgba(34,221,208,0.14)] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[#9ff7f0]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{layerCount}-Layer Verified Pipeline</span>
              </div>
              <div className="mt-3 grid gap-2">
                {product.layers.map((layer) => (
                  <div key={layer.id} className="flex items-start gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                    <span className="mt-0.5 rounded-full border border-[#22ddd0]/25 bg-[#22ddd0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9ff7f0]">
                      L{layer.id}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold">{layer.label}</div>
                      <div className="text-[12px] leading-5 text-[#aebcca]">{layer.proof}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#071017] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#22ddd0]">Playground endpoint</div>
                <div className="mt-1 font-mono text-[13px] text-[#dce7ef]">{product.endpoint}</div>
              </div>
              <a href={product.endpoint} className="inline-flex items-center gap-2 rounded-full border border-[#22ddd0]/20 px-3 py-2 text-[12px] text-[#9ff7f0]">
                Wrapper endpoint <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-[#dce7ef]">API key</span>
              <input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="mt-2 w-full rounded-[12px] border border-white/[0.08] bg-black/30 px-3 py-3 font-mono text-[13px] outline-none focus:border-[#22ddd0]/50"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-[#dce7ef]">Payload</span>
              <textarea
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                rows={9}
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
              Run secure proxy
            </button>

            <div className="mt-4 rounded-[14px] border border-white/[0.06] bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#8ea1af]">SDK / cURL</span>
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
                  <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">9-layer response verified</span>
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
