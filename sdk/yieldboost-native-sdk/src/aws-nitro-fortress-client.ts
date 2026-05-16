export interface AwsNitroFortressClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface AwsNitroFortressRequest {
  requestId: string;
  network?: "mainnet" | "testnet";
  operation: string;
  secret?: string;
  operator?: string;
  sdkMode?: string;
}

export function createAwsNitroFortressClient(options: AwsNitroFortressClientOptions) {
  const baseUrl = options.baseUrl ?? "https://dev.yieldboostai.xyz";

  return {
    async run(request: AwsNitroFortressRequest) {
      const response = await fetch(
        `${baseUrl.replace(/\/$/, "")}/api/dev/store/aws-nitro-fortress`,
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
        throw new Error(`AWS Nitro Fortress request failed with ${response.status}`);
      }

      return response.json();
    },
  };
}
