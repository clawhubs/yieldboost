import { YA_API_PLANS, type YaApiPlan } from "@/lib/ya-api-plans";

export type ApiMarketplaceProductId =
  | "military-grade-full"
  | "sentinel-identity"
  | "tee-response"
  | "sovereign-memory"
  | "rejection-guard"
  | "stress-replay"
  | "reasoning-envelope"
  | "governance-gate"
  | "compliance-proof"
  | "neural-handshake"
  | "veilsolver";

export interface ApiMarketplaceLayer {
  id: string;
  slug: Exclude<ApiMarketplaceProductId, "military-grade-full" | "veilsolver">;
  label: string;
  proof: string;
  endpoint: string;
}

export interface ApiMarketplacePlan {
  id: YaApiPlan["id"];
  name: string;
  priceYa: number;
  quota: string;
  cta: string;
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
  status: "live-local" | "testnet-ready" | "mainnet-ready";
  category: "full-stack" | "single-layer" | "partner-sdk";
  layerId?: string;
  layers: ApiMarketplaceLayer[];
  plans: ApiMarketplacePlan[];
  sdkSnippet: string;
}

export const API_MARKETPLACE_PLANS: ApiMarketplacePlan[] = YA_API_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  priceYa: plan.priceYa,
  quota: plan.quotaLabel,
  cta: plan.priceYa ? "Subscribe with YA" : "Try endpoint",
}));

export const MILITARY_GRADE_API_LAYERS: ApiMarketplaceLayer[] = [
  {
    id: "01",
    slug: "sentinel-identity",
    label: "Sentinel Identity Gate",
    proof: "Noir agent_identity proof validates the caller or agent session.",
    endpoint: "/api/dev/store/layers/sentinel-identity",
  },
  {
    id: "02",
    slug: "tee-response",
    label: "TEE Response Gate",
    proof: "0G Compute response signature or attestation is checked before trust.",
    endpoint: "/api/dev/store/layers/tee-response",
  },
  {
    id: "03",
    slug: "sovereign-memory",
    label: "Sovereign Memory",
    proof: "Decision state is packaged as a memory artifact with 0G-ready receipt.",
    endpoint: "/api/dev/store/layers/sovereign-memory",
  },
  {
    id: "04",
    slug: "rejection-guard",
    label: "Rejection Guard",
    proof: "Known bad or hallucinated decisions are checked before execution.",
    endpoint: "/api/dev/store/layers/rejection-guard",
  },
  {
    id: "05",
    slug: "stress-replay",
    label: "Stress Replay",
    proof: "Historical and adversarial scenarios replay the decision output.",
    endpoint: "/api/dev/store/layers/stress-replay",
  },
  {
    id: "06",
    slug: "reasoning-envelope",
    label: "Reasoning Envelope",
    proof: "TEE/ZK-ready reasoning envelope binds inputs, output, and summary.",
    endpoint: "/api/dev/store/layers/reasoning-envelope",
  },
  {
    id: "07",
    slug: "governance-gate",
    label: "Governance Gate",
    proof: "Policy scoring and kill-switch checks run before downstream use.",
    endpoint: "/api/dev/store/layers/governance-gate",
  },
  {
    id: "08",
    slug: "compliance-proof",
    label: "ZK Policy Seal",
    proof: "Zero-knowledge policy seal percentage and proof id are produced.",
    endpoint: "/api/dev/store/layers/compliance-proof",
  },
  {
    id: "09",
    slug: "neural-handshake",
    label: "Neural Handshake",
    proof: "Cross-agent transcript confirms the optimizer and auditor agreed.",
    endpoint: "/api/dev/store/layers/neural-handshake",
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
  partner: "YieldBoost YA",
  tagline: `Layer ${layer.id} endpoint`,
  description: layer.proof,
  logoPath: "/marketplace/ya-9-layer-logo.png",
  endpoint: layer.endpoint,
  playgroundPath: `/dev/marketplace/${layer.slug}`,
  docsPath: `/dev/marketplace/${layer.slug}/docs`,
  status: "testnet-ready",
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
    partner: "YieldBoost YA",
    tagline: "All nine verification layers in one endpoint",
    description:
      "One endpoint that runs the complete YieldBoost military-grade pipeline: Sentinel identity, TEE response, memory, rejection guard, stress replay, reasoning envelope, governance, policy seal, and neural handshake.",
    logoPath: "/marketplace/ya-9-layer-logo.png",
    endpoint: "/api/dev/store/military-grade",
    playgroundPath: "/dev/marketplace/military-grade-full",
    docsPath: "/dev/marketplace/military-grade-full/docs",
    status: "testnet-ready",
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
      "VeilSolver partner SDK wrapped and secured by YieldBoost Secure Proxy. Developers call the same solver through isolated secure execution and receive a ZK proof envelope.",
    logoPath: "/marketplace/veilsolver-logo.svg",
    endpoint: "/api/dev/store/veilsolver",
    playgroundPath: "/dev/marketplace/veilsolver",
    docsPath: "/dev/marketplace/veilsolver/docs",
    upstreamUrl: "https://veilresolver.onrender.com",
    contractAddress: "0x4181c06901Ee172c169fFDf44c6C192c22265aF",
    solverPublicKey:
      "0x039a5b81f4b2bc0c181b1292f3aeb55721de43dc7e3d07c6c44ba3aa087ecaae04",
    status: "testnet-ready",
    category: "partner-sdk",
    layers: MILITARY_GRADE_API_LAYERS,
    plans: API_MARKETPLACE_PLANS,
    sdkSnippet: `import { createVeilSolverClient } from "@yieldboost/secure-proxy-sdk";

const veilsolver = createVeilSolverClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
  baseUrl: "https://dev.yieldboostai.xyz",
});

const result = await veilsolver.solve({
  intent: "private swap route",
  chainId: 16602,
  contractAddress: "0x4181c06901Ee172c169fFDf44c6C192c22265aF",
});`,
  },
];

export function getApiMarketplaceProduct(productId: ApiMarketplaceProductId) {
  return API_MARKETPLACE_PRODUCTS.find((product) => product.id === productId) ?? null;
}

export function getApiMarketplaceLayer(layerSlug: string) {
  return MILITARY_GRADE_API_LAYERS.find((layer) => layer.slug === layerSlug) ?? null;
}
