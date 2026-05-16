export interface MarketplaceSdkClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface MarketplaceLayerRequest {
  payload: Record<string, unknown>;
}

export async function postMarketplaceRequest(
  options: MarketplaceSdkClientOptions,
  endpoint: string,
  request: MarketplaceLayerRequest,
) {
  const baseUrl = options.baseUrl ?? "https://dev.yieldboostai.xyz";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Marketplace request failed with ${response.status}`);
  }

  return response.json();
}
