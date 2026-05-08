export interface VeilSolverClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface VeilSolverRequest {
  intent: string;
  chainId?: number;
  contractAddress?: string;
  payload?: Record<string, unknown>;
}

export function createVeilSolverClient(options: VeilSolverClientOptions) {
  const baseUrl = options.baseUrl ?? "https://api.yieldboost.com";

  return {
    async solve(request: VeilSolverRequest) {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/agent/veilsolver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`VeilSolver proxy failed with ${response.status}`);
      }

      return response.json();
    },
  };
}
