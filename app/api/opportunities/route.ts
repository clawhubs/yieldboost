import { NextResponse } from "next/server";
import { getMockOpportunities } from "@/lib/backend-data";

export async function GET() {
  return NextResponse.json(getMockOpportunities());
}
