import { NextResponse } from "next/server";
import { getMockPortfolio } from "@/lib/backend-data";

export async function GET() {
  return NextResponse.json(getMockPortfolio());
}
