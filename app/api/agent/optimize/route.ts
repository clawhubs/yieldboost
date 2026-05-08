import { NextRequest } from "next/server";
import {
  type OptimizationResult,
  buildNarrative,
  buildOptimizationSnapshot,
  portfolioSchema,
} from "@/lib/optimizations";
import {
  auditOptimizationDecision,
  type AuditablePortfolioSnapshot,
} from "@/lib/integrity-audit";
import { generateAlibabaTextEmbedding, hasAlibabaEmbeddingConfig } from "@/lib/server/alibaba-embeddings";
import { runTEEInference, isComputeConfigured } from "@/lib/server/og-compute";
import {
  buildOptimizationCacheEntry,
  buildOptimizationCacheKey,
  findExactOptimizationCacheEntry,
  findSimilarOptimizationCacheEntry,
  touchOptimizationCacheEntry,
  upsertOptimizationCacheEntry,
} from "@/lib/server/optimization-cache";
import { findHallucinationBlacklistMatch } from "@/lib/server/hallucination-blacklist";
import { compressOptimizationInput } from "@/lib/server/prompt-compression";
import {
  getServerDefaultNetworkKey,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_COOKIE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";

export const runtime = "nodejs";
export const maxDuration = 60;

const encoder = new TextEncoder();

function resolveMainnetFirstNetwork(value: string | null | undefined): WalletNetworkKey {
  return value ? resolveWalletNetworkKey(value) : getServerDefaultNetworkKey();
}

function createMockStream(text: string) {
  const parts = text.match(/.{1,18}/g) ?? [text];

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let index = 0;

      const push = () => {
        if (index >= parts.length) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`0:${JSON.stringify(parts[index])}\n`));
        index += 1;
        setTimeout(push, 55);
      };

      push();
    },
  });
}

function hasDetectedAssets(portfolio: Record<string, number>) {
  return Object.values(portfolio).some((value) => value > 0);
}

function buildPortfolioAuditSnapshot(
  portfolio: Record<string, number>,
  currentAPY: number,
): AuditablePortfolioSnapshot {
  const tokens = Object.entries(portfolio).map(([symbol, value]) => ({
    symbol,
    amount: value,
    valueUSD: value,
  }));

  return {
    tokens,
    totalUSD: tokens.reduce((sum, token) => sum + token.valueUSD, 0),
    currentAPY,
  };
}

function withIntegrityAudit(
  result: OptimizationResult,
  portfolio: Record<string, number>,
): OptimizationResult {
  return {
    ...result,
    integrityAudit: auditOptimizationDecision({
      decision: result,
      portfolioSnapshot: buildPortfolioAuditSnapshot(portfolio, result.current_apy),
    }),
  };
}

