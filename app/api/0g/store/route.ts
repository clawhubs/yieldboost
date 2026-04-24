import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createStoredProofFallback,
  type StoredDecisionPayload,
} from "@/lib/backend-data";
import { recordStoredProof } from "@/lib/server/runtime-store";

export const runtime = "nodejs";

const decisionSchema = z.object({
  current_apy: z.number(),
  optimized_apy: z.number(),
  yield_increase: z.number(),
  yield_increase_pct: z.number(),
  recommended: z.string(),
  confidence: z.number(),
  executionSeconds: z.number().optional(),
  estimatedAnnualGain: z.number().optional(),
  totalPortfolio: z.number().optional(),
  reasoning: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as { decision?: unknown };
  const decision = decisionSchema.parse(payload.decision) as StoredDecisionPayload;
  const storageUrl =
    process.env.ZG_STORAGE_URL ?? process.env.NEXT_PUBLIC_ZG_STORAGE;
  let proof = createStoredProofFallback(decision);

  if (storageUrl) {
    try {
      const response = await fetch(`${storageUrl}/v1/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...decision,
          appId: "yieldboost-ai",
          timestamp: proof.timestamp,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          cid?: string;
          rootHash?: string;
          txHash?: string;
        };

        proof = {
          ...proof,
          cid: data.cid ?? data.rootHash ?? proof.cid,
          txHash: data.txHash ?? proof.txHash,
          note: undefined,
        };
      }
    } catch {
      // Fall through to dev-safe payload.
    }
  }

  recordStoredProof(proof);

  return NextResponse.json({
    success: true,
    cid: proof.cid,
    txHash: proof.txHash,
    blockNumber: proof.blockNumber,
    timestamp: proof.timestamp,
    explorerUrl: proof.explorerUrl,
    note: proof.note,
  });
}
