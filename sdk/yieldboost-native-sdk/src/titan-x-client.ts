export interface TitanXClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface TitanXRequest {
  payload: Record<string, unknown>;
}

export function createTitanXClient(options: TitanXClientOptions) {
  const baseUrl = options.baseUrl ?? "https://dev.yieldboostai.xyz";

  return {
    async run(request: TitanXRequest) {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/dev/store/military-grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`TITAN X request failed with ${response.status}`);
      }

      return response.json();
    },
  };
}
