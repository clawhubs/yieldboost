import { NextRequest, NextResponse } from "next/server";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import {
  getJudgeScopedWalletAddress,
  JUDGE_MODE_COOKIE_KEY,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const requestedWallet = resolveWalletAddress(
    req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
  );
  const networkKey = resolveWalletNetworkKey(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const judgeMode = req.cookies.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
  const walletAddress = getJudgeScopedWalletAddress(requestedWallet, judgeMode);

  return NextResponse.json(
    await getLivePortfolioSnapshot(walletAddress, networkKey, {
      preferProofSnapshot: judgeMode,
    }),
  );
}
