import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getStoredProofs } from "@/lib/server/runtime-store";
import { getContractSignerPrivateKey } from "@/lib/server/network-credentials";
import {
  getYieldStrategyInftAddress,
  getServer0GNetworkConfig,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  sameWalletAddress,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const runtime = "nodejs";

function buildProofFallbackStrategies(
  walletAddress?: string,
) {
  return getStoredProofs().then((proofs) => {
    const scopedProofs = walletAddress
      ? proofs.filter((proof) => sameWalletAddress(proof.walletAddress, walletAddress))
      : proofs;

    return scopedProofs.map((proof, index) => ({
      tokenId: Number.parseInt(proof.proofRegistryProofId ?? "", 10) || index + 1,
      encryptedUri: proof.cid,
      contentHash: proof.txHash,
      apy: proof.decision.optimized_apy,
      currentApy: proof.decision.current_apy,
      yieldIncreasePct: proof.decision.yield_increase_pct ?? 0,
      estimatedAnnualGain:
        proof.decision.estimatedAnnualGain ?? proof.decision.yield_increase ?? 0,
      confidence: proof.decision.confidence ?? 0,
      recommended: proof.decision.recommended,
      reasoning: proof.decision.reasoning,
      storageProof: proof.cid,
      txHash: proof.txHash,
      proofUrl: proof.explorerUrl,
      proofRegistryProofId: proof.proofRegistryProofId,
      proofRegistryTxHash: proof.proofRegistryTxHash,
      proofRegistryExplorerUrl: proof.proofRegistryExplorerUrl,
      timestamp: proof.timestamp,
      creator: proof.walletAddress ?? walletAddress ?? "0x0000000000000000000000000000000000000000",
      verified: Boolean(proof.proofRegistryTxHash || proof.txHash),
      owner: proof.walletAddress ?? walletAddress ?? "0x0000000000000000000000000000000000000000",
      sourceLabel: "Proof-backed optimization",
    }));
  });
}

/**
 * List all minted Strategy NFTs
 */
export async function GET(req: NextRequest) {
  try {
    const walletAddress = resolveWalletAddress(
      req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
    );
    const networkKey = resolveWalletNetworkKey(
      req.nextUrl.searchParams.get("network") ??
        req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
    );
    const networkConfig = getServer0GNetworkConfig(networkKey);

    // Get contract address from env
    const inftAddress = getYieldStrategyInftAddress(networkKey);
    const privateKey = getContractSignerPrivateKey(networkKey);

    if (!inftAddress || !privateKey) {
      const strategies = await buildProofFallbackStrategies(walletAddress ?? undefined);
      return NextResponse.json(
        {
          success: true,
          totalSupply: strategies.length,
          strategies,
          source: "proof_fallback",
          message:
            strategies.length > 0
              ? "Showing proof-backed agents from your latest optimization history."
              : "No proof-backed agents found for the connected wallet yet.",
        },
      );
    }

    if (!networkConfig.rpcUrl) {
      const strategies = await buildProofFallbackStrategies(walletAddress ?? undefined);
      return NextResponse.json(
        {
          success: true,
          totalSupply: strategies.length,
          strategies,
          source: "proof_fallback",
          message: `${networkConfig.label} RPC is not configured, so the gallery is using proof-backed history instead.`,
        },
      );
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Contract ABI
    const inftAbi = [
      "function totalSupply() external view returns (uint256)",
      "function getStrategy(uint256 tokenId) external view returns (string encryptedUri, bytes32 contentHash, uint256 apy, uint256 timestamp, address creator, bool verified)",
      "function isAuthorized(uint256 tokenId, address user) external view returns (bool)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
    ];

    const inftContract = new ethers.Contract(inftAddress, inftAbi, wallet);

    // Get total supply
    const totalSupply = await inftContract.totalSupply();
    const supplyNumber = Number(totalSupply);

    // Fetch all strategies
    const strategies = [];
    for (let i = 1; i <= supplyNumber; i++) {
      try {
        const strategy = await inftContract.getStrategy(i);
        const owner = await inftContract.ownerOf(i);
        
        strategies.push({
          tokenId: i,
          encryptedUri: strategy.encryptedUri,
          contentHash: strategy.contentHash,
          apy: Number(strategy.apy) / 100, // Convert from basis points
          currentApy: null,
          yieldIncreasePct: null,
          estimatedAnnualGain: null,
          confidence: null,
          recommended: null,
          reasoning: null,
          storageProof: null,
          txHash: null,
          proofUrl: null,
          proofRegistryProofId: null,
          proofRegistryTxHash: null,
          proofRegistryExplorerUrl: null,
          timestamp: new Date(Number(strategy.timestamp) * 1000).toISOString(),
          creator: strategy.creator,
          verified: strategy.verified,
          owner,
          sourceLabel: "YieldStrategy NFT",
        });
      } catch (error) {
        console.error(`Error fetching strategy ${i}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalSupply: supplyNumber,
      strategies,
      source: "contract",
    });
  } catch (error) {
    console.error("List error:", error);
    const walletAddress = resolveWalletAddress(
      req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
    );
    const strategies = await buildProofFallbackStrategies(walletAddress ?? undefined);

    return NextResponse.json(
      {
        success: true,
        totalSupply: strategies.length,
        strategies,
        source: "proof_fallback",
        message:
          strategies.length > 0
            ? "Contract lookup failed, so the gallery is showing proof-backed agents from local history."
            : error instanceof Error
              ? error.message
              : "Unknown error",
      },
    );
  }
}
