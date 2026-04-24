import { NextResponse } from "next/server";
import { buildHistoryFromProofs } from "@/lib/backend-data";
import { getStoredProofs } from "@/lib/server/runtime-store";

export async function GET() {
  return NextResponse.json(buildHistoryFromProofs(getStoredProofs()));
}
