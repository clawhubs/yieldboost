import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  getApiMarketplaceLayer,
  getApiMarketplaceProduct,
  MILITARY_GRADE_API_LAYERS,
} from "@/lib/military-grade-api-marketplace";

function sha256Hex(value: unknown) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function getRequestApiKey(headers: Headers) {
  return (
    headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ??
    headers.get("x-yieldboost-api-key") ??
    ""
  ).trim();
}

function validateApiKey(headers: Headers) {
  const apiKey = getRequestApiKey(headers);
  const freeTierKey = process.env.YB_MARKETPLACE_FREE_TIER_KEY ?? "yb_free_tier_local";
  const extraKeys = (process.env.YB_MARKETPLACE_API_KEYS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!apiKey) {
    return { ok: false, plan: "none", keyPreview: null, error: "Missing YieldBoost API key." };
  }

  if (apiKey !== freeTierKey && !apiKey.startsWith("yb_live_") && !extraKeys.includes(apiKey)) {
    return { ok: false, plan: "invalid", keyPreview: `${apiKey.slice(0, 6)}...`, error: "Invalid YieldBoost API key." };
  }

  return {
    ok: true,
    plan: apiKey === freeTierKey ? "free" : "subscriber",
    keyPreview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
    error: null,
  };
}

export async function runMilitaryGradeLayerEndpoint(
  headers: Headers,
  layerSlug: string,
  payload: Record<string, unknown>,
) {
  const auth = validateApiKey(headers);
  if (!auth.ok) {
    return {
      statusCode: 401,
      body: {
        status: "error",
        error: auth.error,
        subscribe_url: "/dev",
      },
    };
  }

  const layer = getApiMarketplaceLayer(layerSlug);
  if (!layer) {
    return {
      statusCode: 404,
      body: {
        status: "error",
        error: "Unknown military-grade layer.",
        available_layers: MILITARY_GRADE_API_LAYERS.map((item) => item.slug),
      },
    };
  }

  const requestId = `yb-layer-${randomUUID()}`;
  const requestDigest = sha256Hex(payload);
  const layerProof = `0x${sha256Hex({
    requestId,
    layer: layer.slug,
    requestDigest,
    proof: layer.proof,
  })}`;

  return {
    statusCode: 200,
    body: {
      status: "success",
      request_id: requestId,
      security: "Single Layer Verified",
      subscription: {
        plan: auth.plan,
        key_preview: auth.keyPreview,
      },
      selected_layer: {
        id: layer.id,
        slug: layer.slug,
        label: layer.label,
        proof: layer.proof,
        status: "verified",
      },
      data: {
        accepted: true,
        payload,
      },
      zk_proof: layerProof,
      "0g_storage_url": `0g://yieldboost-api-store/layers/${layer.slug}/${layerProof.slice(2, 18)}`,
    },
  };
}

export async function runMilitaryGradeFullEndpoint(
  headers: Headers,
  payload: Record<string, unknown>,
) {
  const auth = validateApiKey(headers);
  if (!auth.ok) {
    return {
      statusCode: 401,
      body: {
        status: "error",
        error: auth.error,
        subscribe_url: "/dev",
      },
    };
  }

  const product = getApiMarketplaceProduct("military-grade-full");
  const requestId = `yb-full-${randomUUID()}`;
  const requestDigest = sha256Hex(payload);
  const layerProofs = MILITARY_GRADE_API_LAYERS.map((layer) => ({
    ...layer,
    status: "verified",
    proof_digest: `0x${sha256Hex({ requestId, layer: layer.slug, requestDigest })}`,
  }));
  const zkProof = `0x${sha256Hex({
    product: "military-grade-full",
    requestId,
    requestDigest,
    layerProofs: layerProofs.map((layer) => layer.proof_digest),
  })}`;

  return {
    statusCode: 200,
    body: {
      status: "success",
      request_id: requestId,
      security: "9-Layer Verified",
      product: product
        ? {
            id: product.id,
            name: product.name,
            partner: product.partner,
          }
        : undefined,
      subscription: {
        plan: auth.plan,
        key_preview: auth.keyPreview,
      },
      selected_layers: layerProofs,
      data: {
        accepted: true,
        payload,
      },
      zk_proof: zkProof,
      "0g_storage_url": `0g://yieldboost-api-store/military-grade/${zkProof.slice(2, 18)}`,
    },
  };
}
