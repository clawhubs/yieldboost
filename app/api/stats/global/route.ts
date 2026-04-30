import { NextResponse } from "next/server";

import { DEFAULT_WALLET_ADDRESS } from "@/lib/wallet";
import { type StoredProofRecord } from "@/lib/backend-data";
import { resolveProofHistoryForWalletAcrossNetworks } from "@/lib/server/proof-resolution";
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

function parseTimestamp(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareProofRecency(left: StoredProofRecord, right: StoredProofRecord) {
  const timestampDelta = parseTimestamp(right.timestamp) - parseTimestamp(left.timestamp);
  if (timestampDelta !== 0) {
    return timestampDelta;
  }

  const blockDelta = (right.blockNumber ?? 0) - (left.blockNumber ?? 0);
  if (blockDelta !== 0) {
    return blockDelta;
  }

  return right.txHash.localeCompare(left.txHash);
}

function buildProofIdentity(proof: StoredProofRecord) {
  return (
    proof.proofRegistryTxHash ||
    proof.txHash ||
    proof.cid
  ).toLowerCase();
}

function mergeProofSets(...groups: StoredProofRecord[][]) {
  const merged = new Map<string, StoredProofRecord>();

  for (const group of groups) {
    for (const proof of group) {
      const key = buildProofIdentity(proof);
      const existing = merged.get(key);
      if (!existing || compareProofRecency(proof, existing) < 0) {
        merged.set(key, proof);
      }
    }
  }

  return [...merged.values()].sort(compareProofRecency);
}

export async function GET() {
  const [storedProofs, demoWalletProofs] = await Promise.all([
    getStoredProofs(),
    resolveProofHistoryForWalletAcrossNetworks(DEFAULT_WALLET_ADDRESS),
  ]);
  const proofs = mergeProofSets(storedProofs, demoWalletProofs);
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
