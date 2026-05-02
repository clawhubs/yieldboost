import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getStressTestReports,
} from "@/lib/server/runtime-store";
import { runMultiverseStressTest } from "@/lib/server/multiverse-stress-test";
import {
  DEFAULT_WALLET_ADDRESS,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const historicalPointSchema = z.object({
  timestamp: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

const stressRunSchema = z.object({
  agentId: z.string().min(1).optional(),
  tokenId: z.string().min(1).optional(),
  walletAddress: z.string().optional(),
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  datasetCid: z.string().min(1).optional(),
  historicalSlice: z.array(historicalPointSchema).optional(),
});

export async function GET(req: NextRequest) {
  const networkKey = resolveWalletNetworkKey(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const agentId = req.nextUrl.searchParams.get("agentId") ?? undefined;
  const reports = (await getStressTestReports()).filter(
    (report) =>
      (!agentId || report.agentId === agentId) &&
      (!report.networkKey || report.networkKey === networkKey),
  );

  return NextResponse.json({
    success: true,
    data: {
      latest: reports[0] ?? null,
      reports,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = stressRunSchema.parse(await req.json());
  const networkKey = resolveWalletNetworkKey(
    body.networkKey ?? req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const walletAddress =
    resolveWalletAddress(body.walletAddress) ?? DEFAULT_WALLET_ADDRESS;
  const report = await runMultiverseStressTest({
    agentId: body.agentId ?? walletAddress,
    tokenId: body.tokenId,
    walletAddress,
    networkKey,
    datasetCid: body.datasetCid,
    historicalSlice: body.historicalSlice,
  });

  return NextResponse.json({
    success: true,
    data: report,
  });
}
