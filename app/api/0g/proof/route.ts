import { NextRequest, NextResponse } from "next/server";
import { getLatestStoredProof, getStoredProofByCid } from "@/lib/server/runtime-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");

  const storedProof = cid
    ? await getStoredProofByCid(cid)
    : await getLatestStoredProof();

  if (storedProof) {
    return NextResponse.json({
      success: true,
      data: {
        cid: storedProof.cid,
        txHash: storedProof.txHash,
        block: storedProof.blockNumber,
        timestamp: storedProof.timestamp,
        explorerUrl: storedProof.explorerUrl,
        walletAddress: storedProof.walletAddress,
        decision: storedProof.decision,
        proofRegistryAddress: storedProof.proofRegistryAddress,
        proofRegistryTxHash: storedProof.proofRegistryTxHash,
        proofRegistryProofId: storedProof.proofRegistryProofId,
        proofRegistryExplorerUrl: storedProof.proofRegistryExplorerUrl,
      },
    });
  }

  if (!cid) {
    return NextResponse.json(
      { success: false, error: "No live proof available yet" },
      { status: 404 },
    );
  }

  const storageUrl = process.env.ZG_STORAGE_URL ?? process.env.NEXT_PUBLIC_ZG_STORAGE;

  if (storageUrl) {
    try {
      const response = await fetch(`${storageUrl}/v1/file/${cid}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as Record<string, unknown>;

        return NextResponse.json({
          success: true,
          data: {
            cid,
            txHash: typeof data.txHash === "string" ? data.txHash : undefined,
            block:
              (typeof data.block === "number" ? data.block : undefined) ??
              (typeof data.blockNumber === "number"
                ? data.blockNumber
                : 0),
            timestamp:
              (typeof data.timestamp === "string" ? data.timestamp : undefined) ??
              new Date().toISOString(),
            explorerUrl:
              (typeof data.explorerUrl === "string"
                ? data.explorerUrl
                : undefined) ??
              (process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
                "https://chainscan-galileo.0g.ai"),
          },
        });
      }
    } catch {
      // Ignore remote failure and return an honest error below.
    }
  }

  return NextResponse.json({
    success: false,
    error: "Proof not found on the live store",
  }, { status: 404 });
}
