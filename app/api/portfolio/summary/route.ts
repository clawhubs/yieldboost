import { NextResponse } from "next/server";
import { getMockPortfolioSummary } from "@/lib/backend-data";

export async function GET() {
  return NextResponse.json(getMockPortfolioSummary());
}
