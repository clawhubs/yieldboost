import { NextRequest, NextResponse } from "next/server";

import { screenAwsNitroDemoRequest } from "@/lib/server/aws-nitro-demo-screening";
import { executeAwsNitroFortressOperation } from "@/lib/server/aws-nitro-fortress-store";

export const runtime = "nodejs";
export const maxDuration = 30;

function normalizeString(value: unknown, limit: number) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, limit)
    : "";
}

export async function GET() {
  return NextResponse.json({
    status: "live-demo",
    product: "AWS Nitro Fortress SDK Demo Lane",
    method: "POST",
    endpoint: "/api/dev/store/aws-nitro-fortress/demo",
    canonical_sdk_endpoint: "/api/dev/store/aws-nitro-fortress",
    protections: [
      "Anti-sybil throttle",
      "Alibaba behavior fingerprinting",
      "Visitor-bound demo quota",
      "Cooldown on repeated attack patterns",
    ],
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const operation = normalizeString(payload.operation, 48) || "seal_secret";
  const secret = normalizeString(payload.secret, 600);
  const visitorId = normalizeString(payload.visitorId, 120);

  const screening = await screenAwsNitroDemoRequest({
    headers: req.headers,
    action: operation,
    secret,
    visitorId,
  });

  if (!screening.allowed) {
    return NextResponse.json(
      {
        status: "throttled",
        security: "Protected Perimeter Active",
        error: screening.error,
        screening: screening.screening,
        mode: "live-demo",
      },
      { status: 429 },
    );
  }

  const result = await executeAwsNitroFortressOperation({
    requestId: screening.requestId,
    network: "mainnet",
    operation,
    secret,
    operator: normalizeString(payload.operator, 120) || "public-demo-visitor",
    attackVector: normalizeString(payload.attackVector, 120) || null,
    sdkMode: "public-demo-lane",
    planLabel: "live-demo",
    keyPreview: null,
    screening: screening.screening,
  });

  return NextResponse.json(
    {
      ...result.body,
      mode: "live-demo",
      canonical_sdk_endpoint: "/api/dev/store/aws-nitro-fortress",
      public_demo_note:
        "This public lane is live but capped. Anti-sybil throttle and Alibaba fingerprinting protect the Nitro playground before the enclave path opens.",
    },
    { status: result.statusCode },
  );
}
