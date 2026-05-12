"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Copy, Layers3, ShieldCheck } from "lucide-react";

import { API_MARKETPLACE_PRODUCTS } from "@/lib/military-grade-api-marketplace";

function categoryLabel(category: string, layerId?: string) {
  if (category === "full-stack") return "Full 10-layer";
  if (category === "security-module") return "Mainnet module";
  if (category === "partner-sdk") return "Partner SDK";
  return `Layer ${layerId}`;
}

const veilSolverPath = [
  "Isolated secure execution",
  "Partner solver response",
  "ZK proof envelope",
  "0G response anchor",
];

export default function DeveloperApiStore() {
  return (
    <section id="api-store" className="fade-in-up fade-in-up-4 scroll-mt-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,201,177,0.22)] bg-[rgba(0,201,177,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
            <Layers3 className="h-3.5 w-3.5" />
            Modular Immunity Armory
          </div>
          <h2 className="mt-3 text-[30px] font-extrabold tracking-tight text-white md:text-[38px]">
            API products for every verification path.
          </h2>
          <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#c8dae6]">
            A developer store with the full TITAN X PROTOCOL stack, a dedicated anti-sybil mainnet module, an AWS Nitro fortress SDK, single-layer verification APIs, and secure proxy products ready for playground testing and API-key integration.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] px-4 py-3 text-[13px] font-bold text-[#dfffe4]">
          {API_MARKETPLACE_PRODUCTS.length} endpoints
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {API_MARKETPLACE_PRODUCTS.map((product) => (
          <article
            key={product.id}
            className="glow-card flex min-h-[338px] flex-col p-5"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-[52px] w-[52px] flex-none overflow-hidden rounded-xl border border-[rgba(255,255,255,0.10)] bg-black">
                <Image
                  src={product.logoPath}
                  alt={`${product.name} logo`}
                  fill
                  sizes="52px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#72f3c7]">
                  {categoryLabel(product.category, product.layerId)}
                </div>
                <h3 className="mt-1 text-[17px] font-bold leading-tight text-white">
                  {product.name}
                </h3>
                <p className="mt-1 text-[12px] text-[#96b0c2]">{product.partner}</p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-6 text-[#c8dae6]">
              {product.description}
            </p>

            <div className="mt-4 rounded-xl border border-[rgba(0,201,177,0.12)] bg-black/20 p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">
                Endpoint
              </div>
              <div className="mt-2 break-all font-mono text-[11px] leading-5 text-[#dce7ef]">
                {product.endpoint}
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {product.category === "partner-sdk" ? (
                veilSolverPath.map((step, index) => (
                  <div key={step} className="flex items-start gap-2 text-[11px] leading-5 text-[#b7c7d2]">
                    <span className="rounded-full border border-[#72f3c7]/20 bg-[#72f3c7]/10 px-2 py-0.5 font-bold text-[#9ff7f0]">
                      ZK{index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))
              ) : (
                product.layers
                  .slice(0, product.category === "single-layer" ? 1 : product.category === "security-module" ? 4 : product.layers.length)
                  .map((layer) => (
                  <div key={layer.id} className="flex items-start gap-2 text-[11px] leading-5 text-[#b7c7d2]">
                    <span className="rounded-full border border-[#72f3c7]/20 bg-[#72f3c7]/10 px-2 py-0.5 font-bold text-[#9ff7f0]">
                      {product.category === "security-module" ? layer.id : `L${layer.id}`}
                    </span>
                    <span>{layer.label}</span>
                  </div>
                  ))
              )}
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#96b0c2]">
                  Included in packages
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                {product.plans.map((plan) => (
                  <span
                    key={plan.id}
                    className="rounded-full border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] px-3 py-1.5 text-[11px] font-bold text-[#9ff7f0]"
                  >
                    {plan.name}
                  </span>
                ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.playgroundPath ? (
                  <Link
                    href={product.playgroundPath}
                    className="yb-teal-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-950"
                  >
                    Playground <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
                {product.docsPath ? (
                  <Link
                    href={product.docsPath}
                    className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.04)] px-3 py-2 text-[12px] font-bold text-[#9ff7f0] transition hover:border-[rgba(0,201,177,0.35)]"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Docs
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(product.endpoint)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.04)] px-3 py-2 text-[12px] font-bold text-[#9ff7f0] transition hover:border-[rgba(0,201,177,0.35)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy endpoint
                </button>
                {product.category === "full-stack" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#68ff7a]/20 bg-[#68ff7a]/10 px-3 py-2 text-[12px] font-bold text-[#dfffe4]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    All layers
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
