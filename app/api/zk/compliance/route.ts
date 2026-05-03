import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAIGovernance } from "@/lib/server/ai-governance";
import { resolveLatestProofForWallet } from "@/lib/server/proof-resolution";
import {
  getLatestZkComplianceProof,
  getZkComplianceProofs,
} from "@/lib/server/runtime-store";
import { createZkComplianceProof } from "@/lib/server/zk-compliance";
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

const decisionSchema = z.object({
  current_apy: z.number(),
  optimized_apy: z.number(),
  yield_increase: z.number().optional(),
  yield_increase_pct: z.number().optional(),
  recommended: z.string(),
  confidence: z.number().optional(),
  executionSeconds: z.number().optional(),
  estimatedAnnualGain: z.number().optional(),
  totalPortfolio: z.number().optional(),
  reasoning: z.string().optional(),
});

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

const complianceSchema = z.object({
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  walletAddress: z.string().optional(),
  agentId: z.string().min(1).optional(),
  decision: decisionSchema.optional(),
  portfolioSnapshot: portfolioSnapshotSchema,
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
  const proofs = (await getZkComplianceProofs()).filter(
    (proof) =>
      proof.networkKey === networkKey &&
      (!walletAddress || proof.walletAddress?.toLowerCase() === walletAddress.toLowerCase()),
  );
  const latest =
    (await getLatestZkComplianceProof({ walletAddress, networkKey })) ??
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
  const body = complianceSchema.parse(await req.json());
  const networkKey = resolveTestnetFirstNetwork(body.networkKey);
  const walletAddress =
    resolveWalletAddress(body.walletAddress) ?? DEFAULT_WALLET_ADDRESS;
  const latestProof = await resolveLatestProofForWallet(walletAddress, networkKey);

  const decision = body.decision ?? latestProof?.decision;
  if (!decision) {
    return NextResponse.json(
      {
        success: false,
        error: "No strategy decision is available to prove.",
      },
      { status: 422 },
    );
  }

  const portfolioSnapshot = body.portfolioSnapshot ?? latestProof?.portfolioSnapshot;
  const governanceDecision = await evaluateAIGovernance({
    networkKey,
    walletAddress,
    agentId: body.agentId ?? walletAddress,
    evaluatedAction: "zk-compliance-proof",
    decision,
    portfolioSnapshot,
  });
  const proof = await createZkComplianceProof({
    networkKey,
    walletAddress,
    agentId: body.agentId ?? walletAddress,
    decision,
    portfolioSnapshot,
    governanceDecision,
    proof: latestProof,
  });

  return NextResponse.json({
    success: true,
    data: proof,
  });
}
