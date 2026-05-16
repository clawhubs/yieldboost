export interface AntiSybilFingerprintClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface AntiSybilFingerprintRequest {
  requestId: string;
  walletAddress: string;
  network?: "mainnet" | "testnet";
  intent: string;
  sessionId?: string;
  deviceLabel?: string;
}

export function createAntiSybilFingerprintClient(
  options: AntiSybilFingerprintClientOptions,
) {
  const baseUrl = options.baseUrl ?? "https://dev.yieldboostai.xyz";

  return {
    async screen(request: AntiSybilFingerprintRequest) {
      const response = await fetch(
        `${baseUrl.replace(/\/$/, "")}/api/dev/store/anti-sybil-zk-fingerprint`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        throw new Error(`Anti-Sybil + ZK + Alibaba request failed with ${response.status}`);
      }

      return response.json();
    },
  };
}
