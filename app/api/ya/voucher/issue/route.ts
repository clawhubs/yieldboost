import { NextRequest, NextResponse } from "next/server";

import { issueYaVoucher } from "@/lib/server/ya-faucet";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    source?: "optimize" | "vault-seal";
    network?: string;
    walletAddress?: string;
    referenceId?: string;
  };

  if (body.source !== "optimize" && body.source !== "vault-seal") {
    return NextResponse.json({ success: false, error: "Invalid voucher source." }, { status: 422 });
  }

  const voucher = await issueYaVoucher({
    source: body.source,
    network: body.network || "mainnet",
    walletAddress: body.walletAddress,
    referenceId: body.referenceId,
  });

  if (!voucher) {
    return NextResponse.json({
      success: true,
      eligible: false,
      reason: "YA vouchers are only issued for 0G testnet actions.",
    });
  }

  return NextResponse.json({
    success: true,
    eligible: true,
    ...voucher,
  });
}
