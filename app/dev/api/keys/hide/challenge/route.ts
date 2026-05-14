import { NextRequest, NextResponse } from "next/server";

import { getPortalSession } from "@/lib/dev-portal-auth";
import { createHideKeyChallenge } from "@/lib/dev-portal-key-visibility";

export async function POST(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Connect your developer wallet before hiding an API key.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const walletAddress = String(body.walletAddress || "").trim();
    const keyId = String(body.keyId || "").trim();
    if (!walletAddress || walletAddress.toLowerCase() !== session.walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "The connected wallet must match the developer portal session.",
        },
        { status: 403 },
      );
    }
    if (!keyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Key ID is required.",
        },
        { status: 422 },
      );
    }

    const challenge = await createHideKeyChallenge({ walletAddress, keyId });
    return NextResponse.json({
      success: true,
      ...challenge,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to create key removal challenge.",
      },
      { status: 500 },
    );
  }
}
