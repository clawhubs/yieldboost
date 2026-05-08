import { NextRequest, NextResponse } from "next/server";
import { runVeilSolverSecureProxy } from "@/lib/server/veilsolver-secure-proxy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runVeilSolverSecureProxy(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
