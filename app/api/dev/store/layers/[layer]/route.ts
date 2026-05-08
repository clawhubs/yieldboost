import { NextRequest, NextResponse } from "next/server";
import { runMilitaryGradeLayerEndpoint } from "@/lib/server/military-grade-api-store";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ layer: string }> },
) {
  const { layer } = await params;
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runMilitaryGradeLayerEndpoint(req.headers, layer, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
