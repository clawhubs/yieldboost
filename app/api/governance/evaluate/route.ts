import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  evaluateAIGovernance,
  shouldBlockGovernanceDecision,
} from "@/lib/server/ai-governance";
import {
  getGovernanceDecisions,
  getLatestGovernanceDecision,
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

const governanceSchema = z.object({
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  walletAddress: z.string().optional(),
  agentId: z.string().min(1).optional(),
  evaluatedAction: z.string().optional(),
  decision: decisionSchema.optional(),
  portfolioSnapshot: portfolioSnapshotSchema,
  enforce: z.boolean().optional(),
  policy: z
    .object({
      maxOptimizedApy: z.number().optional(),
      maxYieldIncreasePct: z.number().optional(),
      minConfidenceForAutonomy: z.number().optional(),
      haltAboveRiskScore: z.number().optional(),
      throttleAboveRiskScore: z.number().optional(),
      warningAboveRiskScore: z.number().optional(),
    })
    .optional(),
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
  const decisions = (await getGovernanceDecisions()).filter(
    (decision) =>
      decision.networkKey === networkKey &&
      (!walletAddress || decision.walletAddress?.toLowerCase() === walletAddress.toLowerCase()),
  );
  const latest =
    (await getLatestGovernanceDecision({ walletAddress, networkKey })) ??
    decisions[0] ??
    null;

  return NextResponse.json({
    success: true,
    data: {
      latest,
      decisions,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = governanceSchema.parse(await req.json());
  const networkKey = resolveTestnetFirstNetwork(body.networkKey);
  const walletAddress =
    resolveWalletAddress(body.walletAddress) ?? DEFAULT_WALLET_ADDRESS;
  const decision = await evaluateAIGovernance({
    networkKey,
    walletAddress,
    agentId: body.agentId ?? walletAddress,
    evaluatedAction: body.evaluatedAction,
    decision: body.decision,
    portfolioSnapshot: body.portfolioSnapshot,
    policy: body.policy,
  });
  const blocked = shouldBlockGovernanceDecision(decision);

  return NextResponse.json(
    {
      success: !body.enforce || !blocked,
      data: decision,
      error:
        body.enforce && blocked
          ? "Governance kill switch halted this action."
          : undefined,
    },
    { status: body.enforce && blocked ? 423 : 200 },
  );
}
