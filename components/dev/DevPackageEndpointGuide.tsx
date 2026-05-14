"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Lock, ServerCog } from "lucide-react";

import { YA_API_PLANS, type YaApiPlan } from "@/lib/ya-api-plans";

type EndpointGuideItem = {
  id: string;
  method: "GET" | "POST";
  path: string;
  summary: string;
  area: "Core REST API" | "Advanced Modules";
  minPlanId: YaApiPlan["id"];
};

const PLAN_ORDER: YaApiPlan["id"][] = ["free", "builder", "pro", "protocol"];

const ENDPOINT_GUIDE_ITEMS: EndpointGuideItem[] = [
  {
    id: "health",
    method: "GET",
    path: "/v1/health",
    summary: "Check infra readiness, active network, and live platform health.",
    area: "Core REST API",
    minPlanId: "free",
  },
  {
    id: "status-layers",
    method: "GET",
    path: "/v1/status/layers",
    summary: "Read the live status of each security layer.",
    area: "Core REST API",
    minPlanId: "free",
  },
  {
    id: "blacklist-check",
    method: "POST",
    path: "/v1/blacklist/check",
    summary: "Screen payloads with the Hallucination Blacklist before deeper processing.",
    area: "Core REST API",
    minPlanId: "free",
  },
  {
    id: "audit-evaluate",
    method: "POST",
    path: "/v1/audit/evaluate",
    summary: "Run deterministic integrity checks without using full secure compute.",
    area: "Core REST API",
    minPlanId: "free",
  },
  {
    id: "proof-run",
    method: "POST",
    path: "/v1/proof/run",
    summary: "Generate or verify proof envelopes for arbitrary commitments.",
    area: "Core REST API",
    minPlanId: "free",
  },
  {
    id: "governance-evaluate",
    method: "POST",
    path: "/v1/governance/evaluate",
    summary: "Apply programmable governance and policy decisions to a request.",
    area: "Core REST API",
    minPlanId: "builder",
  },
  {
    id: "handshake-log",
    method: "POST",
    path: "/v1/handshake/log",
    summary: "Write audit-grade coordination logs between agents and services.",
    area: "Core REST API",
    minPlanId: "builder",
  },
  {
    id: "integrity-metadata",
    method: "GET",
    path: "/v1/integrity/{storage_id}/metadata",
    summary: "Read sanitized integrity metadata for one stored record.",
    area: "Core REST API",
    minPlanId: "builder",
  },
  {
    id: "integrity-records",
    method: "GET",
    path: "/v1/integrity/records?wallet_address=0x...&network=mainnet",
    summary: "List integrity records for one wallet without revealing sealed payload data.",
    area: "Core REST API",
    minPlanId: "builder",
  },
  {
    id: "anti-sybil-module",
    method: "POST",
    path: "/api/dev/store/anti-sybil-zk-fingerprint",
    summary: "Use wallet screening, anti-sybil throttling, and Alibaba fingerprinting as a packaged module.",
    area: "Advanced Modules",
    minPlanId: "builder",
  },
  {
    id: "integrity-seal",
    method: "POST",
    path: "/v1/integrity/seal",
    summary: "Seal plaintext or files through the full integrity pipeline.",
    area: "Core REST API",
    minPlanId: "protocol",
  },
  {
    id: "integrity-unseal",
    method: "POST",
    path: "/v1/integrity/unseal",
    summary: "Open sealed records with the owning wallet authorization path.",
    area: "Core REST API",
    minPlanId: "protocol",
  },
  {
    id: "integrity-delete",
    method: "POST",
    path: "/v1/integrity/delete",
    summary: "Delete vault records through the signed owner deletion path.",
    area: "Core REST API",
    minPlanId: "protocol",
  },
  {
    id: "military-grade-full",
    method: "POST",
    path: "/api/dev/store/military-grade",
    summary: "Run the full 10-layer TITAN X API in one request.",
    area: "Advanced Modules",
    minPlanId: "protocol",
  },
  {
    id: "aws-nitro-fortress",
    method: "POST",
    path: "/api/dev/store/aws-nitro-fortress",
    summary: "Access AWS Nitro Fortress with secure runtime, incident journal, and enclave continuity.",
    area: "Advanced Modules",
    minPlanId: "protocol",
  },
  {
    id: "veilsolver",
    method: "POST",
    path: "/api/dev/store/veilsolver",
    summary: "Call the wrapped VeilSolver secure proxy through YieldBoost protections.",
    area: "Advanced Modules",
    minPlanId: "protocol",
  },
];

function planIncludesEndpoint(
  selectedPlanId: YaApiPlan["id"],
  endpoint: EndpointGuideItem,
) {
  return (
    PLAN_ORDER.indexOf(selectedPlanId) >= PLAN_ORDER.indexOf(endpoint.minPlanId)
  );
}

