import { NextResponse } from "next/server";
import { getMockStrategies } from "@/lib/backend-data";

export async function GET() {
  return NextResponse.json(getMockStrategies());
}
