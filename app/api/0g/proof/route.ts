import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import { getLatestStoredProof, getStoredProofByCid } from "@/lib/server/runtime-store";
import {
  getServer0GNetworkConfig,
  getServerDefaultNetworkKey,
  resolveWalletNetworkKey,
} from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveBlockNumber(
  txHash: string | undefined,
  storedBlockNumber: number | undefined,
  networkKey: string | undefined,
) {
  if (typeof storedBlockNumber === "number" && storedBlockNumber > 0) {
    return storedBlockNumber;
  }

  if (!txHash) {
    return storedBlockNumber;
  }

  const networkConfig = getServer0GNetworkConfig(resolveWalletNetworkKey(networkKey));
  if (!networkConfig.rpcUrl) {
    return storedBlockNumber;
  }

  try {
    const provider = new JsonRpcProvider(networkConfig.rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt?.blockNumber ?? storedBlockNumber;
  } catch {
    return storedBlockNumber;
  }
}

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  const txHash = req.nextUrl.searchParams.get("txHash") ?? undefined;
  const requestedNetwork = req.nextUrl.searchParams.get("network");
  const networkKey = requestedNetwork
    ? resolveWalletNetworkKey(requestedNetwork)
    : getServerDefaultNetworkKey();

  const storedProof = cid
    ? await getStoredProofByCid(cid)
    : await getLatestStoredProof();

  if (storedProof) {
    const blockNumber = await resolveBlockNumber(
      storedProof.txHash,
      storedProof.blockNumber,
      storedProof.networkKey,
    );

    return NextResponse.json({
      success: true,
      data: {
        cid: storedProof.cid,
        txHash: storedProof.txHash,
        block: blockNumber,
        timestamp: storedProof.timestamp,
        networkKey: storedProof.networkKey,
        explorerUrl: storedProof.explorerUrl,
        walletAddress: storedProof.walletAddress,
        decision: storedProof.decision,
        proofRegistryAddress: storedProof.proofRegistryAddress,
        proofRegistryTxHash: storedProof.proofRegistryTxHash,
        proofRegistryProofId: storedProof.proofRegistryProofId,
        proofRegistryExplorerUrl: storedProof.proofRegistryExplorerUrl,
        integrityAudit: storedProof.integrityAudit,
      },
    });
  }

  if (!cid) {
    if (!txHash) {
      return NextResponse.json(
        { success: false, error: "No live proof available yet" },
        { status: 404 },
      );
    }

    const blockNumber = await resolveBlockNumber(txHash, undefined, networkKey);
    return NextResponse.json({
      success: true,
      data: {
        txHash,
        block: blockNumber,
        timestamp: new Date().toISOString(),
        networkKey,
        explorerUrl: `${getServer0GNetworkConfig(networkKey).explorerBase.replace(/\/$/, "")}/tx/${txHash}`,
      },
    });
  }

  const networkConfig = getServer0GNetworkConfig(networkKey);
  const storageUrl = networkConfig.storageUrl;

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
              networkConfig.explorerBase,
          },
        });
      }
    } catch {
      // Ignore remote failure and return an honest error below.
    }
  }

  if (txHash) {
    const blockNumber = await resolveBlockNumber(txHash, undefined, networkKey);
    return NextResponse.json({
      success: true,
      data: {
        cid,
        txHash,
        block: blockNumber,
        timestamp: new Date().toISOString(),
        networkKey,
        explorerUrl: `${networkConfig.explorerBase.replace(/\/$/, "")}/tx/${txHash}`,
      },
    });
  }

  return NextResponse.json({
    success: false,
    error: "Proof not found on the live store",
  }, { status: 404 });
}
