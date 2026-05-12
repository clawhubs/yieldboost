import { YA_API_PLANS, type YaApiPlan } from "@/lib/ya-api-plans";

export type ApiMarketplaceProductId =
  | "military-grade-full"
  | "aws-nitro-fortress"
  | "anti-sybil-zk-fingerprint"
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
  slug: string;
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
  category: "full-stack" | "single-layer" | "partner-sdk" | "security-module";
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

const PROTOCOL_ONLY_PLANS = API_MARKETPLACE_PLANS.filter((plan) => plan.id === "protocol");
const BUILDER_PRO_PROTOCOL_PLANS = API_MARKETPLACE_PLANS.filter(
  (plan) => plan.id === "builder" || plan.id === "pro" || plan.id === "protocol",
);
const ALL_PACKAGE_PLANS = API_MARKETPLACE_PLANS;

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

const antiSybilFingerprintLayers: ApiMarketplaceLayer[] = [
  {
    id: "AS1",
    slug: "anti-sybil-zk-fingerprint",
    label: "Wallet-bound screening",
    proof: "Mainnet wallet address is bound to the request before a key or session is issued.",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
  },
  {
    id: "AS2",
    slug: "anti-sybil-zk-fingerprint",
    label: "Deterministic anti-sybil throttle",
    proof: "IP and wallet attempt windows are scored to flag repeated or bursty request patterns.",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
  },
  {
    id: "AS3",
    slug: "anti-sybil-zk-fingerprint",
    label: "Alibaba behavior fingerprinting",
    proof: "Behavior text is hashed and optionally embedding-checked through the Alibaba fingerprint path.",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
  },
  {
    id: "AS4",
    slug: "anti-sybil-zk-fingerprint",
    label: "ZK proof envelope",
    proof: "The verification verdict is sealed into a mainnet-ready ZK envelope with an anchor reference.",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
  },
];

const awsNitroFortressLayers: ApiMarketplaceLayer[] = [
  {
    id: "NF1",
    slug: "aws-nitro-fortress",
    label: "AWS Nitro Enclave",
    proof: "The sensitive runtime is framed as an enclave-only execution path that keeps operator access outside the secret boundary.",
    endpoint: "/api/dev/store/aws-nitro-fortress",
  },
  {
    id: "NF2",
    slug: "aws-nitro-fortress",
    label: "0G TEE Badge",
    proof: "Each response includes a TEE-style badge summary so the caller can inspect enclave identity and verdict metadata.",
    endpoint: "/api/dev/store/aws-nitro-fortress",
  },
  {
    id: "NF3",
    slug: "aws-nitro-fortress",
    label: "0G Storage Incident Journal",
    proof: "Attack attempts, seal events, and recovery events are written into a persistent incident journal reference.",
    endpoint: "/api/dev/store/aws-nitro-fortress",
  },
  {
    id: "NF4",
    slug: "aws-nitro-fortress",
    label: "Recovery Replay",
    proof: "The fortress can replay its state after a simulated destruct event and return a recovery message with the incident digest.",
    endpoint: "/api/dev/store/aws-nitro-fortress",
  },
];

const veilSolverWrapperLayers: ApiMarketplaceLayer[] = [
  {
    id: "ZK1",
    slug: "veilsolver",
    label: "Isolated secure execution",
    proof: "Developer payload is processed through the YieldBoost secure proxy before the partner solver is called.",
    endpoint: "/api/dev/store/veilsolver",
  },
  {
    id: "ZK2",
    slug: "veilsolver",
    label: "Partner solver response",
    proof: "The response comes from the VeilSolver partner solver and is returned through the YieldBoost wrapper.",
    endpoint: "/api/dev/store/veilsolver",
  },
  {
    id: "ZK3",
    slug: "veilsolver",
    label: "ZK proof envelope",
    proof: "Request and response digests are sealed into a verification envelope for developer audit trails.",
    endpoint: "/api/dev/store/veilsolver",
  },
  {
    id: "ZK4",
    slug: "veilsolver",
    label: "0G response anchor",
    proof: "The wrapped response includes an anchor reference for 0G-based verification records.",
    endpoint: "/api/dev/store/veilsolver",
  },
];

