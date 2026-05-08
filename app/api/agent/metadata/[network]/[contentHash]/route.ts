import { NextRequest, NextResponse } from "next/server";
import { getAgentNftMetadataByContentHash } from "@/lib/server/runtime-store";
import { resolveWalletNetworkKey } from "@/lib/wallet";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    network: string;
    contentHash: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { network, contentHash } = await context.params;
  const networkKey = resolveWalletNetworkKey(network);
  const metadata = await getAgentNftMetadataByContentHash(networkKey, contentHash);

  if (!metadata) {
    return NextResponse.json(
      {
        error: "Agent NFT metadata was not found.",
        network: networkKey,
        contentHash,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      external_url: metadata.externalUrl,
      attributes: metadata.attributes,
      encrypted_strategy: metadata.encryptedStrategy,
      proof: metadata.proof,
      network: metadata.networkKey,
      content_hash: metadata.contentHash,
      token_id: metadata.tokenId,
      wallet_address: metadata.walletAddress,
      created_at: metadata.createdAt,
    },
    {
      headers: {
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
