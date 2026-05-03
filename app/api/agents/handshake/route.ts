import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCrossAgentHandshake } from "@/lib/server/cross-agent-handshake";
import {
  getCrossAgentHandshakes,
  getLatestCrossAgentHandshake,
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

const transcriptItemSchema = z.object({
  role: z.enum(["requester", "responder", "system"]),
  content: z.string(),
});

const handshakeSchema = z.object({
  networkKey: z.enum(["testnet", "mainnet"]).optional(),
  walletAddress: z.string().optional(),
  requestingAgent: z.string().min(1).optional(),
  respondingAgent: z.string().min(1).optional(),
  handshakeType: z.string().optional(),
  skillPurpose: z.string().optional(),
  transcript: z.array(transcriptItemSchema).optional(),
  summary: z.string().optional(),
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
  const handshakes = (await getCrossAgentHandshakes()).filter(
    (handshake) =>
      handshake.networkKey === networkKey &&
      (!walletAddress || handshake.walletAddress?.toLowerCase() === walletAddress.toLowerCase()),
  );
  const latest =
    (await getLatestCrossAgentHandshake({ walletAddress, networkKey })) ??
    handshakes[0] ??
    null;

  return NextResponse.json({
    success: true,
    data: {
      latest,
      handshakes,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = handshakeSchema.parse(await req.json());
  const networkKey = resolveTestnetFirstNetwork(body.networkKey);
  const walletAddress =
    resolveWalletAddress(body.walletAddress) ?? DEFAULT_WALLET_ADDRESS;
  const handshake = await createCrossAgentHandshake({
    networkKey,
    walletAddress,
    requestingAgent: body.requestingAgent ?? "YieldBoost Optimizer Agent",
    respondingAgent: body.respondingAgent ?? "Integrity Auditor Agent",
    handshakeType: body.handshakeType,
    skillPurpose: body.skillPurpose ?? "Cross-check yield reasoning before proof storage",
    transcript: body.transcript,
    summary: body.summary,
  });

  return NextResponse.json({
    success: true,
    data: handshake,
  });
}
