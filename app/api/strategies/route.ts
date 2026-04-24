import { NextResponse } from "next/server";
import { buildStrategiesFromState } from "@/lib/backend-data";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import { getSettingsState, getStoredProofs } from "@/lib/server/runtime-store";

export async function GET() {
  const [portfolio, settings, proofs] = await Promise.all([
    getLivePortfolioSnapshot(),
    getSettingsState(),
    getStoredProofs(),
  ]);

  return NextResponse.json(buildStrategiesFromState(proofs, settings, portfolio));
}
