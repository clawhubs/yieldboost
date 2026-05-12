export const O_G_MAINNET_CHAIN_ID = 16661;
export const O_G_MAINNET_CHAIN_ID_HEX = "0x4115";
export const O_G_MAINNET_RPC_URL = "https://evmrpc.0g.ai";
export const O_G_MAINNET_EXPLORER_URL = "https://chainscan.0g.ai";
export const O_G_TREASURY_ADDRESS_FALLBACK =
  "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D";
export const YA_TOKEN_ADDRESS = "0xa8018A4920ecA7AF0Df88caCFD5E21b939A678b5";
export const YA_TOKEN_DECIMALS = 18;
export const YA_TESTNET_CHAIN_ID = 16602;
export const YA_TESTNET_CHAIN_ID_HEX = "0x40da";
export const YA_TESTNET_RPC_URL = "https://evmrpc-testnet.0g.ai";

export interface YaApiPlan {
  id: "free" | "builder" | "pro" | "protocol";
  name: string;
  listPrice0g?: string | null;
  checkoutPrice0g: string;
  priceLabel: string;
  renewalLabel: string;
  apiKeys: number;
  monthlyQuota: number;
  expiresInDays: number;
  quotaLabel: string;
  environment: "testnet" | "mainnet" | "multi";
  scopes: string[];
  features: string[];
  promoLabel?: string | null;
}

export const YA_API_PLANS: YaApiPlan[] = [
  {
    id: "free",
    name: "Free",
    listPrice0g: null,
    checkoutPrice0g: "0",
    priceLabel: "0 0G",
    renewalLabel: "No payment",
    apiKeys: 1,
    monthlyQuota: 3000,
    expiresInDays: 30,
    quotaLabel: "100 requests/day",
    environment: "mainnet",
    scopes: ["status:read", "blacklist:check", "audit:run", "proof:run"],
    features: [
      "1 test API key",
      "100 requests per day",
      "Non-AI verification modules only",
      "ZK proof + proof lookup preview",
      "No TEE, no partner SDK, no Alibaba fingerprinting",
    ],
  },
  {
    id: "builder",
    name: "Builder",
    listPrice0g: null,
    checkoutPrice0g: "88",
    priceLabel: "88 0G",
    renewalLabel: "30 days",
    apiKeys: 1,
    monthlyQuota: 10000,
    expiresInDays: 30,
    quotaLabel: "10,000 requests/month",
    environment: "mainnet",
    scopes: [
      "status:read",
      "blacklist:check",
      "audit:run",
      "proof:run",
      "governance:evaluate",
      "handshake:write",
      "integrity:read",
    ],
    features: [
      "1 production API key",
      "10,000 requests per month",
      "Deterministic verification modules",
      "Alibaba anti-sybil marketplace module",
      "Governance + handshake APIs",
      "No full 9-layer compute or partner SDK",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    listPrice0g: "888",
    checkoutPrice0g: "5",
    priceLabel: "5 0G",
    renewalLabel: "30 days",
    apiKeys: 3,
    monthlyQuota: 150000,
    expiresInDays: 30,
    quotaLabel: "150,000 requests/month",
    environment: "mainnet",
    scopes: [
      "status:read",
      "blacklist:check",
      "audit:run",
      "proof:run",
      "integrity:read",
      "governance:evaluate",
      "handshake:write",
    ],
    features: [
      "3 production API keys",
      "150,000 requests per month",
      "Extended verification modules + Alibaba fingerprinting",
      "Vault metadata read + governance APIs",
      "ZK, proof, governance, and webhook-ready access",
      "No TEE or partner SDK access",
      "Scoped package activation",
    ],
    promoLabel: "30-day trial",
  },
  {
    id: "protocol",
    name: "Protocol",
    listPrice0g: null,
    checkoutPrice0g: "8888",
    priceLabel: "8,888 0G",
    renewalLabel: "30 days",
    apiKeys: 10,
    monthlyQuota: 2000000,
    expiresInDays: 30,
    quotaLabel: "2M requests/month",
    environment: "multi",
    scopes: [
      "status:read",
      "blacklist:check",
      "audit:run",
      "proof:run",
      "integrity:seal",
      "integrity:unseal",
      "integrity:delete",
      "integrity:read",
      "governance:evaluate",
      "handshake:write",
    ],
    features: [
      "10 production API keys",
      "2M requests per month",
      "Full 9-layer compute, TEE, and AWS Nitro Fortress access",
      "Alibaba anti-sybil + VeilSolver partner SDK",
      "Vault seal, unseal, delete, and white-label path",
      "Custom rate limit",
    ],
  },
];

export function getYaApiPlan(planId: string | null | undefined) {
  return YA_API_PLANS.find((plan) => plan.id === planId) ?? YA_API_PLANS[0];
}

export function get0GTreasuryAddress() {
  return (
    process.env.NEXT_PUBLIC_0G_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_YA_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_FOUNDER_WALLET_ADDRESS?.trim() ||
    O_G_TREASURY_ADDRESS_FALLBACK
  );
}

export function getYaTreasuryAddress() {
  return get0GTreasuryAddress();
}
