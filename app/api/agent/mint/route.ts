import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { z } from "zod";
import {
  hashStrategy,
  encryptStrategy,
  generateAttestationHash,
} from "@/lib/server/encryption";
import { getContractSignerPrivateKey } from "@/lib/server/network-credentials";
import {
  getYieldStrategyInftAddress,
  getYieldStrategyAttestationOracleAddress,
  getServer0GNetworkConfig,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const runtime = "nodejs";

const mintRequestSchema = z.object({
  portfolio: z.record(z.number()),
  walletAddress: z.string(),
  decision: z.object({
    current_apy: z.number(),
    optimized_apy: z.number(),
    recommended: z.string(),
    reasoning: z.string().optional(),
  }),
  storageCid: z.string().optional(),
  txHash: z.string().optional(),
  teeAttestation: z
    .object({
      chatId: z.string(),
      provider: z.string(),
      model: z.string(),
      timestamp: z.string(),
      isValid: z.boolean(),
      verificationMethod: z.string().optional(),
    })
    .optional(),
});

/**
 * Mint a new Strategy NFT from an optimization result
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      portfolio,
      walletAddress,
      decision,
      storageCid,
      txHash,
      teeAttestation,
    } = mintRequestSchema.parse(body);
    const networkKey = resolveWalletNetworkKey(
      req.nextUrl.searchParams.get("network") ??
        req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
    );
    const networkConfig = getServer0GNetworkConfig(networkKey);
    const targetWalletAddress = resolveWalletAddress(walletAddress);

    if (!targetWalletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid connected wallet address is required to mint the Agent NFT",
        },
        { status: 400 },
      );
    }

    // Get contract addresses from env
    const inftAddress = getYieldStrategyInftAddress(networkKey);
    const oracleAddress = getYieldStrategyAttestationOracleAddress(networkKey);
    const privateKey = getContractSignerPrivateKey(networkKey);

    if (!inftAddress || !privateKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "YieldStrategy INFT address or deploy signer is not configured for the active network",
        },
        { status: 503 }
      );
    }

    if (!networkConfig.rpcUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `${networkConfig.label} RPC is not configured`,
        },
        { status: 503 },
      );
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Generate content hash
    const contentHash = hashStrategy({ portfolio, decision });

    // Encrypt strategy data
    const encryptedUri = encryptStrategy({
      portfolio,
      decision,
      storageCid,
      txHash,
      teeAttestation,
      timestamp: Date.now(),
    });

    // Calculate APY in basis points
    const apyBps = Math.round(decision.optimized_apy * 100);

    const attestationHash =
      teeAttestation?.isValid &&
      teeAttestation.verificationMethod === "broker-response-signature" &&
      teeAttestation.chatId &&
      teeAttestation.provider &&
      teeAttestation.model
        ? generateAttestationHash({
            contentHash,
            timestamp: teeAttestation.timestamp,
            provider: teeAttestation.provider,
            model: teeAttestation.model,
            chatId: teeAttestation.chatId,
            verified: teeAttestation.isValid,
            verificationMethod: teeAttestation.verificationMethod,
          })
        : ethers.ZeroHash;

    // Contract ABI (minimal for minting)
    const inftAbi = [
      "function mintStrategy(address to, string encryptedUri, bytes32 contentHash, uint256 apy, bytes32 attestationHash) external returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "function oracle() view returns (address)",
      "function setOracle(address newOracle) external",
      "function getStrategy(uint256 tokenId) external view returns (tuple(string encryptedUri, bytes32 contentHash, uint256 apy, uint256 timestamp, address creator, bool verified))",
    ];
    const oracleAbi = [
      "function verifyAttestation(bytes32 attestationHash) external view returns (bool)",
      "function recordAttestation(bytes32 attestationHash) external",
    ];

    const inftContract = new ethers.Contract(inftAddress, inftAbi, wallet);

    if (attestationHash !== ethers.ZeroHash && teeAttestation?.isValid && oracleAddress) {
      const currentOracle = await inftContract.oracle();
      if (currentOracle.toLowerCase() !== oracleAddress.toLowerCase()) {
        const setOracleTx = await inftContract.setOracle(oracleAddress);
        await setOracleTx.wait();
      }

      const oracleContract = new ethers.Contract(oracleAddress, oracleAbi, wallet);
      const alreadyVerified = await oracleContract.verifyAttestation(attestationHash);

      if (!alreadyVerified) {
        const recordAttestationTx = await oracleContract.recordAttestation(attestationHash);
        await recordAttestationTx.wait();
      }
    }

    // Mint the strategy NFT
    const mintTx = await inftContract.mintStrategy(
      targetWalletAddress,
      encryptedUri,
      contentHash,
      apyBps,
      attestationHash
    );

    const receipt = await mintTx.wait();

    // Get the token ID from the event or total supply
    const totalSupply = await inftContract.totalSupply();
    const tokenId = totalSupply;
    const strategy = await inftContract.getStrategy(tokenId);

    return NextResponse.json({
      success: true,
      tokenId: tokenId.toString(),
      txHash: receipt.hash,
      walletAddress: targetWalletAddress,
      blockNumber: receipt.blockNumber,
      encryptedUri,
      contentHash,
      apy: decision.optimized_apy,
      attestationOracleAddress: oracleAddress,
      verifiedOnChain: Boolean(strategy?.verified),
      explorerUrl: `${networkConfig.explorerBase.replace(/\/$/, "")}/tx/${receipt.hash}`,
    });
  } catch (error) {
    console.error("Mint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
