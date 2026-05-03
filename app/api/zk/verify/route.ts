import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createZkReasoningProof } from "@/lib/server/zk-reasoning";
import {
  getLatestZkReasoningProof,
  getZkReasoningProofs,
} from "@/lib/server/runtime-store";
import {
  DEFAULT_WALLET_ADDRESS,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const decisionSchema = z
  .object({
    current_apy: z.number().optional(),
    optimized_apy: z.number().optional(),
    yield_increase: z.number().optional(),
    yield_increase_pct: z.number().optional(),
    recommended: z.string().optional(),
    confidence: z.number().optional(),
    executionSeconds: z.number().optional(),
    estimatedAnnualGain: z.number().optional(),
    totalPortfolio: z.number().optional(),
    reasoning: z.string().optional(),
  })
  .passthrough();

const portfolioSnapshotSchema = z
  .object({
    tokens: z.array(
      z.object({
        symbol: z.string(),
        amount: z.number(),
        valueUSD: z.number(),
      }),
    ),
    totalUSD: z.number(),
    currentAPY: z.number(),
    displayTotal: z.number().optional(),
    displayUnit: z.string().optional(),
    displayLabel: z.string().optional(),
  })
  .optional();

const zkVerifySchema = z.object({
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  walletAddress: z.string().optional(),
  agentId: z.string().min(1).optional(),
  prompt: z.string().optional(),
  reasoning: z.string().optional(),
  decision: decisionSchema.optional(),
  portfolioSnapshot: portfolioSnapshotSchema,
  verifier: z.string().optional(),
  proofType: z.string().optional(),
  summary: z.string().optional(),
  publicSignals: z.record(z.unknown()).optional(),
});

function resolveTestnetFirstNetwork(value: string | null | undefined): WalletNetworkKey {
  return value ? resolveWalletNetworkKey(value) : "testnet";
}

export async function GET(req: NextRequest) {
  const networkKey = resolveTestnetFirstNetwork(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const walletAddress =
    resolveWalletAddress(req.nextUrl.searchParams.get("wallet")) ?? undefined;
  const proofs = (await getZkReasoningProofs()).filter(
    (proof) =>
      proof.networkKey === networkKey &&
      (!walletAddress || proof.walletAddress?.toLowerCase() === walletAddress.toLowerCase()),
  );
  const latest =
    (await getLatestZkReasoningProof({ walletAddress, networkKey })) ??
    proofs[0] ??
    null;

  return NextResponse.json({
    success: true,
    data: {
      latest,
      proofs,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = zkVerifySchema.parse(await req.json());
  const networkKey = resolveTestnetFirstNetwork(body.networkKey);
  const walletAddress =
    resolveWalletAddress(body.walletAddress) ?? DEFAULT_WALLET_ADDRESS;
  const proof = await createZkReasoningProof({
    networkKey,
    walletAddress,
    agentId: body.agentId ?? walletAddress,
    prompt: body.prompt,
    reasoning: body.reasoning ?? body.decision?.reasoning,
    decision: body.decision,
    portfolioSnapshot: body.portfolioSnapshot,
    verifier: body.verifier,
    proofType: body.proofType,
    summary: body.summary,
    publicSignals: body.publicSignals,
  });

  return NextResponse.json({
    success: true,
    data: proof,
  });
}
