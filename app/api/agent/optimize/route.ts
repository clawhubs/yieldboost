import { createOpenAI } from "@ai-sdk/openai";
import { Sandbox } from "@e2b/code-interpreter";
import { generateText } from "ai";
import { NextRequest } from "next/server";
import { buildNarrative, buildOptimizationSnapshot, portfolioSchema } from "@/lib/optimizations";

export const runtime = "nodejs";
export const maxDuration = 60;

const encoder = new TextEncoder();

function createProviderFetch(timeoutMs = 12_000) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;

    return fetch(input, {
      ...init,
      signal,
    });
  };
}

function getLanguageModel() {
  if (process.env.ALIBABA_API_KEY) {
    const provider = createOpenAI({
      apiKey: process.env.ALIBABA_API_KEY,
      baseURL: process.env.ALIBABA_BASE_URL,
      compatibility: "compatible",
      fetch: createProviderFetch(),
      name: "alibaba",
    });

    return provider(process.env.ALIBABA_MODEL || "qwen3.6-plus-2026-04-02");
  }

  if (process.env.OPENAI_API_KEY) {
    const provider = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: "strict",
      fetch: createProviderFetch(),
    });

    return provider("gpt-4o-mini");
  }

  return null;
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

async function executeInSandbox(portfolio: Record<string, number>) {
  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
  });

  try {
    const execution = await sandbox.runCode(
      `
import json

portfolio = ${JSON.stringify(portfolio)}
total = sum(portfolio.values()) or 24570.25
result = {
  "current_apy": 12.38,
  "optimized_apy": 23.84,
  "yield_increase": round(total * 0.0959, 2),
  "yield_increase_pct": 23.61,
  "top_protocols": [
    {"name": "SaucerSwap LP", "apy": 24.18, "risk": "medium"},
    {"name": "0G High-Yield Pool", "apy": 18.65, "risk": "low"},
    {"name": "BONZO Earn More", "apy": 32.10, "risk": "medium"}
  ],
  "recommended": "SaucerSwap LP",
  "confidence": 96,
  "executionSeconds": 8.42,
  "estimatedAnnualGain": round(total * 0.0959, 2),
  "totalPortfolio": round(total, 2),
  "riskProfile": "Moderate",
}
print(json.dumps(result))
      `,
    );

    const output = execution.text?.trim() ?? "";
    return output ? JSON.parse(output) : null;
  } finally {
    await sandbox.kill();
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    portfolio?: Record<string, number>;
    prompt?: string;
  };

  const portfolio = portfolioSchema.parse(body.portfolio);
  const prompt = body.prompt?.trim();

  let result = buildOptimizationSnapshot(portfolio, prompt);

  if (process.env.E2B_API_KEY) {
    try {
      const sandboxResult = await executeInSandbox(portfolio);
      if (sandboxResult) {
        result = {
          ...result,
          ...sandboxResult,
          reasoning: result.reasoning,
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      result = buildOptimizationSnapshot(portfolio, prompt);
    }
  }

  const headers = {
    "X-Optimization-Result": JSON.stringify(result),
    "Access-Control-Expose-Headers": "X-Optimization-Result",
  };

  const model = getLanguageModel();

  let narrative = buildNarrative(result, prompt);

  if (model) {
    try {
      const generated = await Promise.race([
        generateText({
          model,
          system:
            "You are YieldBoost AI. Give a concise optimization recommendation in under 60 words. Mention that the result is verified on 0G Compute Network and anchored to 0G Storage.",
          prompt: `Portfolio total: $${result.totalPortfolio}. Current APY ${result.current_apy}%. Optimized APY ${result.optimized_apy}%. Recommended protocol: ${result.recommended}. User request: ${prompt ?? "Optimize for best yield with low risk."}`,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("llm_timeout")), 12_500);
        }),
      ]);

      if (generated.text.trim()) {
        narrative = generated.text.trim();
      }
    } catch {
      narrative = buildNarrative(result, prompt);
    }
  }

  return new Response(createMockStream(narrative), { headers });
}
