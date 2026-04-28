import { NextRequest } from "next/server";
import { buildNarrative, buildOptimizationSnapshot, portfolioSchema } from "@/lib/optimizations";
import { runTEEInference, isComputeConfigured } from "@/lib/server/og-compute";

export const runtime = "nodejs";
export const maxDuration = 60;

const encoder = new TextEncoder();

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

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    portfolio?: Record<string, number>;
    prompt?: string;
  };

  const portfolio = portfolioSchema.parse(body.portfolio);
  const prompt = body.prompt?.trim();

  const result = buildOptimizationSnapshot(portfolio, prompt);

  const headers = {
    "X-Optimization-Result": JSON.stringify(result),
    "Access-Control-Expose-Headers": "X-Optimization-Result",
  };

  let narrative = buildNarrative(result, prompt);
  let provider = "local-fallback";
  let teeAttestation = null;
  let computeStatus = "local-fallback";
  let computeError: string | null = null;
  const providerPrompt = `Portfolio total: $${result.totalPortfolio}. Current APY ${result.current_apy}%. Optimized APY ${result.optimized_apy}%. Recommended protocol: ${result.recommended}. User request: ${prompt ?? "Optimize for best yield with low risk."}`;

  if (!hasDetectedAssets(portfolio)) {
    const responseHeaders: Record<string, string> = {
      ...headers,
      "X-LLM-Provider": provider,
      "Access-Control-Expose-Headers": "X-Optimization-Result, X-LLM-Provider",
    };

    return new Response(createMockStream(narrative), {
      headers: responseHeaders,
    });
  }

  // Priority 1: Try 0G Compute with TEE
  if (isComputeConfigured()) {
    try {
      console.log("Attempting 0G Compute TEE inference...");
      const computeResult = await runTEEInference(providerPrompt);
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
    ...headers,
    "X-LLM-Provider": provider,
    "X-Compute-Status": computeStatus,
    "Access-Control-Expose-Headers": "X-Optimization-Result, X-LLM-Provider, X-Compute-Status",
  };

  if (computeError) {
    responseHeaders["X-Compute-Error"] = computeError.slice(0, 240);
    responseHeaders["Access-Control-Expose-Headers"] += ", X-Compute-Error";
  }

  // Include TEE attestation in headers if available
  if (teeAttestation) {
    responseHeaders["X-TEE-Attestation"] = JSON.stringify(teeAttestation);
    responseHeaders["Access-Control-Expose-Headers"] += ", X-TEE-Attestation";
  }

  return new Response(createMockStream(narrative), {
    headers: responseHeaders,
  });
}