function withFreshResult(
  result: OptimizationResult,
  portfolio: Record<string, number>,
): OptimizationResult {
  return withIntegrityAudit({
    ...result,
    timestamp: new Date().toISOString(),
    executionSeconds: Math.max(0.38, Number((result.executionSeconds * 0.22).toFixed(2))),
  }, portfolio);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    portfolio?: Record<string, number>;
    prompt?: string;
    networkKey?: "testnet" | "mainnet";
  };

  const portfolio = portfolioSchema.parse(body.portfolio);
  const prompt = body.prompt?.trim();
  const networkKey = resolveMainnetFirstNetwork(body.networkKey);
  const walletAddress = resolveWalletAddress(
    req.cookies.get(WALLET_COOKIE_KEY)?.value,
  ) ?? undefined;
  const compressedInput = compressOptimizationInput(portfolio, prompt);
  const cacheKey = buildOptimizationCacheKey({
    walletAddress,
    networkKey,
    normalizedPrompt: compressedInput.normalizedPrompt,
    portfolioDigest: compressedInput.portfolioDigest,
  });
  const result = withIntegrityAudit(
    buildOptimizationSnapshot(portfolio, compressedInput.normalizedPrompt),
    portfolio,
  );

  const headers = {
    "X-Optimization-Result": JSON.stringify(result),
    "Access-Control-Expose-Headers": "X-Optimization-Result",
  };

  let narrative = buildNarrative(result, compressedInput.normalizedPrompt);
  let provider = "local-fallback";
  let teeAttestation = null;
  let computeStatus = "local-fallback";
  let computeError: string | null = null;
  let cacheStatus: "miss" | "exact-hit" | "embedding-hit" = "miss";
  let cacheSimilarity: number | null = null;
  const providerPrompt = compressedInput.compactPrompt;
  const requireTeeAttestation = process.env.YB_REQUIRE_TEE_ATTESTATION === "true";

  if (!hasDetectedAssets(portfolio)) {
    const responseHeaders: Record<string, string> = {
      ...headers,
      "X-LLM-Provider": provider,
      "X-Prompt-Compression": compressedInput.compactPrompt,
      "X-Cache-Status": "not-needed",
      "Access-Control-Expose-Headers":
        "X-Optimization-Result, X-LLM-Provider, X-Prompt-Compression, X-Cache-Status",
    };

    return new Response(createMockStream(narrative), {
      headers: responseHeaders,
    });
  }

  const blacklistMatch = await findHallucinationBlacklistMatch({
    networkKey,
    prompt: compressedInput.normalizedPrompt,
    portfolio,
  });

  if (blacklistMatch) {
    const blockedNarrative =
      `Integrity Auditor blocked this request before inference. ` +
      `It is ${Math.round(blacklistMatch.similarity * 100)}% similar to a hallucination entry stored as CID ${blacklistMatch.entry.cid}.`;
    const blockedResult: OptimizationResult = {
      ...result,
      optimized_apy: result.current_apy,
      yield_increase: 0,
      yield_increase_pct: 0,
      recommended: "Blocked by Hallucination Blacklist",
      confidence: 0,
      reasoning: blockedNarrative,
      timestamp: new Date().toISOString(),
      integrityAudit: {
        status: "REJECTED",
        score: Math.min(blacklistMatch.entry.auditScore, 20),
        reasons: [
          `Pre-inference blacklist match: ${blacklistMatch.entry.cid}`,
          ...blacklistMatch.entry.auditorReasoning,
        ],
        checkedAt: new Date().toISOString(),
        source: "deterministic-logic-guardrail",
      },
      proofStatus: "error",
      proofStatusDetail: "Skipped inference and proof write because a similar hallucination is already blacklisted.",
    };

    return new Response(createMockStream(blockedNarrative), {
      headers: {
        "X-Optimization-Result": JSON.stringify(blockedResult),
        "X-LLM-Provider": "blacklist-block",
        "X-Compute-Status": "pre-inference-blacklist-block",
        "X-Prompt-Compression": compressedInput.compactPrompt,
        "X-Cache-Status": "blacklist-hit",
        "X-Blacklist-Status": "hit",
        "X-Blacklist-CID": blacklistMatch.entry.cid,
        "X-Blacklist-Similarity": blacklistMatch.similarity.toFixed(4),
        "Access-Control-Expose-Headers":
          "X-Optimization-Result, X-LLM-Provider, X-Compute-Status, X-Prompt-Compression, X-Cache-Status, X-Blacklist-Status, X-Blacklist-CID, X-Blacklist-Similarity",
      },
    });
  }

  const exactCacheEntry = requireTeeAttestation
    ? null
    : await findExactOptimizationCacheEntry(cacheKey);
  if (exactCacheEntry) {
    const hydratedResult = withFreshResult(exactCacheEntry.result, portfolio);
    const responseHeaders: Record<string, string> = {
      "X-Optimization-Result": JSON.stringify(hydratedResult),
      "X-LLM-Provider": "semantic-cache",
      "X-Compute-Status": "exact-cache-hit",
      "X-Prompt-Compression": compressedInput.compactPrompt,
      "X-Cache-Status": "exact-hit",
      "Access-Control-Expose-Headers":
        "X-Optimization-Result, X-LLM-Provider, X-Compute-Status, X-Prompt-Compression, X-Cache-Status",
    };

    void touchOptimizationCacheEntry(exactCacheEntry);

    return new Response(createMockStream(exactCacheEntry.narrative), {
      headers: responseHeaders,
    });
  }

  let requestEmbedding: number[] | null = null;
  if (!requireTeeAttestation && hasAlibabaEmbeddingConfig()) {
    try {
      requestEmbedding = await generateAlibabaTextEmbedding(compressedInput.requestDocument);
    } catch (error) {
      console.warn("Alibaba embedding generation failed; continuing without embedding reuse", error);
    }
  }

  if (requestEmbedding?.length) {
    const similarEntry = await findSimilarOptimizationCacheEntry({
      walletAddress,
      networkKey,
      portfolioSignature: compressedInput.portfolioSignature,
      embedding: requestEmbedding,
    });

    if (similarEntry) {
      cacheStatus = "embedding-hit";
      cacheSimilarity = similarEntry.similarity;
      const hydratedResult = withFreshResult(similarEntry.entry.result, portfolio);
      const responseHeaders: Record<string, string> = {
        "X-Optimization-Result": JSON.stringify(hydratedResult),
        "X-LLM-Provider": "embedding-reuse",
        "X-Compute-Status": "embedding-cache-hit",
        "X-Prompt-Compression": compressedInput.compactPrompt,
        "X-Cache-Status": cacheStatus,
        "X-Cache-Similarity": similarEntry.similarity.toFixed(4),
        "Access-Control-Expose-Headers":
          "X-Optimization-Result, X-LLM-Provider, X-Compute-Status, X-Prompt-Compression, X-Cache-Status, X-Cache-Similarity",
      };

      void touchOptimizationCacheEntry(similarEntry.entry);

      return new Response(createMockStream(similarEntry.entry.narrative), {
        headers: responseHeaders,
      });
    }
  }

  // Priority 1: Try 0G Compute with TEE
  if (isComputeConfigured()) {
    try {
      console.log("Attempting 0G Compute TEE inference...");
      const computeResult = await runTEEInference(providerPrompt, networkKey);
      console.log("0G Compute result:", computeResult.provider, computeResult.text ? "has text" : "no text");
      computeStatus = computeResult.provider;
      computeError = computeResult.error ?? null;
      if (computeResult.text && computeResult.provider === "0g-tee") {
        narrative = computeResult.text;
        provider = "0g-tee";
        teeAttestation = computeResult.attestation;
        console.log("Using 0G Compute TEE for narrative");
      }
    } catch (error) {
      console.warn("0G Compute inference failed, using local deterministic fallback", error);
      computeStatus = "local-fallback";
      computeError = error instanceof Error ? error.message : String(error);
    }
  } else {
    console.log("0G Compute not configured, using local deterministic fallback");
    computeStatus = "not-configured";
    computeError = "0G Compute env is not fully configured";
  }

  const responseHeaders: Record<string, string> = {
    "X-Optimization-Result": JSON.stringify(result),
    "X-LLM-Provider": provider,
    "X-Compute-Status": computeStatus,
    "X-Prompt-Compression": compressedInput.compactPrompt,
    "X-Cache-Status": cacheStatus,
    "Access-Control-Expose-Headers":
      "X-Optimization-Result, X-LLM-Provider, X-Compute-Status, X-Prompt-Compression, X-Cache-Status",
  };

  if (computeError) {
    responseHeaders["X-Compute-Error"] = computeError.slice(0, 240);
    responseHeaders["Access-Control-Expose-Headers"] += ", X-Compute-Error";
  }

  if (cacheSimilarity !== null) {
    responseHeaders["X-Cache-Similarity"] = Number(cacheSimilarity).toFixed(4);
    responseHeaders["Access-Control-Expose-Headers"] += ", X-Cache-Similarity";
  }

  // Include TEE attestation in headers if available
  if (teeAttestation) {
    responseHeaders["X-TEE-Attestation"] = JSON.stringify(teeAttestation);
    responseHeaders["Access-Control-Expose-Headers"] += ", X-TEE-Attestation";
  }

  if (requireTeeAttestation && !teeAttestation?.isValid) {
    return new Response(
      createMockStream(
        computeError ??
          "TEE attestation is required but no verified 0G Compute attestation was produced.",
      ),
      {
        status: 503,
        headers: {
          ...responseHeaders,
          "X-Compute-Status": computeStatus,
          "X-Compute-Error":
            computeError ??
            "TEE attestation is required but no verified 0G Compute attestation was produced.",
          "Access-Control-Expose-Headers":
            `${responseHeaders["Access-Control-Expose-Headers"]}, X-Compute-Error`,
        },
      },
    );
  }

  const entry = buildOptimizationCacheEntry({
    cacheKey,
    walletAddress,
    networkKey,
    normalizedPrompt: compressedInput.normalizedPrompt,
    compactPrompt: compressedInput.compactPrompt,
    portfolioDigest: compressedInput.portfolioDigest,
    portfolioSignature: compressedInput.portfolioSignature,
    requestDocument: compressedInput.requestDocument,
    embedding: requestEmbedding,
    narrative,
    result,
    provider,
    computeStatus,
  });
  void upsertOptimizationCacheEntry(entry);

  return new Response(createMockStream(narrative), {
    headers: responseHeaders,
  });
}
