import "server-only";

const DEFAULT_API_BASE_URL = "https://api.yieldboostai.xyz";

export interface MarketplaceAuthResult {
  ok: boolean;
  plan: "none" | "free" | "builder" | "pro" | "protocol" | "internal" | "invalid";
  keyPreview: string | null;
  error: string | null;
  scopes?: string[];
  environment?: string | null;
}

function getRequestApiKey(headers: Headers) {
  return (
    headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ??
    headers.get("x-yieldboost-api-key") ??
    ""
  ).trim();
}

function compactPreview(apiKey: string) {
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
}

function getApiBaseUrl() {
  return (
    process.env.INTEGRITY_DEV_PORTAL_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_INTEGRITY_API_BASE_URL?.trim() ||
    DEFAULT_API_BASE_URL
  );
}

async function introspectManagedKey(apiKey: string) {
  const masterKey =
    process.env.INTEGRITY_DEV_PORTAL_MASTER_KEY?.trim() ||
    process.env.INTEGRITY_MASTER_KEY?.trim();
  if (!masterKey) {
    return null;
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/admin/api-keys/introspect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": masterKey,
    },
    body: JSON.stringify({ api_key: apiKey }),
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as {
    item?: {
      plan_id?: string | null;
      scopes?: string[];
      environment?: string | null;
    };
  };
}

export async function validateMarketplaceApiKey(headers: Headers): Promise<MarketplaceAuthResult> {
  const apiKey = getRequestApiKey(headers);
  const freeTierKey = process.env.YB_MARKETPLACE_FREE_TIER_KEY ?? "yb_free_tier_local";
  const extraKeys = (process.env.YB_MARKETPLACE_API_KEYS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!apiKey) {
    return { ok: false, plan: "none", keyPreview: null, error: "Missing YieldBoost API key." };
  }

  if (apiKey === freeTierKey) {
    return {
      ok: true,
      plan: "free",
      keyPreview: compactPreview(apiKey),
      error: null,
      scopes: ["status:read", "blacklist:check", "audit:run", "proof:run"],
      environment: "mainnet",
    };
  }

  if (extraKeys.includes(apiKey)) {
    return {
      ok: true,
      plan: "internal",
      keyPreview: compactPreview(apiKey),
      error: null,
      scopes: ["*"],
      environment: "multi",
    };
  }

  if (!apiKey.startsWith("yb_live_")) {
    return {
      ok: false,
      plan: "invalid",
      keyPreview: `${apiKey.slice(0, 6)}...`,
      error: "Invalid YieldBoost API key.",
    };
  }

  const introspected = await introspectManagedKey(apiKey);
  const planId = introspected?.item?.plan_id?.trim() || "";
  if (!planId) {
    return {
      ok: false,
      plan: "invalid",
      keyPreview: compactPreview(apiKey),
      error: "Managed API key is not active for the marketplace.",
    };
  }

  return {
    ok: true,
    plan: ["free", "builder", "pro", "protocol"].includes(planId)
      ? (planId as MarketplaceAuthResult["plan"])
      : "invalid",
    keyPreview: compactPreview(apiKey),
    error: null,
    scopes: Array.isArray(introspected?.item?.scopes) ? introspected?.item?.scopes : [],
    environment: introspected?.item?.environment ?? "mainnet",
  };
}

export function ensureMarketplacePlanAccess(
  auth: MarketplaceAuthResult,
  productId: string,
) {
  if (!auth.ok) {
    return {
      ok: false,
      statusCode: 401,
      body: {
        status: "error",
        error: auth.error || "Missing YieldBoost API key.",
        subscribe_url: "/dev",
      },
    };
  }

  if (auth.plan === "internal" || auth.scopes?.includes("*")) {
    return { ok: true };
  }

  const deterministicOnly = new Set([
    "hallucination-blacklist",
    "integrity-auditor",
    "sovereign-memory",
    "zero-g-storage-proof-layer",
    "zero-knowledge-proof-layer",
    "proofregistry-anchor",
    "programmable-governance",
    "cross-agent-neural-handshake",
  ]);

  const builderExtended = new Set(["anti-sybil-zk-fingerprint"]);
  const fullOnly = new Set([
    "military-grade-full",
    "secure-compute-tee",
    "veilsolver",
    "aws-nitro-fortress",
  ]);

  const allowed =
    auth.plan === "protocol"
      ? true
      : auth.plan === "builder"
        ? deterministicOnly.has(productId) || builderExtended.has(productId)
        : auth.plan === "pro"
          ? deterministicOnly.has(productId) || builderExtended.has(productId)
          : auth.plan === "free"
            ? deterministicOnly.has(productId)
            : false;

  if (!allowed || fullOnly.has(productId) && auth.plan !== "protocol") {
    return {
      ok: false,
      statusCode: 403,
      body: {
        status: "error",
        error:
          auth.plan === "protocol"
            ? "Marketplace access denied."
            : auth.plan === "builder"
              ? "This package does not include full 9-layer compute, TEE, or partner SDK access."
              : auth.plan === "pro"
                ? "This package includes Alibaba fingerprinting and verification modules, but it does not include TEE or partner SDK access."
                : "This package is limited to non-AI verification modules. Upgrade to Protocol for full compute and partner access.",
        plan: auth.plan,
        requested_product: productId,
        subscribe_url: "/dev",
      },
    };
  }

  return { ok: true };
}
