import { NextRequest, NextResponse } from "next/server";

import { getPortalSession } from "@/lib/dev-portal-auth";
import {
  hideDashboardKeyId,
  verifyHideKeySignature,
} from "@/lib/dev-portal-key-visibility";
import { getManagedApiKeysForWallet } from "@/lib/dev-portal";

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
    const message = String(body.message || "");
    const signature = String(body.signature || "");

    if (!walletAddress || walletAddress.toLowerCase() !== session.walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "The connected wallet must match the developer portal session.",
        },
        { status: 403 },
      );
    }

    await verifyHideKeySignature({
      walletAddress,
      keyId,
      message,
      signature,
    });

    const payload = await getManagedApiKeysForWallet(session.walletAddress);
    const item = payload?.items.find((candidate) => candidate.key_id === keyId);
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Managed API key was not found.",
        },
        { status: 404 },
      );
    }
    if (item.status !== "revoked") {
      return NextResponse.json(
        {
          success: false,
          error: "Only revoked API keys can be removed from this dashboard view.",
        },
        { status: 409 },
      );
    }

    await hideDashboardKeyId({
      walletAddress: session.walletAddress,
      keyId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to hide this API key from the dashboard.",
      },
      { status: 400 },
    );
  }
}
