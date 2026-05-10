import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Code2, KeyRound, ServerCog, ShieldCheck } from "lucide-react";

import type { ApiMarketplaceProduct } from "@/lib/military-grade-api-marketplace";

function productPayload(product: ApiMarketplaceProduct) {
  if (product.id === "anti-sybil-zk-fingerprint") {
    return `{
  "requestId": "anti-sybil-demo-001",
  "walletAddress": "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
  "network": "mainnet",
  "intent": "screen a wallet before issuing a high-value API key",
  "sessionId": "sess_live_01",
  "deviceLabel": "chrome-macbook-pro"
}`;
  }

  if (product.id === "veilsolver") {
    return `{
  "action": "SWAP",
  "chainId": 16602,
  "tokenIn": "0x0000000000000000000000000000000000000000",
  "tokenOut": "0x0000000000000000000000000000000000000000",
  "amountIn": "1.0",
  "decimalsIn": 18,
  "maxSlippageBps": 50,
  "userAddress": "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D"
}`;
  }

  if (product.category === "single-layer") {
    return `{
  "payload": {
    "requestId": "dev-layer-001",
    "service": "partner-web-app",
    "input": {
      "strategy": "low-risk 0G route",
      "amount": "1.0"
    }
  }
}`;
  }

  return `{
  "payload": {
    "requestId": "dev-full-001",
    "service": "partner-web-app",
    "intent": "verify optimizer output",
    "input": {
      "strategy": "low-risk 0G route",
      "amount": "1.0"
    }
  }
}`;
}

function responseShape(product: ApiMarketplaceProduct) {
  if (product.id === "anti-sybil-zk-fingerprint") {
    return `{
  "status": "success",
  "security": "Anti-Sybil + ZK Verified",
  "network": "mainnet",
  "anti_sybil": {
    "wallet_bound": true,
    "alibaba_behavior_fingerprint": "checked",
    "risk_level": "low",
    "review_status": "verified"
  },
  "data": {
    "accepted": true
  },
  "zk_proof": "0x...",
  "zk_envelope": {
    "proof_type": "anti-sybil-mainnet-envelope"
  },
  "0g_storage_url": "0g://..."
}`;
  }

  if (product.id === "veilsolver") {
    return `{
  "status": "success",
  "security": "Isolated ZK Verified",
  "data": { "...": "partner solver result" },
  "zk_proof": "0x...",
  "zk_envelope": {
    "status": "verified-digest"
  },
  "0g_storage_url": "0g://..."
}`;
  }

  return `{
  "status": "success",
  "security": "${product.category === "full-stack" ? "9-Layer Verified" : "Single Layer Verified"}",
  "data": {
    "accepted": true,
    "payload": { "...": "your request" }
  },
  "zk_proof": "0x...",
  "0g_storage_url": "0g://..."
}`;
}

function nextRouteSnippet(product: ApiMarketplaceProduct) {
  return `// app/api/yieldboost/${product.id}/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  const response = await fetch(
    "https://dev.yieldboostai.xyz${product.endpoint}",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${process.env.YIELDBOOST_API_KEY}\`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}`;
}

function browserSnippet(product: ApiMarketplaceProduct) {
  return `// Browser code in your web app
const response = await fetch("/api/yieldboost/${product.id}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${productPayload(product).replace(/\n/g, "\n  ")}),
});

const verified = await response.json();`;
}

function nodeSnippet(product: ApiMarketplaceProduct) {
  return `const response = await fetch("https://dev.yieldboostai.xyz${product.endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.YIELDBOOST_API_KEY}\`,
  },
  body: JSON.stringify(${productPayload(product).replace(/\n/g, "\n  ")}),
});

const verified = await response.json();`;
}

function curlSnippet(product: ApiMarketplaceProduct) {
  return `curl -X POST https://dev.yieldboostai.xyz${product.endpoint} \\
  -H "Authorization: Bearer $YIELDBOOST_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${productPayload(product).replace(/\n/g, "")}'`;
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-black/25 p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
        <Code2 className="h-3.5 w-3.5" />
        {label}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap text-[12px] leading-6 text-[#dce7ef]">
        {code}
      </pre>
    </div>
  );
}

export default function DeveloperApiProductDocs({
  product,
}: {
  product: ApiMarketplaceProduct;
}) {
  return (
    <main className="min-h-screen bg-[#04080d] p-4 text-white md:p-8">
      <section className="mx-auto max-w-7xl rounded-[28px] border border-[rgba(34,221,208,0.18)] bg-[linear-gradient(135deg,#071018_0%,#05070c_58%,#07120f_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dev/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-[#cfe7e3] transition hover:border-[#22ddd0]/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Modular Immunity Armory
          </Link>
          <Link
            href={product.playgroundPath ?? "/dev/marketplace"}
            className="yb-teal-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-950"
          >
            Open playground
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <aside>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-[18px] border border-[rgba(34,221,208,0.28)] bg-black">
                <Image src={product.logoPath} alt={`${product.name} logo`} fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9ff7f0]">
                  <BookOpen className="h-3.5 w-3.5" />
                  Integration docs
                </div>
                <h1 className="mt-1 text-[30px] font-bold leading-tight text-white">{product.name}</h1>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-7 text-[#b8c7d4]">{product.description}</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-[16px] border border-[rgba(34,221,208,0.14)] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                  <KeyRound className="h-4 w-4" />
                  Auth
                </div>
                <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">
                  Pass your YieldBoost API key as a bearer token. Keep this key on your server or edge route; do not ship a secret key directly in browser code.
                </p>
              </div>

              <div className="rounded-[16px] border border-[rgba(34,221,208,0.14)] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                  <ServerCog className="h-4 w-4" />
                  Endpoint
                </div>
                <p className="mt-2 break-all font-mono text-[12px] leading-6 text-[#dce7ef]">
                  {product.endpoint}
                </p>
              </div>

              <div className="rounded-[16px] border border-[rgba(104,255,122,0.18)] bg-[#68ff7a]/[0.06] p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#dfffe4]">
                  <ShieldCheck className="h-4 w-4" />
                  Output
                </div>
                <p className="mt-2 text-[13px] leading-6 text-[#dfffe4]">
                  Every successful response includes a verification status, a `zk_proof`, and an audit URL or anchor reference for your app logs.
                </p>
              </div>

              <div className="rounded-[16px] border border-[rgba(34,221,208,0.14)] bg-black/20 p-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                  Packages
                </div>
                <div className="mt-3 grid gap-2">
                  {product.plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                      <span className="text-[12px] font-semibold text-white">{plan.name}</span>
                      <span className="text-right text-[12px] text-[#9ff7f0]">
                        {plan.listPrice0g ? <span className="mr-2 line-through text-[#96b0c2]">{plan.listPrice0g} 0G</span> : null}
                        {plan.checkoutPrice0g} 0G
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="grid gap-4">
            <CodeBlock label="Server route for your website" code={nextRouteSnippet(product)} />
            <CodeBlock label="Browser calls your own backend" code={browserSnippet(product)} />
            <CodeBlock label="Node or edge runtime" code={nodeSnippet(product)} />
            <CodeBlock label="cURL smoke test" code={curlSnippet(product)} />
            <CodeBlock label="Response shape" code={responseShape(product)} />
          </div>
        </div>
      </section>
    </main>
  );
}
