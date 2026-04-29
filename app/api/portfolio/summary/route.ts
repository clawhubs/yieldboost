import { NextRequest, NextResponse } from "next/server";
import { buildPortfolioSummaryFromPortfolio } from "@/lib/backend-data";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import { getStoredProofs } from "@/lib/server/runtime-store";
import {
  getJudgeScopedWalletAddress,
  JUDGE_MODE_COOKIE_KEY,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  sameWalletAddress,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export async function GET(req: NextRequest) {
  const judgeMode = req.cookies.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
  const walletAddress = getJudgeScopedWalletAddress(
    resolveWalletAddress(req.cookies.get(WALLET_COOKIE_KEY)?.value),
    judgeMode,
  );
  const networkKey = resolveWalletNetworkKey(
    req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const [portfolio, proofs] = await Promise.all([
    getLivePortfolioSnapshot(walletAddress, networkKey, {
      preferProofSnapshot: judgeMode,
    }),
    getStoredProofs(),
  ]);

  const scopedProofs = walletAddress
    ? proofs.filter((proof) => sameWalletAddress(proof.walletAddress, walletAddress))
    : [];

  return NextResponse.json(buildPortfolioSummaryFromPortfolio(portfolio, scopedProofs));
}
