import { NextResponse } from "next/server";

import { getStoredProofs } from "@/lib/server/runtime-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCompactUsd(value: number) {
  if (value === 0) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString("en-US");
}

export async function GET() {
  const proofs = await getStoredProofs();
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const totalTvl = proofs.reduce((sum, p) => sum + (p.decision.totalPortfolio ?? 0), 0);
  const last24h = proofs.filter((p) => {
    const t = Date.parse(p.timestamp);
    return Number.isFinite(t) && t >= dayAgo;
  }).length;
  const protocols = new Set(proofs.map((p) => p.decision.recommended)).size;

  return NextResponse.json({
    hasData: proofs.length > 0,
    users: 1, // single-wallet demo; grows when multi-wallet lands
    computeJobs: proofs.length,
    tvl: totalTvl,
    recentJobs24h: last24h,
    protocols,
    formatted: {
      users: "1",
      computeJobs: formatCompactNumber(proofs.length),
      tvl: formatCompactUsd(totalTvl),
      recentJobs24h: formatCompactNumber(last24h),
      protocols: formatCompactNumber(protocols),
    },
  });
}
