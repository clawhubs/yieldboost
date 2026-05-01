import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import {
  getServer0GNetworkConfig,
  getYieldStrategyInftAddress,
  getYieldStrategyMarketplaceAddress,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const networkKey = resolveWalletNetworkKey(
    req.nextUrl.searchParams.get("network") ??
      req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const networkConfig = getServer0GNetworkConfig(networkKey);
  const inftAddress = getYieldStrategyInftAddress(networkKey);
  const marketplaceAddress = getYieldStrategyMarketplaceAddress(networkKey);

  if (!networkConfig.rpcUrl || !inftAddress || !marketplaceAddress) {
    return NextResponse.json({
      success: true,
      networkKey,
      marketplaceAddress: marketplaceAddress ?? null,
      inftAddress: inftAddress ?? null,
      explorerBase: networkConfig.explorerBase,
      listings: [],
      message: "Marketplace contract is not configured for this network yet.",
    });
  }

  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const inft = new ethers.Contract(
      inftAddress,
      ["function totalSupply() external view returns (uint256)"],
      provider,
    );
    const marketplace = new ethers.Contract(
      marketplaceAddress,
      [
        "function getListing(uint256 tokenId) external view returns (tuple(address seller,uint256 price,bool active))",
      ],
      provider,
    );

    const totalSupply = Number(await inft.totalSupply());
    const listings = [];
    for (let tokenId = 1; tokenId <= totalSupply; tokenId += 1) {
      try {
        const listing = await marketplace.getListing(tokenId);
        if (!listing.active) continue;
        listings.push({
          tokenId,
          seller: listing.seller,
          priceWei: listing.price.toString(),
          price0G: ethers.formatEther(listing.price),
          active: Boolean(listing.active),
        });
      } catch {
        // Ignore token-level listing read failures so one bad id cannot break the page.
      }
    }

    return NextResponse.json({
      success: true,
      networkKey,
      marketplaceAddress,
      inftAddress,
      explorerBase: networkConfig.explorerBase,
      listings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load marketplace listings",
      },
      { status: 500 },
    );
  }
}
