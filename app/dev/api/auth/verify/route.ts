import { NextRequest, NextResponse } from "next/server";

import { verifyWalletSignature } from "@/lib/dev-portal-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await verifyWalletSignature({
      walletAddress: String(body.walletAddress || ""),
      message: String(body.message || ""),
      signature: String(body.signature || ""),
    });
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Wallet login failed.",
      },
      { status: 401 },
    );
  }
}
