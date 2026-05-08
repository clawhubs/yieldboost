import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import {
  getLatestStoredProof,
  getStoredProofByCid,
  recordStoredProof,
} from "@/lib/server/runtime-store";
import { resolveProofHistoryForWallet } from "@/lib/server/proof-resolution";
import {
  getServer0GNetworkConfig,
  getServerDefaultNetworkKey,
  isWalletAddress,
  resolveWalletNetworkKey,
} from "@/lib/wallet";
import type { StoredProofRecord } from "@/lib/backend-data";

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

function sameHash(left: string | undefined, right: string | undefined) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function findMatchingProof(
  proofs: StoredProofRecord[],
  cid: string | null,
  txHash: string | undefined,
) {
  return proofs.find((proof) => {
    if (cid && proof.cid === cid) return true;
    return sameHash(proof.txHash, txHash);
  }) ?? null;
}

async function hydrateProofRegistryFromChain(
  proof: StoredProofRecord | null,
  cid: string | null,
  txHash: string | undefined,
  networkKey: ReturnType<typeof resolveWalletNetworkKey>,
  walletAddress?: string | null,
) {
  if (proof?.proofRegistryTxHash) {
    return proof;
  }

  const targetWallet = proof?.walletAddress ?? walletAddress;
  if (typeof targetWallet !== "string" || !isWalletAddress(targetWallet)) {
    return proof;
  }

  const history = await resolveProofHistoryForWallet(
    targetWallet,
    resolveWalletNetworkKey(proof?.networkKey ?? networkKey),
  );
  const resolvedProof = findMatchingProof(history, cid, txHash);
  if (!resolvedProof?.proofRegistryTxHash) {
    return proof;
  }

  await recordStoredProof(resolvedProof).catch(() => undefined);
  return resolvedProof;
}

function toProofResponseData(proof: StoredProofRecord, blockNumber: number | undefined) {
  return {
    cid: proof.cid,
    txHash: proof.txHash,
    block: blockNumber,
    timestamp: proof.timestamp,
    networkKey: proof.networkKey,
    explorerUrl: proof.explorerUrl,
    walletAddress: proof.walletAddress,
    decision: proof.decision,
    proofRegistryAddress: proof.proofRegistryAddress,
    proofRegistryTxHash: proof.proofRegistryTxHash,
    proofRegistryProofId: proof.proofRegistryProofId,
    proofRegistryExplorerUrl: proof.proofRegistryExplorerUrl,
    integrityAudit: proof.integrityAudit,
  };
}

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  const txHash = req.nextUrl.searchParams.get("txHash") ?? undefined;
  const walletAddress = req.nextUrl.searchParams.get("wallet");
  const requestedNetwork = req.nextUrl.searchParams.get("network");
  const networkKey = requestedNetwork
    ? resolveWalletNetworkKey(requestedNetwork)
    : getServerDefaultNetworkKey();

  let storedProof = cid
    ? await getStoredProofByCid(cid)
    : await getLatestStoredProof();

  storedProof = await hydrateProofRegistryFromChain(
    storedProof,
    cid,
    txHash,
    networkKey,
    walletAddress,
  );

  if (storedProof) {
    const blockNumber = await resolveBlockNumber(
      storedProof.txHash,
      storedProof.blockNumber,
      storedProof.networkKey,
    );

    return NextResponse.json({
      success: true,
      data: toProofResponseData(storedProof, blockNumber),
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
  const chainProof = await hydrateProofRegistryFromChain(
    null,
    cid,
    txHash,
    networkKey,
    walletAddress,
  );

  if (chainProof) {
    const blockNumber = await resolveBlockNumber(
      chainProof.txHash,
      chainProof.blockNumber,
      chainProof.networkKey,
    );

    return NextResponse.json({
      success: true,
      data: toProofResponseData(chainProof, blockNumber),
    });
  }

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
