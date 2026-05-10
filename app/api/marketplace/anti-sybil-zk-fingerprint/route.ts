import { NextRequest, NextResponse } from "next/server";

import { runAntiSybilZkFingerprintEndpoint } from "@/lib/server/anti-sybil-api-store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    status: "mainnet-live",
    product: "Anti-Sybil + ZK Proof + Alibaba Fingerprinting",
    method: "POST",
    endpoint: "/api/marketplace/anti-sybil-zk-fingerprint",
    canonical_endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runAntiSybilZkFingerprintEndpoint(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
