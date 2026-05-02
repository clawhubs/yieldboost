import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAgentMemories,
  getLatestStoredProofForWallet,
} from "@/lib/server/runtime-store";
import { syncSovereignMemory } from "@/lib/server/sovereign-memory";
import {
  DEFAULT_WALLET_ADDRESS,
  getServerDefaultNetworkKey,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const memorySyncSchema = z.object({
  agentId: z.string().min(1).optional(),
  tokenId: z.string().min(1).optional(),
  walletAddress: z.string().optional(),
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  contextSummary: z.string().min(1).optional(),
  recentTask: z.string().min(1).optional(),
});

function resolveMainnetFirstNetwork(value: string | null | undefined): WalletNetworkKey {
  return value ? resolveWalletNetworkKey(value) : getServerDefaultNetworkKey();
}

export async function GET(req: NextRequest) {
  const networkKey = resolveMainnetFirstNetwork(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const agentId = req.nextUrl.searchParams.get("agentId") ?? undefined;
  const records = (await getAgentMemories()).filter(
    (record) =>
      (!agentId || record.agentId === agentId) &&
      (!record.networkKey || record.networkKey === networkKey),
  );

  return NextResponse.json({
    success: true,
    data: {
      latest: records[0] ?? null,
      records,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = memorySyncSchema.parse(await req.json());
  const networkKey = resolveMainnetFirstNetwork(body.networkKey);
  const walletAddress =
    resolveWalletAddress(body.walletAddress) ?? DEFAULT_WALLET_ADDRESS;
  const proof = await getLatestStoredProofForWallet(walletAddress, networkKey);
  const record = await syncSovereignMemory({
    agentId: body.agentId ?? walletAddress,
    tokenId: body.tokenId,
    walletAddress,
    networkKey,
    proof: proof ?? undefined,
    contextSummary: body.contextSummary,
    recentTask: body.recentTask,
  });

  return NextResponse.json({
    success: true,
    data: record,
  });
}
