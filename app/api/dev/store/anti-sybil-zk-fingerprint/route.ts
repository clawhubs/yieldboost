import { NextRequest, NextResponse } from "next/server";

import { runAntiSybilZkFingerprintEndpoint } from "@/lib/server/anti-sybil-api-store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    status: "mainnet-live",
    product: "Anti-Sybil + ZK Proof + Alibaba Fingerprinting",
    method: "POST",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
    api_key: {
      header: "Authorization: Bearer <key>",
      local_free_tier: process.env.YB_MARKETPLACE_FREE_TIER_KEY ?? "yb_free_tier_local",
    },
    sample_payload: {
      requestId: "anti-sybil-demo-001",
      walletAddress: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
      network: "mainnet",
      intent: "screen a wallet before issuing a high-value API key",
      sessionId: "sess_live_01",
      deviceLabel: "chrome-macbook-pro",
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runAntiSybilZkFingerprintEndpoint(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
