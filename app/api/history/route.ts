import { NextRequest, NextResponse } from "next/server";
import { buildHistoryFromProofs } from "@/lib/backend-data";
import { resolveProofHistoryForWallet } from "@/lib/server/proof-resolution";
import {
  DEFAULT_WALLET_ADDRESS,
  JUDGE_MODE_COOKIE_KEY,
  resolveWalletAddress,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
  resolveWalletNetworkKey,
} from "@/lib/wallet";

export async function GET(req: NextRequest) {
  const judgeMode = req.cookies.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
  const walletAddress =
    resolveWalletAddress(req.cookies.get(WALLET_COOKIE_KEY)?.value) ??
    (judgeMode ? DEFAULT_WALLET_ADDRESS : undefined);
  const networkKey = resolveWalletNetworkKey(
    req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const scopedProofs = walletAddress
    ? await resolveProofHistoryForWallet(walletAddress, networkKey)
    : [];

  return NextResponse.json(buildHistoryFromProofs(scopedProofs));
}
