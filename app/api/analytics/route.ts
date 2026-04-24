import { NextResponse } from "next/server";
import { buildAnalyticsFromProofs } from "@/lib/backend-data";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import { getStoredProofs } from "@/lib/server/runtime-store";

export async function GET() {
  const [portfolio, proofs] = await Promise.all([
    getLivePortfolioSnapshot(),
    getStoredProofs(),
  ]);

  return NextResponse.json(buildAnalyticsFromProofs(proofs, portfolio));
}
