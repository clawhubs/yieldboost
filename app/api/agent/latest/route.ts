import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import { createDecisionSummary } from "@/lib/backend-data";
import { type OptimizationResult } from "@/lib/optimizations";
import { getLatestStoredProof } from "@/lib/server/runtime-store";
import {
  getServer0GNetworkConfig,
  resolveWalletAddress,
  resolveWalletNetworkKey,
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
  if (!requestedWallet) {
    return NextResponse.json({ success: true, data: null });
  }

  const storedProof = await getLatestStoredProof();

  if (!storedProof) {
    return NextResponse.json({ success: true, data: null });
  }

  if (storedProof.walletAddress && storedProof.walletAddress !== requestedWallet) {
    return NextResponse.json({ success: true, data: null });
  }

  let walletAddress = storedProof.walletAddress ?? requestedWallet;

  const networkKey = resolveWalletNetworkKey(
    storedProof.networkKey ??
      req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const rpcUrl = getServer0GNetworkConfig(networkKey).rpcUrl;
  if (rpcUrl && storedProof.txHash) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const tx = await provider.getTransaction(storedProof.txHash);
      if (typeof tx?.from === "string" && tx.from.length > 0) {
        walletAddress = tx.from;
      }
    } catch {
      // Keep the signer address already stored with the proof.
    }
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
    timestamp: storedProof.timestamp,
    executionSeconds: storedProof.decision.executionSeconds ?? 8.42,
    estimatedAnnualGain:
      storedProof.decision.estimatedAnnualGain ??
      storedProof.decision.yield_increase ?? 0,
    totalPortfolio: storedProof.decision.totalPortfolio ?? 0,
    riskProfile: "Moderate",
    proofUrl: storedProof.explorerUrl,
    walletAddress: walletAddress ?? undefined,
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
