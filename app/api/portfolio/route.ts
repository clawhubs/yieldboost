import { NextRequest, NextResponse } from "next/server";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import { resolveWalletAddress, WALLET_COOKIE_KEY } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const walletAddress = resolveWalletAddress(
    req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
  );
  return NextResponse.json(await getLivePortfolioSnapshot(walletAddress));
}
