import { NextRequest, NextResponse } from "next/server";
import { buildWatchlistFromState } from "@/lib/backend-data";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import {
  resolveProofHistoryForWallet,
  resolveProofHistoryForWalletAcrossNetworks,
} from "@/lib/server/proof-resolution";
import { getSettingsState } from "@/lib/server/runtime-store";
import {
  DEFAULT_WALLET_ADDRESS,
  JUDGE_MODE_COOKIE_KEY,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export async function GET(req: NextRequest) {
  const judgeMode = req.cookies.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
  const walletAddress = resolveWalletAddress(req.cookies.get(WALLET_COOKIE_KEY)?.value);
  const effectiveWalletAddress = walletAddress ?? DEFAULT_WALLET_ADDRESS;
  const networkKey = resolveWalletNetworkKey(
    req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const [settings, proofs] = await Promise.all([
    getSettingsState(),
    walletAddress
      ? resolveProofHistoryForWallet(walletAddress, networkKey)
      : resolveProofHistoryForWalletAcrossNetworks(DEFAULT_WALLET_ADDRESS),
  ]);
  const latestProof = proofs[0] ?? null;
  const portfolio = await getLivePortfolioSnapshot(
    effectiveWalletAddress,
    walletAddress ? networkKey : latestProof?.networkKey ?? networkKey,
    {
      latestProof,
      preferProofSnapshot: judgeMode || !walletAddress,
    },
  );

  return NextResponse.json(buildWatchlistFromState(proofs, settings, portfolio));
}
