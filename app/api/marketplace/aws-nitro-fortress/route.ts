import { NextRequest, NextResponse } from "next/server";

import { runAwsNitroFortressEndpoint } from "@/lib/server/aws-nitro-fortress-store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    status: "mainnet-live",
    product: "AWS Nitro Fortress SDK",
    method: "POST",
    endpoint: "/api/marketplace/aws-nitro-fortress",
    canonical_endpoint: "/api/dev/store/aws-nitro-fortress",
    public_demo_endpoint: "/api/dev/store/aws-nitro-fortress/demo",
    fortress: {
      host: process.env.NITRO_FORTRESS_HOST?.trim() || "nitro.yieldboostai.xyz",
      ip: process.env.NITRO_FORTRESS_IP?.trim() || "54.179.135.133",
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runAwsNitroFortressEndpoint(req.headers, payload);
  return NextResponse.json(result.body, { status: result.statusCode });
}
