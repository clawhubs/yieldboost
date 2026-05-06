export const YA_TOKEN_ADDRESS = "0xa8018A4920ecA7AF0Df88caCFD5E21b939A678b5";
export const YA_TOKEN_DECIMALS = 18;
export const YA_TESTNET_CHAIN_ID = 16602;
export const YA_TESTNET_CHAIN_ID_HEX = "0x40da";
export const YA_TESTNET_RPC_URL = "https://evmrpc-testnet.0g.ai";
export const YA_TREASURY_ADDRESS_FALLBACK =
  "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D";

export interface YaApiPlan {
  id: "free" | "builder" | "pro" | "protocol";
  name: string;
  priceYa: number;
  priceLabel: string;
  renewalLabel: string;
  apiKeys: number;
  monthlyQuota: number;
  expiresInDays: number;
  quotaLabel: string;
  environment: "testnet" | "mainnet" | "multi";
  scopes: string[];
  features: string[];
}

export const YA_API_PLANS: YaApiPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    priceYa: 0,
    priceLabel: "0 YA",
    renewalLabel: "No payment",
    apiKeys: 1,
    monthlyQuota: 3000,
    expiresInDays: 30,
    quotaLabel: "100 requests/day",
    environment: "testnet",
    scopes: ["status:read", "blacklist:check", "audit:run", "proof:run"],
    features: [
      "1 test API key",
      "100 requests per day",
      "Basic optimizer endpoint",
      "Proof lookup preview",
    ],
  },
  {
    id: "builder",
    name: "Builder",
    priceYa: 88,
    priceLabel: "88 YA",
    renewalLabel: "30 days",
    apiKeys: 1,
    monthlyQuota: 10000,
    expiresInDays: 30,
    quotaLabel: "10,000 requests/month",
    environment: "testnet",
    scopes: ["status:read", "blacklist:check", "audit:run", "proof:run"],
    features: [
      "1 production API key",
      "10,000 requests per month",
      "Yield optimizer API",
      "Basic proof lookup",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceYa: 888,
    priceLabel: "888 YA",
    renewalLabel: "30 days",
    apiKeys: 3,
    monthlyQuota: 150000,
    expiresInDays: 30,
    quotaLabel: "150,000 requests/month",
    environment: "multi",
    scopes: [
      "status:read",
      "blacklist:check",
      "audit:run",
      "proof:run",
      "integrity:seal",
      "integrity:unseal",
      "integrity:read",
      "governance:evaluate",
      "handshake:write",
    ],
    features: [
      "3 production API keys",
      "150,000 requests per month",
      "Proof-backed optimization",
      "Vault and governance endpoints",
      "Webhook-ready integration",
    ],
  },
  {
    id: "protocol",
    name: "Protocol",
    priceYa: 8888,
    priceLabel: "8,888 YA",
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
      "Custom rate limit",
      "Partner SDK support",
      "White-label integration path",
    ],
  },
];

export function getYaApiPlan(planId: string | null | undefined) {
  return YA_API_PLANS.find((plan) => plan.id === planId) ?? YA_API_PLANS[0];
}

export function getYaTreasuryAddress() {
  return (
    process.env.NEXT_PUBLIC_YA_TREASURY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_FOUNDER_WALLET_ADDRESS?.trim() ||
    YA_TREASURY_ADDRESS_FALLBACK
  );
}
