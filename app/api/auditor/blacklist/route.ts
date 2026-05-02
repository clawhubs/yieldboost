import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import {
  findHallucinationBlacklistMatch,
  recordHallucinationBlacklistEntry,
} from "@/lib/server/hallucination-blacklist";
import { getBlacklistEntries } from "@/lib/server/runtime-store";
import {
  getServerDefaultNetworkKey,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const blacklistPostSchema = z.object({
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  prompt: z.string().optional(),
  portfolio: z.record(z.string(), z.number()).optional(),
  decision: z.object({
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
  }).optional(),
  portfolioSnapshot: portfolioSnapshotSchema,
});

function resolveMainnetFirstNetwork(value: string | null | undefined): WalletNetworkKey {
  return value ? resolveWalletNetworkKey(value) : getServerDefaultNetworkKey();
}

export async function GET(req: NextRequest) {
  const networkKey = resolveMainnetFirstNetwork(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const entries = (await getBlacklistEntries()).filter(
    (entry) => !entry.networkKey || entry.networkKey === networkKey,
  );

  return NextResponse.json({
    success: true,
    data: {
      latest: entries[0] ?? null,
      entries,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = blacklistPostSchema.parse(await req.json());
  const networkKey = resolveMainnetFirstNetwork(body.networkKey);

  if (body.prompt || body.portfolio) {
    const match = await findHallucinationBlacklistMatch({
      networkKey,
      prompt: body.prompt,
      portfolio: body.portfolio,
    });

    if (!body.decision) {
      return NextResponse.json({
        success: true,
        data: {
          match,
        },
      });
    }
  }

  if (!body.decision) {
    return NextResponse.json(
      {
        success: false,
        error: "decision is required when creating a blacklist entry",
      },
      { status: 400 },
    );
  }

  const audit = auditOptimizationDecision({
    decision: body.decision,
    portfolioSnapshot: body.portfolioSnapshot,
  });

  if (audit.status !== "REJECTED") {
    return NextResponse.json(
      {
        success: false,
        error: "Only rejected auditor outputs are eligible for the hallucination blacklist.",
        integrityAudit: audit,
      },
      { status: 422 },
    );
  }

  const record = await recordHallucinationBlacklistEntry({
    networkKey,
    decision: body.decision,
    portfolioSnapshot: body.portfolioSnapshot,
    audit,
  });

  return NextResponse.json({
    success: true,
    data: record,
    integrityAudit: audit,
  });
}
