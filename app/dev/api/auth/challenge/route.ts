import { NextResponse } from "next/server";

import { createWalletChallenge } from "@/lib/dev-portal-auth";

export async function POST() {
  try {
    const challenge = await createWalletChallenge();
    return NextResponse.json({
      success: true,
      ...challenge,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to create portal challenge.",
      },
      { status: 500 },
    );
  }
}
