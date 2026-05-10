import { YA_API_PLANS, type YaApiPlan } from "@/lib/ya-api-plans";

export type ApiMarketplaceProductId =
  | "military-grade-full"
  | "hallucination-blacklist"
  | "integrity-auditor"
  | "secure-compute-tee"
  | "sovereign-memory"
  | "zero-g-storage-proof-layer"
  | "zero-knowledge-proof-layer"
  | "proofregistry-anchor"
  | "programmable-governance"
  | "cross-agent-neural-handshake"
  | "veilsolver";

export interface ApiMarketplaceLayer {
  id: string;
  slug: Exclude<ApiMarketplaceProductId, "military-grade-full" | "veilsolver">;
  label: string;
  proof: string;
  endpoint: string;
  legacySlugs?: string[];
}

export interface ApiMarketplacePlan {
  id: YaApiPlan["id"];
  name: string;
  checkoutPrice0g: string;
  listPrice0g?: string | null;
  quota: string;
  cta: string;
  promoLabel?: string | null;
}

export interface ApiMarketplaceProduct {
  id: ApiMarketplaceProductId;
  name: string;
  partner: string;
  tagline: string;
  description: string;
  logoPath: string;
  endpoint: string;
  playgroundPath?: string;
  docsPath?: string;
  upstreamUrl?: string;
  contractAddress?: string;
  solverPublicKey?: string;
  status: "live-local" | "testnet-live" | "mainnet-live";
  category: "full-stack" | "single-layer" | "partner-sdk";
  layerId?: string;
  layers: ApiMarketplaceLayer[];
  plans: ApiMarketplacePlan[];
  sdkSnippet: string;
}

export const API_MARKETPLACE_PLANS: ApiMarketplacePlan[] = YA_API_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  checkoutPrice0g: plan.checkoutPrice0g,
  listPrice0g: plan.listPrice0g,
  quota: plan.quotaLabel,
  cta: plan.checkoutPrice0g !== "0" ? "Subscribe with 0G" : "Try endpoint",
  promoLabel: plan.promoLabel,
}));

export const MILITARY_GRADE_API_LAYERS: ApiMarketplaceLayer[] = [
  {
    id: "01",
    slug: "hallucination-blacklist",
    label: "Hallucination Blacklist",
    proof: "Known bad prompts, unsafe patterns, and rejected decisions are blocked before inference.",
    endpoint: "/api/dev/store/layers/hallucination-blacklist",
    legacySlugs: ["sentinel-identity", "rejection-guard"],
  },
  {
    id: "02",
    slug: "integrity-auditor",
    label: "Integrity Auditor",
    proof: "Deterministic guardrails verify the payload, ownership scope, and risk bounds.",
    endpoint: "/api/dev/store/layers/integrity-auditor",
    legacySlugs: ["tee-response"],
  },
  {
    id: "03",
    slug: "secure-compute-tee",
    label: "Secure Compute / TEE",
    proof: "Sensitive execution uses the secure compute path and records TEE response evidence.",
    endpoint: "/api/dev/store/layers/secure-compute-tee",
    legacySlugs: ["stress-replay"],
  },
  {
    id: "04",
    slug: "sovereign-memory",
    label: "Sovereign Memory",
    proof: "Decision state is packaged as a memory artifact with a 0G receipt.",
    endpoint: "/api/dev/store/layers/sovereign-memory",
  },
  {
    id: "05",
    slug: "zero-g-storage-proof-layer",
    label: "0G Storage Proof Layer",
    proof: "Proof payloads are stored on 0G Storage with receipt metadata for audit.",
    endpoint: "/api/dev/store/layers/zero-g-storage-proof-layer",
  },
  {
    id: "06",
    slug: "zero-knowledge-proof-layer",
    label: "Zero-Knowledge Proof Layer",
    proof: "ZK proof envelope verifies the committed inputs, output, and summary without exposing private witness data.",
    endpoint: "/api/dev/store/layers/zero-knowledge-proof-layer",
    legacySlugs: ["reasoning-envelope", "compliance-proof"],
  },
  {
    id: "07",
    slug: "proofregistry-anchor",
    label: "ProofRegistry Anchor",
    proof: "Storage commitments are anchored on-chain through ProofRegistry.",
    endpoint: "/api/dev/store/layers/proofregistry-anchor",
  },
  {
    id: "08",
    slug: "programmable-governance",
    label: "Programmable Governance",
    proof: "Policy scoring, kill-switch checks, and ZK policy seal status are produced.",
    endpoint: "/api/dev/store/layers/programmable-governance",
    legacySlugs: ["governance-gate"],
  },
  {
    id: "09",
    slug: "cross-agent-neural-handshake",
    label: "Cross-Agent Neural Handshake",
    proof: "Cross-agent transcript confirms the optimizer and auditor agreed.",
    endpoint: "/api/dev/store/layers/cross-agent-neural-handshake",
    legacySlugs: ["neural-handshake"],
  },
];