const layerProducts: ApiMarketplaceProduct[] = MILITARY_GRADE_API_LAYERS.map((layer) => ({
  id: layer.slug as ApiMarketplaceProductId,
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
  plans: layer.slug === "secure-compute-tee" ? PROTOCOL_ONLY_PLANS : ALL_PACKAGE_PLANS,
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
    plans: PROTOCOL_ONLY_PLANS,
    sdkSnippet: buildLayerSdkSnippet("/api/dev/store/military-grade"),
  },
  {
    id: "aws-nitro-fortress",
    name: "AWS Nitro Fortress SDK",
    partner: "YieldBoost 0G",
    tagline: "Nitro enclave runtime with 0G storage memory and 0G TEE badge",
    description:
      "A modular fortress SDK for secure agent runtimes: AWS Nitro Enclave framing for isolated execution, a 0G TEE badge summary for attestation-style evidence, and a 0G Storage incident journal for sealed secrets, attack logs, and recovery replay history.",
    logoPath: "/marketplace/ya-9-layer-logo.png",
    endpoint: "/api/dev/store/aws-nitro-fortress",
    playgroundPath: "/dev/marketplace/aws-nitro-fortress",
    docsPath: "/dev/marketplace/aws-nitro-fortress/docs",
    status: "mainnet-live",
    category: "security-module",
    layers: awsNitroFortressLayers,
    plans: PROTOCOL_ONLY_PLANS,
    sdkSnippet: `const response = await fetch("https://dev.yieldboostai.xyz/api/dev/store/aws-nitro-fortress", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.YIELDBOOST_API_KEY}\`,
  },
  body: JSON.stringify({
    requestId: "nitro-demo-001",
    network: "mainnet",
    operation: "seal_secret",
    secret: "arb route alpha",
    operator: "judge-demo",
    sdkMode: "marketplace-playground",
  }),
});

const result = await response.json();`,
  },
  {
    id: "anti-sybil-zk-fingerprint",
    name: "Anti-Sybil + ZK Proof + Alibaba Fingerprinting",
    partner: "YieldBoost 0G",
    tagline: "Mainnet screening module for wallets, sessions, and API access",
    description:
      "A mainnet verification module derived from the faucet defense path: wallet-bound screening, deterministic anti-sybil throttles, Alibaba behavior fingerprinting, and a ZK proof envelope ready for API issuance and risk review.",
    logoPath: "/marketplace/ya-9-layer-logo.png",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
    playgroundPath: "/dev/marketplace/anti-sybil-zk-fingerprint",
    docsPath: "/dev/marketplace/anti-sybil-zk-fingerprint/docs",
    status: "mainnet-live",
    category: "security-module",
    layers: antiSybilFingerprintLayers,
    plans: BUILDER_PRO_PROTOCOL_PLANS,
    sdkSnippet: `const response = await fetch("https://dev.yieldboostai.xyz/api/dev/store/anti-sybil-zk-fingerprint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.YIELDBOOST_API_KEY}\`,
  },
  body: JSON.stringify({
    requestId: "anti-sybil-demo-001",
    walletAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
    network: "mainnet",
    intent: "screen a wallet before issuing a high-value API key",
    sessionId: "sess_live_01",
    deviceLabel: "chrome-macbook-pro",
  }),
});

const result = await response.json();`,
  },
  ...layerProducts,
  {
    id: "veilsolver",
    name: "VeilSolver Secure Proxy",
    partner: "Shlok / VeilSolver",
    tagline: "Private Intent Solver on 0G",
    description:
      "Partner SDK: the VeilSolver SDK is wrapped by selected YieldBoost protections: isolated execution, partner solver response handling, a ZK proof envelope, and a 0G response anchor. The full 9-layer stack is a separate YieldBoost-native product.",
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
    layers: veilSolverWrapperLayers,
    plans: PROTOCOL_ONLY_PLANS,
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