function methodClass(method: EndpointGuideItem["method"]) {
  return method === "GET"
    ? "border-[rgba(114,243,199,0.2)] bg-[rgba(114,243,199,0.08)] text-[#9ff7f0]"
    : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-white";
}

export default function DevPackageEndpointGuide({
  initialPlanId = "builder",
  selectedPlanId: controlledSelectedPlanId,
  onSelectedPlanChange,
  onActivatePackage,
}: {
  initialPlanId?: YaApiPlan["id"];
  selectedPlanId?: YaApiPlan["id"];
  onSelectedPlanChange?: (planId: YaApiPlan["id"]) => void;
  onActivatePackage?: () => void;
}) {
  const [uncontrolledSelectedPlanId, setUncontrolledSelectedPlanId] =
    useState<YaApiPlan["id"]>(initialPlanId);
  const selectedPlanId = controlledSelectedPlanId ?? uncontrolledSelectedPlanId;
  const selectedPlan =
    YA_API_PLANS.find((plan) => plan.id === selectedPlanId) ?? YA_API_PLANS[0];

  function handleSelectPlan(planId: YaApiPlan["id"]) {
    if (controlledSelectedPlanId === undefined) {
      setUncontrolledSelectedPlanId(planId);
    }
    onSelectedPlanChange?.(planId);
  }

  const grouped = useMemo(() => {
    const areas: EndpointGuideItem["area"][] = ["Core REST API", "Advanced Modules"];
    return areas.map((area) => ({
      area,
      items: ENDPOINT_GUIDE_ITEMS.filter((item) => item.area === area),
    }));
  }, []);

  const includedCount = ENDPOINT_GUIDE_ITEMS.filter((item) =>
    planIncludesEndpoint(selectedPlan.id, item),
  ).length;

  return (
    <section className="fade-in-up fade-in-up-3 yb-card rounded-2xl p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c0d4e2]">
            Package Endpoint Access
          </p>
          <h2 className="mt-2 text-[22px] font-semibold text-white">
            Endpoint access should be obvious before the key is created.
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">
            Pick a package here and the dashboard shows exactly which API endpoints are included.
            The user should not need to search docs or another menu just to know what the web app can call.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.06)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#72f3c7]">
            Selected package
          </p>
          <p className="mt-1 text-[15px] font-semibold text-white">{selectedPlan.name}</p>
          <p className="mt-1 text-[12px] leading-5 text-[#c8dae6]">
            {includedCount} visible endpoint{includedCount !== 1 ? "s" : ""} included
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {YA_API_PLANS.map((plan) => {
          const active = plan.id === selectedPlan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleSelectPlan(plan.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-[rgba(0,201,177,0.42)] bg-[rgba(0,201,177,0.08)]"
                  : "border-white/8 bg-[rgba(255,255,255,0.03)] hover:border-white/16"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-semibold text-white">{plan.name}</p>
                <span className="rounded-full border border-[rgba(114,243,199,0.2)] px-2 py-0.5 text-[11px] font-semibold text-[#72f3c7]">
                  {plan.priceLabel}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#d0e0ec]">
                {plan.apiKeys} key{plan.apiKeys > 1 ? "s" : ""} · {plan.quotaLabel}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[13px] leading-6 text-[#d0e0ec]">
            Base URL for production calls: <span className="font-mono text-white">https://api.yieldboostai.xyz</span>
          </p>
          <button
            type="button"
            onClick={() => {
              if (onActivatePackage) {
                onActivatePackage();
                return;
              }
              if (typeof window !== "undefined") {
                window.location.hash = "checkout";
              }
            }}
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#9ff7f0] transition hover:text-white"
          >
            Activate this package below
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {grouped.map((group) => (
          <div key={group.area}>
            <div className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
              <ServerCog className="h-4 w-4" />
              {group.area}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {group.items.map((item) => {
                const included = planIncludesEndpoint(selectedPlan.id, item);
                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border px-4 py-4 ${
                      included
                        ? "border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.05)]"
                        : "border-white/8 bg-[rgba(255,255,255,0.02)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${methodClass(
                          item.method,
                        )}`}
                      >
                        {item.method}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                          included
                            ? "border-[rgba(114,243,199,0.2)] bg-[rgba(114,243,199,0.08)] text-[#84f5b0]"
                            : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#b6c6d2]"
                        }`}
                      >
                        {included ? "Included" : `Upgrade to ${item.minPlanId}`}
                      </span>
                    </div>
                    <p className="mt-3 break-all font-mono text-[12px] text-white">{item.path}</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">{item.summary}</p>
                    {!included ? (
                      <div className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#b6c6d2]">
                        <Lock className="h-3.5 w-3.5" />
                        Locked for {selectedPlan.name}. Available starting from {item.minPlanId}.
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
