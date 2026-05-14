const DEFAULT_API_BASE_URL = "https://api.yieldboostai.xyz";

export interface DevDashboardResponse {
  success: boolean;
  request_id: string;
  total_api_keys: number;
  active_api_keys: number;
  revoked_api_keys: number;
  total_requests: number;
  success_requests: number;
  blocked_requests: number;
  total_deflected_attacks: number;
  top_apps: Array<{
    key_id: string | null;
    app_name: string;
    total_requests: number;
    success_requests: number;
    blocked_requests: number;
    last_used_at: string | null;
  }>;
  recent_usage: Array<{
    request_id: string;
    path: string;
    method: string;
    status_code: number;
    category: "auth" | "integrity" | "audit" | "blacklist" | "proof" | "governance" | "handshake" | "status" | "admin" | "health" | "other";
    app_name: string;
    key_id: string | null;
    network: string | null;
    wallet_address: string | null;
    latency_ms: number;
    timestamp: string;
  }>;
  recent_logs: Array<{
    wallet_address: string;
    action_type: "Seal" | "Unseal";
    status: "Success" | "Blocked";
    layer_failed?: string | null;
    payload_metadata: Record<string, unknown>;
    timestamp: string;
  }>;
}

export interface ManagedApiKey {
  key_id: string;
  app_name: string;
  owner_label: string | null;
  owner_wallet_address: string | null;
  environment: "testnet" | "mainnet" | "multi";
  notes: string | null;
  scopes: string[];
  plan_id?: string | null;
  plan_name?: string | null;
  plan_price_ya?: number | null;
  plan_price_og?: string | null;
  plan_max_keys?: number | null;
  plan_quota_monthly?: number | null;
  plan_expires_at?: string | null;
  checkout_tx_hash?: string | null;
  checkout_integrity_hash?: string | null;
  monthly_usage?: Record<string, number>;
  key_preview: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  total_requests: number;
  success_requests: number;
  blocked_requests: number;
}

export interface ManagedApiKeysResponse {
  success: boolean;
  request_id: string;
  items: ManagedApiKey[];
  total: number;
}

export interface CheckoutVerifyResponse {
  success: boolean;
  request_id: string;
  verified: boolean;
  plan_id: string;
  wallet_address: string;
  amount_og: string;
  tx_hash: string | null;
  asset_symbol: string;
  network: "mainnet" | "testnet";
  treasury_address: string;
  proof_type: string;
  integrity_hash: string;
  explorer_url: string | null;
  layer_statuses: Record<string, string>;
}

export interface SetupState {
  apiBaseUrl: string;
  adminEnabled: boolean;
  missing: string[];
}

export function getDevPortalSetupState(): SetupState {
  const resolvedMasterKey =
    process.env.INTEGRITY_DEV_PORTAL_MASTER_KEY?.trim() ||
    process.env.INTEGRITY_MASTER_KEY?.trim() ||
    "";
  const apiBaseUrl =
    process.env.INTEGRITY_DEV_PORTAL_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_INTEGRITY_API_BASE_URL?.trim() ||
    DEFAULT_API_BASE_URL;

  const missing: string[] = [];
  if (!resolvedMasterKey) {
    missing.push("INTEGRITY_DEV_PORTAL_MASTER_KEY or INTEGRITY_MASTER_KEY");
  }

  return {
    apiBaseUrl,
    adminEnabled: missing.length === 0,
    missing,
  };
}

async function portalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const setup = getDevPortalSetupState();
  const response = await fetch(`${setup.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(setup.adminEnabled
        ? {
            "X-Master-Key":
              process.env.INTEGRITY_DEV_PORTAL_MASTER_KEY?.trim() ||
              process.env.INTEGRITY_MASTER_KEY!.trim(),
          }
        : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `Developer portal request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error || fallback);
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error;
      }
      throw new Error(fallback);
    }
  }

  return (await response.json()) as T;
}

export async function getDeveloperDashboardData(): Promise<DevDashboardResponse | null> {
  const setup = getDevPortalSetupState();
  if (!setup.adminEnabled) {
    return null;
  }
  return portalFetch<DevDashboardResponse>("/v1/admin/dashboard");
}

export async function getManagedApiKeys(): Promise<ManagedApiKeysResponse | null> {
  const setup = getDevPortalSetupState();
  if (!setup.adminEnabled) {
    return null;
  }
  return portalFetch<ManagedApiKeysResponse>("/v1/admin/api-keys");
}

export async function getManagedApiKeysForWallet(
  walletAddress: string,
): Promise<ManagedApiKeysResponse | null> {
  const payload = await getManagedApiKeys();
  if (!payload) {
    return null;
  }
  const filtered = payload.items.filter(
    (item) =>
      item.owner_wallet_address &&
      item.owner_wallet_address.toLowerCase() === walletAddress.toLowerCase(),
  );
  return {
    ...payload,
    items: filtered,
    total: filtered.length,
  };
}

export async function createManagedApiKey(input: {
  appName: string;
  ownerLabel?: string;
  ownerWalletAddress?: string;
  environment: "testnet" | "mainnet" | "multi";
  notes?: string;
  scopes?: string[];
  planId?: string;
  planName?: string;
  planPriceYa?: number;
  planPriceOg?: string;
  planMaxKeys?: number;
  planQuotaMonthly?: number;
  planExpiresAt?: string;
  checkoutTxHash?: string;
  checkoutIntegrityHash?: string;
}): Promise<{ apiKey: string; item: ManagedApiKey }> {
  const payload = await portalFetch<{ api_key: string; item: ManagedApiKey }>("/v1/admin/api-keys", {
    method: "POST",
    body: JSON.stringify({
      app_name: input.appName,
      owner_label: input.ownerLabel || null,
      owner_wallet_address: input.ownerWalletAddress || null,
      environment: input.environment,
      notes: input.notes || null,
      scopes: input.scopes || [],
      plan_id: input.planId || null,
      plan_name: input.planName || null,
      plan_price_ya: input.planPriceYa ?? null,
      plan_price_og: input.planPriceOg ?? null,
      plan_max_keys: input.planMaxKeys ?? null,
      plan_quota_monthly: input.planQuotaMonthly ?? null,
      plan_expires_at: input.planExpiresAt || null,
      checkout_tx_hash: input.checkoutTxHash || null,
      checkout_integrity_hash: input.checkoutIntegrityHash || null,
    }),
  });
  return {
    apiKey: payload.api_key,
    item: payload.item,
  };
}

export async function verify0GCheckout(input: {
  walletAddress: string;
  planId: string;
  amountOg: string;
  txHash?: string;
}): Promise<CheckoutVerifyResponse> {
  return portalFetch<CheckoutVerifyResponse>("/v1/checkout/verify", {
    method: "POST",
    body: JSON.stringify({
      wallet_address: input.walletAddress,
      plan_id: input.planId,
      amount_og: input.amountOg,
      tx_hash: input.txHash || null,
      recent_request_count: 0,
    }),
  });
}

export async function revokeManagedApiKey(keyId: string): Promise<void> {
  await portalFetch(`/v1/admin/api-keys/${keyId}/revoke`, {
    method: "POST",
  });
}

export async function deleteManagedApiKey(keyId: string): Promise<void> {
  await portalFetch(`/v1/admin/api-keys/${keyId}`, {
    method: "DELETE",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Never";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function shortenHash(value: string | null | undefined, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail) {
    return value || "-";
  }
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
