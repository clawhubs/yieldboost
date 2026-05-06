import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";

import { claimYaVoucher } from "@/lib/server/ya-faucet";

export const runtime = "nodejs";

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    undefined
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    walletAddress?: string;
    voucher?: string;
  };
  const walletAddress = body.walletAddress?.trim() || "";
  const voucher = body.voucher?.trim() || "";

  if (!isAddress(walletAddress)) {
    return NextResponse.json({ success: false, error: "Enter a valid EVM wallet address." }, { status: 422 });
  }
  if (!voucher) {
    return NextResponse.json({ success: false, error: "Voucher is required." }, { status: 422 });
  }

  try {
    const claimed = await claimYaVoucher({
      walletAddress,
      voucher,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });
    return NextResponse.json({
      success: true,
      ...claimed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to claim voucher.",
      },
      { status: 400 },
    );
  }
}
