import { NextRequest, NextResponse } from "next/server";
import { buildHistoryFromProofs } from "@/lib/backend-data";
import { getStoredProofs } from "@/lib/server/runtime-store";
import {
  getJudgeScopedWalletAddress,
  JUDGE_MODE_COOKIE_KEY,
  resolveWalletAddress,
  sameWalletAddress,
  WALLET_COOKIE_KEY,
} from "@/lib/wallet";

export async function GET(req: NextRequest) {
  const judgeMode = req.cookies.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
  const walletAddress = getJudgeScopedWalletAddress(
    resolveWalletAddress(req.cookies.get(WALLET_COOKIE_KEY)?.value),
    judgeMode,
  );
  const proofs = await getStoredProofs();
  const scopedProofs = walletAddress
    ? proofs.filter((proof) => sameWalletAddress(proof.walletAddress, walletAddress))
    : [];

  return NextResponse.json(buildHistoryFromProofs(scopedProofs));
}
