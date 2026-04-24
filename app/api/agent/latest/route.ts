import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import { createDecisionSummary } from "@/lib/backend-data";
import { type OptimizationResult } from "@/lib/optimizations";
import { getLatestStoredProof } from "@/lib/server/runtime-store";
import { resolveWalletAddress, WALLET_COOKIE_KEY } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function inferRiskBand(apy: number): "low" | "medium" | "high" {
  if (apy >= 28) return "high";
  if (apy >= 16) return "medium";
  return "low";
}

export async function GET(req: NextRequest) {
  const storedProof = await getLatestStoredProof();

  if (!storedProof) {
    return NextResponse.json({ success: true, data: null });
  }

  const walletFromCookie = resolveWalletAddress(req.cookies.get(WALLET_COOKIE_KEY)?.value);
  let walletAddress = storedProof.walletAddress ?? walletFromCookie;

  const rpcUrl = process.env.ZG_RPC_URL ?? process.env.NEXT_PUBLIC_ZG_RPC;
  if (rpcUrl && storedProof.txHash) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const tx = await provider.getTransaction(storedProof.txHash);
      if (typeof tx?.from === "string") {
        walletAddress = tx.from;
      }
    } catch {
      // Keep the signer address already stored with the proof.
    }
  }

  const result: OptimizationResult = {
    current_apy: storedProof.decision.current_apy,
    optimized_apy: storedProof.decision.optimized_apy,
    yield_increase: storedProof.decision.yield_increase,
    yield_increase_pct: storedProof.decision.yield_increase_pct,
    top_protocols: [
      {
        name: storedProof.decision.recommended,
        apy: storedProof.decision.optimized_apy,
        risk: inferRiskBand(storedProof.decision.optimized_apy),
      },
    ],
    recommended: storedProof.decision.recommended,
    confidence: storedProof.decision.confidence,
    reasoning:
      storedProof.decision.reasoning ??
      createDecisionSummary(storedProof.decision),
    storageProof: storedProof.cid,
    txHash: storedProof.txHash,
    timestamp: storedProof.timestamp,
    executionSeconds: storedProof.decision.executionSeconds ?? 8.42,
    estimatedAnnualGain:
      storedProof.decision.estimatedAnnualGain ??
      storedProof.decision.yield_increase,
    totalPortfolio: storedProof.decision.totalPortfolio ?? 0,
    riskProfile: "Moderate",
    proofUrl: storedProof.explorerUrl,
    walletAddress,
    proofRegistryAddress: storedProof.proofRegistryAddress,
    proofRegistryTxHash: storedProof.proofRegistryTxHash,
    proofRegistryProofId: storedProof.proofRegistryProofId,
    proofRegistryExplorerUrl: storedProof.proofRegistryExplorerUrl,
  };

  return NextResponse.json({
    success: true,
    data: result,
  });
}
