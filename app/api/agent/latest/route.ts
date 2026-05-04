import { NextRequest, NextResponse } from "next/server";
import { createDecisionSummary } from "@/lib/backend-data";
import { type OptimizationResult } from "@/lib/optimizations";
import { resolveLatestProofForWallet } from "@/lib/server/proof-resolution";
import {
  getLatestAgentMemory,
  getLatestCrossAgentHandshake,
  getLatestGovernanceDecision,
  getLatestZkComplianceProof,
  getLatestZkReasoningProof,
} from "@/lib/server/runtime-store";
import {
  resolveWalletNetworkKey,
  resolveWalletAddress,
  sameWalletAddress,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function inferRiskBand(apy: number): "low" | "medium" | "high" {
  if (apy >= 28) return "high";
  if (apy >= 16) return "medium";
  return "low";
}

export async function GET(req: NextRequest) {
  const requestedWallet = resolveWalletAddress(
    req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
  );
  const networkKey = resolveWalletNetworkKey(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  if (!requestedWallet) {
    return NextResponse.json({ success: true, data: null });
  }

  const storedProof = await resolveLatestProofForWallet(requestedWallet, networkKey);
  const [
    latestAgentMemory,
    latestZkReasoning,
    latestGovernance,
    latestHandshake,
    latestZkCompliance,
  ] = await Promise.all([
    getLatestAgentMemory(requestedWallet, networkKey),
    getLatestZkReasoningProof({ walletAddress: requestedWallet, networkKey }),
    getLatestGovernanceDecision({ walletAddress: requestedWallet, networkKey }),
    getLatestCrossAgentHandshake({ walletAddress: requestedWallet, networkKey }),
    getLatestZkComplianceProof({ walletAddress: requestedWallet, networkKey }),
  ]);

  if (!storedProof) {
    return NextResponse.json({ success: true, data: null });
  }

  if (
    storedProof.walletAddress &&
    !sameWalletAddress(storedProof.walletAddress, requestedWallet)
  ) {
    return NextResponse.json({ success: true, data: null });
  }

  const result: OptimizationResult = {
    current_apy: storedProof.decision.current_apy,
    optimized_apy: storedProof.decision.optimized_apy,
    yield_increase: storedProof.decision.yield_increase ?? 0,
    yield_increase_pct: storedProof.decision.yield_increase_pct ?? 0,
    top_protocols: [
      {
        name: storedProof.decision.recommended,
        apy: storedProof.decision.optimized_apy,
        risk: inferRiskBand(storedProof.decision.optimized_apy),
      },
    ],
    recommended: storedProof.decision.recommended,
    confidence: storedProof.decision.confidence ?? 0,
    reasoning:
      storedProof.decision.reasoning ??
      createDecisionSummary(storedProof.decision),
    storageProof: storedProof.cid,
    txHash: storedProof.txHash,
    blockNumber: storedProof.blockNumber,
    timestamp: storedProof.timestamp,
    executionSeconds: storedProof.decision.executionSeconds ?? 8.42,
    estimatedAnnualGain:
      storedProof.decision.estimatedAnnualGain ??
      storedProof.decision.yield_increase ?? 0,
    totalPortfolio: storedProof.decision.totalPortfolio ?? 0,
    riskProfile: "Moderate",
    proofUrl: storedProof.explorerUrl,
    walletAddress: storedProof.walletAddress ?? requestedWallet,
    proofRegistryAddress: storedProof.proofRegistryAddress,
    proofRegistryTxHash: storedProof.proofRegistryTxHash,
    proofRegistryProofId: storedProof.proofRegistryProofId,
    proofRegistryExplorerUrl: storedProof.proofRegistryExplorerUrl,
    integrityAudit: storedProof.integrityAudit,
    zkCompliance: latestZkCompliance
      ? {
          proofId: latestZkCompliance.proofId,
          status: latestZkCompliance.status,
          policyCompliantPct: latestZkCompliance.policyCompliantPct,
          summary: latestZkCompliance.summary,
          explorerUrl: latestZkCompliance.explorerUrl,
          proofRegistryExplorerUrl: latestZkCompliance.proofRegistryExplorerUrl,
        }
      : undefined,
    integrityLayers: {
      sovereignMemory: Boolean(latestAgentMemory),
      zkReasoning: Boolean(latestZkReasoning),
      governance: Boolean(latestGovernance),
      neuralHandshake: Boolean(latestHandshake),
      zkCompliance: Boolean(latestZkCompliance),
    },
  };

  return NextResponse.json({
    success: true,
    data: result,
  });
}
