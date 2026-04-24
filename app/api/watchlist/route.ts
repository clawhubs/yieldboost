import { NextResponse } from "next/server";
import { getMockWatchlist } from "@/lib/backend-data";

export async function GET() {
  return NextResponse.json(getMockWatchlist());
}
