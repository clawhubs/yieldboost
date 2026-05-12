import { NextRequest, NextResponse } from "next/server";
import { runVeilSolverSecureProxy } from "@/lib/server/veilsolver-secure-proxy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    status: "partner-wrapped",
    product: "VeilSolver Secure Proxy",
    method: "POST",
    endpoint: "/api/dev/store/veilsolver",
    api_key: {
      header: "Authorization: Bearer <key>",
      local_free_tier: process.env.YB_MARKETPLACE_FREE_TIER_KEY ?? "yb_free_tier_local",
    },
    sdk: {
      package: "veilsolver-sdk",
      version: "0.1.1",
      upstream_path: "/solve",
      note: "VeilSolver is a partner integration example. YieldBoost wraps the SDK encrypted intents with isolated execution and a ZK envelope; the standalone YieldBoost 10-layer TITAN X PROTOCOL is independent.",
    },
    sample_payload: {
      action: "SWAP",
      tokenIn: "0x0000000000000000000000000000000000000000",
      tokenOut: "0x0000000000000000000000000000000000000000",
      amountIn: "1.0",
      decimalsIn: 18,
      maxSlippageBps: 50,
      userAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
      chainId: 16602,
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runVeilSolverSecureProxy(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
