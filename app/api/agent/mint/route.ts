import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { z } from "zod";
import {
  hashStrategy,
  encryptStrategy,
  generateAttestationHash,
} from "@/lib/server/encryption";

export const runtime = "nodejs";

const mintRequestSchema = z.object({
  portfolio: z.record(z.number()),
  decision: z.object({
    current_apy: z.number(),
    optimized_apy: z.number(),
    recommended: z.string(),
    reasoning: z.string().optional(),
  }),
  storageCid: z.string().optional(),
  txHash: z.string().optional(),
});

/**
 * Mint a new Strategy NFT from an optimization result
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolio, decision, storageCid, txHash } = mintRequestSchema.parse(body);

    // Get contract addresses from env
    const inftAddress = process.env.YIELD_STRATEGY_INFT_ADDRESS;
    const privateKey = process.env.ZG_LEDGER_PRIVATE_KEY || process.env.ZG_PRIVATE_KEY;

    if (!inftAddress || !privateKey) {
      return NextResponse.json(
        {
          success: false,
          error: "YIELD_STRATEGY_INFT_ADDRESS or ZG_LEDGER_PRIVATE_KEY not configured",
        },
        { status: 503 }
      );
    }

    // Connect to 0G testnet
    const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    const wallet = new ethers.Wallet(privateKey, provider);

    // Generate content hash
    const contentHash = hashStrategy({ portfolio, decision });

    // Encrypt strategy data
    const encryptedUri = encryptStrategy({
      portfolio,
      decision,
      storageCid,
      txHash,
      timestamp: Date.now(),
    });

    // Calculate APY in basis points
    const apyBps = Math.round(decision.optimized_apy * 100);

    // Generate attestation hash (if TEE metadata available)
    const attestationHash = generateAttestationHash(
      contentHash,
      Date.now(),
      "0g-compute"
    );

    // Contract ABI (minimal for minting)
    const inftAbi = [
      "function mintStrategy(address to, string encryptedUri, bytes32 contentHash, uint256 apy, bytes32 attestationHash) external returns (uint256)",
      "function totalSupply() external view returns (uint256)",
    ];

    const inftContract = new ethers.Contract(inftAddress, inftAbi, wallet);

    // Mint the strategy NFT
    const mintTx = await inftContract.mintStrategy(
      wallet.address,
      encryptedUri,
      contentHash,
      apyBps,
      attestationHash
    );

    const receipt = await mintTx.wait();

    // Get the token ID from the event or total supply
    const totalSupply = await inftContract.totalSupply();
    const tokenId = totalSupply;

    return NextResponse.json({
      success: true,
      tokenId: tokenId.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      encryptedUri,
      contentHash,
      apy: decision.optimized_apy,
      explorerUrl: `https://chainscan-galileo.0g.ai/tx/${receipt.hash}`,
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
