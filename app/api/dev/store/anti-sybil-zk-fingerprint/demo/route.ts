import { NextRequest, NextResponse } from "next/server";

import { runAntiSybilDemoScreening } from "@/lib/server/anti-sybil-demo-screening";

export const runtime = "nodejs";
export const maxDuration = 30;

function normalizeString(value: unknown, maxLength = 160) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, maxLength)
    : undefined;
}

export async function GET() {
  return NextResponse.json({
    status: "mainnet-live",
    product: "Anti-Sybil + ZK Proof + Alibaba Fingerprinting Demo Lane",
    method: "POST",
    endpoint: "/api/dev/store/anti-sybil-zk-fingerprint/demo",
    canonical_sdk_endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
    demo_guards: [
      "one successful screen per IP / 24h",
      "one successful screen per wallet / 24h",
      "Alibaba behavior fingerprinting",
      "rolling anti-sybil throttle",
    ],
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const walletAddress = normalizeString(payload.walletAddress, 80);
  const sessionId = normalizeString(payload.sessionId, 120);
  const deviceLabel = normalizeString(payload.deviceLabel, 120);
  const intent = normalizeString(payload.intent, 180);

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json(
      {
        status: "error",
        error: "walletAddress must be a valid EVM address.",
      },
      { status: 422 },
    );
  }

  const screening = await runAntiSybilDemoScreening({
    headers: req.headers,
    walletAddress,
    sessionId,
    deviceLabel,
    intent,
  });

  if (!screening.allowed) {
    return NextResponse.json(
      {
        status: "blocked",
        request_id: screening.requestId,
        security: "Anti-Sybil Demo Blocked",
        network: "mainnet",
        screening: screening.screening,
        error: screening.error,
        canonical_sdk_endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
        public_demo_note:
          "This public demo lane is intentionally strict so repeated tests from the same network cannot make the anti-sybil screen look fake.",
      },
      { status: 429 },
    );
  }

  return NextResponse.json({
    status: "success",
    request_id: screening.requestId,
    security: "Anti-Sybil + ZK Verified",
    network: "mainnet",
    screening: screening.screening,
    anti_sybil: {
      wallet_bound: true,
      review_status: "verified",
      risk_level: "low",
    },
    data: {
      accepted: true,
      payload,
    },
    zk_proof: `0x${screening.screening.behavior_hash}`,
    zk_envelope: {
      status: "verified",
      proof_type: "anti-sybil-demo-envelope",
    },
    "0g_storage_url": `0g://yieldboost-api-store/anti-sybil-demo/${screening.requestId.slice(-16)}`,
    canonical_sdk_endpoint: "/api/dev/store/anti-sybil-zk-fingerprint",
    public_demo_note:
      "This public demo lane is live and intentionally strict: one successful screen per IP and per wallet for each rolling 24h window.",
  });
}
