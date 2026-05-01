import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getStoredProofs } from "@/lib/server/runtime-store";
import { getContractSignerPrivateKey } from "@/lib/server/network-credentials";
import { decryptStrategy } from "@/lib/server/encryption";
import {
  getYieldStrategyInftAddress,
  getServerDefaultNetworkKey,
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
  networkKey?: string,
) {
  return getStoredProofs().then((proofs) => {
    const scopedProofs = walletAddress
      ? proofs.filter((proof) => sameWalletAddress(proof.walletAddress, walletAddress))
      : proofs;

    const networkScopedProofs = networkKey
      ? scopedProofs.filter((proof) => proof.networkKey === networkKey)
      : scopedProofs;

    return networkScopedProofs.map((proof, index) => ({
      tokenId: Number.parseInt(proof.proofRegistryProofId ?? "", 10) || index + 1,
      networkKey: proof.networkKey,
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

async function resolveTransactionBlockNumber(
  provider: ethers.JsonRpcProvider,
  txHash?: string | null,
) {
  if (!txHash) return null;

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt?.blockNumber ?? null;
  } catch {
    return null;
  }
}

/**
 * List all minted Strategy NFTs
 */
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");
    const walletAddress =
      scope === "all"
        ? null
        : resolveWalletAddress(
            req.nextUrl.searchParams.get("wallet") ??
              req.cookies.get(WALLET_COOKIE_KEY)?.value,
          );
    const requestedNetwork =
      req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value;
    const networkKey = requestedNetwork
      ? resolveWalletNetworkKey(requestedNetwork)
      : getServerDefaultNetworkKey();
    const networkConfig = getServer0GNetworkConfig(networkKey);

    // Get contract address from env
    const inftAddress = getYieldStrategyInftAddress(networkKey);
    const privateKey = getContractSignerPrivateKey(networkKey);

    if (!inftAddress || !privateKey) {
      const strategies = await buildProofFallbackStrategies(walletAddress ?? undefined, networkKey);
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
      const strategies = await buildProofFallbackStrategies(walletAddress ?? undefined, networkKey);
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
      "function getStrategy(uint256 tokenId) external view returns (tuple(string encryptedUri, bytes32 contentHash, uint256 apy, uint256 timestamp, address creator, bool verified))",
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
        if (walletAddress && !sameWalletAddress(owner, walletAddress)) {
          continue;
        }

        let decryptedPayload:
          | {
              decision?: {
                current_apy?: number;
                optimized_apy?: number;
                yield_increase_pct?: number;
                estimatedAnnualGain?: number;
                confidence?: number;
                recommended?: string;
                reasoning?: string;
              };
              performance?: {
                roi?: number | null;
                accuracy?: number | null;
                currentApy?: number;
                optimizedApy?: number;
                estimatedAnnualGain?: number | null;
              };
              storageCid?: string;
              txHash?: string;
            }
          | null = null;

        try {
          decryptedPayload = decryptStrategy(strategy.encryptedUri) as {
            decision?: {
              current_apy?: number;
              optimized_apy?: number;
              yield_increase_pct?: number;
              estimatedAnnualGain?: number;
              confidence?: number;
              recommended?: string;
              reasoning?: string;
            };
            performance?: {
              roi?: number | null;
              accuracy?: number | null;
              currentApy?: number;
              optimizedApy?: number;
              estimatedAnnualGain?: number | null;
            };
            storageCid?: string;
            txHash?: string;
          };
        } catch {
          decryptedPayload = null;
        }
        
        strategies.push({
          tokenId: i,
          networkKey,
          encryptedUri: strategy.encryptedUri,
          contentHash: strategy.contentHash,
          apy: Number(strategy.apy) / 100, // Convert from basis points
          currentApy:
            decryptedPayload?.decision?.current_apy ??
            decryptedPayload?.performance?.currentApy ??
            null,
          yieldIncreasePct:
            decryptedPayload?.decision?.yield_increase_pct ??
            decryptedPayload?.performance?.roi ??
            null,
          estimatedAnnualGain:
            decryptedPayload?.decision?.estimatedAnnualGain ??
            decryptedPayload?.performance?.estimatedAnnualGain ??
            null,
          confidence:
            decryptedPayload?.decision?.confidence ??
            decryptedPayload?.performance?.accuracy ??
            null,
          recommended: decryptedPayload?.decision?.recommended ?? null,
          reasoning: decryptedPayload?.decision?.reasoning ?? null,
          storageProof: decryptedPayload?.storageCid ?? null,
          txHash: decryptedPayload?.txHash ?? null,
          blockNumber: await resolveTransactionBlockNumber(
            provider,
            decryptedPayload?.txHash,
          ),
          proofUrl: decryptedPayload?.txHash
            ? `${networkConfig.explorerBase.replace(/\/$/, "")}/tx/${decryptedPayload.txHash}`
            : null,
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
    const walletAddress =
      req.nextUrl.searchParams.get("scope") === "all"
        ? null
        : resolveWalletAddress(
            req.nextUrl.searchParams.get("wallet") ??
              req.cookies.get(WALLET_COOKIE_KEY)?.value,
          );
    const requestedNetwork =
      req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value;
    const networkKey = requestedNetwork
      ? resolveWalletNetworkKey(requestedNetwork)
      : getServerDefaultNetworkKey();
    const strategies = await buildProofFallbackStrategies(walletAddress ?? undefined, networkKey);

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
