import "server-only";

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function resolveEmbeddingBaseUrl() {
  const compatibleBaseUrl = process.env.ALIBABA_BASE_URL?.trim();
  if (!compatibleBaseUrl) {
    return null;
  }

  return `${trimTrailingSlash(compatibleBaseUrl)}/embeddings`;
}

export function hasAlibabaEmbeddingConfig() {
  return Boolean(process.env.ALIBABA_API_KEY?.trim() && resolveEmbeddingBaseUrl());
}

export async function generateAlibabaTextEmbedding(
  input: string,
) {
  const apiKey = process.env.ALIBABA_API_KEY?.trim();
  const endpoint = resolveEmbeddingBaseUrl();
  const model = process.env.ALIBABA_EMBEDDING_MODEL?.trim() || "text-embedding-v4";
  const dimension = Number.parseInt(
    process.env.ALIBABA_EMBEDDING_DIMENSION?.trim() || "512",
    10,
  );

  if (!apiKey || !endpoint) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      dimensions: Number.isFinite(dimension) ? dimension : 512,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Alibaba embedding request failed with HTTP ${response.status}: ${errorBody.slice(0, 240)}`,
    );
  }

  const payload = (await response.json()) as {
    data?: Array<{
      embedding?: number[];
    }>;
    output?: {
      embeddings?: Array<{
        embedding?: number[];
      }>;
    };
  };

  return payload.data?.[0]?.embedding ?? payload.output?.embeddings?.[0]?.embedding ?? null;
}
