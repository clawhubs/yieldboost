import { NextRequest, NextResponse } from "next/server";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import {
  DEFAULT_WALLET_ADDRESS,
  JUDGE_MODE_COOKIE_KEY,
  getServerDefaultNetworkKey,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const walletAddress = resolveWalletAddress(
    req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
  );
  const requestedNetwork =
    req.nextUrl.searchParams.get("network") ??
    req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value;
  const networkKey = requestedNetwork
    ? resolveWalletNetworkKey(requestedNetwork)
    : getServerDefaultNetworkKey();
  const judgeMode = req.cookies.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
  const effectiveWalletAddress =
    walletAddress ?? (judgeMode ? DEFAULT_WALLET_ADDRESS : undefined);

  return NextResponse.json(
    await getLivePortfolioSnapshot(effectiveWalletAddress, networkKey, {
      preferProofSnapshot: judgeMode,
    }),
  );
}
