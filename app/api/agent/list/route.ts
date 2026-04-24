import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const runtime = "nodejs";

/**
 * List all minted Strategy NFTs
 */
export async function GET() {
  try {
    // Get contract address from env
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
          timestamp: new Date(Number(strategy.timestamp) * 1000).toISOString(),
          creator: strategy.creator,
          verified: strategy.verified,
          owner,
        });
      } catch (error) {
        console.error(`Error fetching strategy ${i}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalSupply: supplyNumber,
      strategies,
    });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
