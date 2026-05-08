import { NextRequest, NextResponse } from "next/server";
import { runMilitaryGradeFullEndpoint } from "@/lib/server/military-grade-api-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runMilitaryGradeFullEndpoint(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