function buildLayerSdkSnippet(endpoint: string) {
  return `const response = await fetch("https://dev.yieldboostai.xyz${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.YIELDBOOST_API_KEY}\`,
  },
  body: JSON.stringify({ payload: yourDecision }),
});

const verified = await response.json();`;
}

const layerProducts: ApiMarketplaceProduct[] = MILITARY_GRADE_API_LAYERS.map((layer) => ({
  id: layer.slug,
  name: layer.label,
  partner: "YieldBoost 0G",
  tagline: `Layer ${layer.id} endpoint`,
  description: layer.proof,
  logoPath: "/marketplace/ya-9-layer-logo.png",
  endpoint: layer.endpoint,
  playgroundPath: `/dev/marketplace/${layer.slug}`,
  docsPath: `/dev/marketplace/${layer.slug}/docs`,
  status: "mainnet-live",
  category: "single-layer",
  layerId: layer.id,
  layers: [layer],
  plans: API_MARKETPLACE_PLANS,
  sdkSnippet: buildLayerSdkSnippet(layer.endpoint),
}));

export const API_MARKETPLACE_PRODUCTS: ApiMarketplaceProduct[] = [
  {
    id: "military-grade-full",
    name: "Full 9-Layer Military-Grade API",
    partner: "YieldBoost 0G",
    tagline: "All nine verification layers in one endpoint",
    description:
      "One endpoint that runs the complete YieldBoost military-grade pipeline: Hallucination Blacklist, Integrity Auditor, Secure Compute / TEE, Sovereign Memory, 0G Storage Proof Layer, Zero-Knowledge Proof Layer, ProofRegistry Anchor, Programmable Governance, and Cross-Agent Neural Handshake.",
    logoPath: "/marketplace/ya-9-layer-logo.png",
    endpoint: "/api/dev/store/military-grade",
    playgroundPath: "/dev/marketplace/military-grade-full",
    docsPath: "/dev/marketplace/military-grade-full/docs",
    status: "mainnet-live",
    category: "full-stack",
    layers: MILITARY_GRADE_API_LAYERS,
    plans: API_MARKETPLACE_PLANS,
    sdkSnippet: buildLayerSdkSnippet("/api/dev/store/military-grade"),
  },
  ...layerProducts,
  {
    id: "veilsolver",
    name: "VeilSolver Secure Proxy",
    partner: "Shlok / VeilSolver",
    tagline: "Private Intent Solver on 0G",
    description:
      "Partner SDK: the VeilSolver SDK is wrapped and secured by YieldBoost Secure Proxy. Developers call the partner solver through isolated secure execution and receive a ZK proof envelope.",
    logoPath: "/marketplace/veilsolver-logo.svg",
    endpoint: "/api/dev/store/veilsolver",
    playgroundPath: "/dev/marketplace/veilsolver",
    docsPath: "/dev/marketplace/veilsolver/docs",
    upstreamUrl: "https://veilresolver.onrender.com",
    contractAddress: "0x4181c06901Ee172c169fFDf44c6C192c22265aF",
    solverPublicKey:
      "0x039a5b81f4b2bc0c181b1292f3aeb55721de43dc7e3d07c6c44ba3aa087ecaae04",
    status: "mainnet-live",
    category: "partner-sdk",
    layers: MILITARY_GRADE_API_LAYERS,
    plans: API_MARKETPLACE_PLANS,
    sdkSnippet: `// YieldBoost Secure Proxy wraps VeilSolver SDK encrypted intents
// with API-key gating, isolated execution, and a ZK response envelope.
const response = await fetch("https://dev.yieldboostai.xyz/api/dev/store/veilsolver", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.YIELDBOOST_API_KEY}\`,
  },
  body: JSON.stringify({
    action: "SWAP",
    chainId: 16661,
    tokenIn: "0x0000000000000000000000000000000000000000",
    tokenOut: "0x0000000000000000000000000000000000000000",
    amountIn: "1.0",
    decimalsIn: 18,
    maxSlippageBps: 50,
    userAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
  }),
});

const result = await response.json();`,
  },
];

export function getApiMarketplaceProduct(productId: ApiMarketplaceProductId) {
  return (
    API_MARKETPLACE_PRODUCTS.find((product) => product.id === productId) ??
    API_MARKETPLACE_PRODUCTS.find((product) =>
      product.layers.some((layer) => layer.legacySlugs?.includes(productId)),
    ) ??
    null
  );
}

export function getApiMarketplaceLayer(layerSlug: string) {
  return (
    MILITARY_GRADE_API_LAYERS.find((layer) => layer.slug === layerSlug) ??
    MILITARY_GRADE_API_LAYERS.find((layer) => layer.legacySlugs?.includes(layerSlug)) ??
    null
  );
}
