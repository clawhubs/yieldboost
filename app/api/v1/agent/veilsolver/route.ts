import { NextRequest, NextResponse } from "next/server";
import { runVeilSolverSecureProxy } from "@/lib/server/veilsolver-secure-proxy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    status: "ready",
    product: "VeilSolver Secure Proxy",
    method: "POST",
    endpoint: "/api/v1/agent/veilsolver",
    api_key: {
      header: "Authorization: Bearer <key>",
      local_free_tier: process.env.YB_MARKETPLACE_FREE_TIER_KEY ?? "yb_free_tier_local",
    },
    sdk: {
      package: "veilsolver-sdk",
      version: "0.1.1",
      upstream_path: "/solve",
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runVeilSolverSecureProxy(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
