import { NextRequest, NextResponse } from "next/server";
import { Interface, JsonRpcProvider } from "ethers";
import { getStoredProofByCid, recordStoredProof } from "@/lib/server/runtime-store";
import {
  getServer0GNetworkConfig,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  sameWalletAddress,
} from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const proofRegistryInterface = new Interface([
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
]);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    cid?: string;
    networkKey?: string;
    walletAddress?: string;
    proofRegistryTxHash?: string;
  };

  const cid = typeof body.cid === "string" ? body.cid : undefined;
  const walletAddress = resolveWalletAddress(body.walletAddress);
  const proofRegistryTxHash =
    typeof body.proofRegistryTxHash === "string"
      ? body.proofRegistryTxHash
      : undefined;
  const networkKey = resolveWalletNetworkKey(body.networkKey);
  const config = getServer0GNetworkConfig(networkKey);

  if (!cid || !walletAddress || !proofRegistryTxHash) {
    return NextResponse.json(
      { success: false, error: "cid, walletAddress, and proofRegistryTxHash are required." },
      { status: 400 },
    );
  }

  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return NextResponse.json(
      { success: false, error: "ProofRegistry is not configured for this network." },
      { status: 503 },
    );
  }

  const storedProof = await getStoredProofByCid(cid);
  if (!storedProof) {
    return NextResponse.json(
      { success: false, error: "Stored proof was not found for this CID." },
      { status: 404 },
    );
  }

  if (storedProof.networkKey && storedProof.networkKey !== networkKey) {
    return NextResponse.json(
      { success: false, error: "Stored proof network does not match the anchor network." },
      { status: 409 },
    );
  }

  if (storedProof.walletAddress && !sameWalletAddress(storedProof.walletAddress, walletAddress)) {
    return NextResponse.json(
      { success: false, error: "Stored proof wallet does not match the signer wallet." },
      { status: 409 },
    );
  }

  const provider = new JsonRpcProvider(config.rpcUrl);
  const receipt = await provider.getTransactionReceipt(proofRegistryTxHash);
  if (!receipt) {
    return NextResponse.json(
      { success: false, error: "ProofRegistry transaction receipt is not available yet." },
      { status: 202 },
    );
  }

  const registryAddress = config.proofRegistryAddress.toLowerCase();
  const proofEvent = receipt.logs
    .filter((log) => log.address.toLowerCase() === registryAddress)
    .map((log) => {
      try {
        return proofRegistryInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event) => event?.name === "ProofRecorded");

  if (!proofEvent) {
    return NextResponse.json(
      { success: false, error: "ProofRecorded event was not found in this transaction." },
      { status: 422 },
    );
  }

  const owner = String(proofEvent.args.owner);
  const eventCid = String(proofEvent.args.cid);
  if (!sameWalletAddress(owner, walletAddress)) {
    return NextResponse.json(
      { success: false, error: "ProofRegistry owner is not the connected wallet." },
      { status: 422 },
    );
  }

  if (eventCid.toLowerCase() !== cid.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "ProofRegistry CID does not match the stored proof." },
      { status: 422 },
    );
  }

  const proofRegistryProofId = proofEvent.args.proofId.toString();
  const updatedProof = await recordStoredProof({
    ...storedProof,
    walletAddress,
    proofRegistryAddress: config.proofRegistryAddress,
    proofRegistryTxHash,
    proofRegistryProofId,
    proofRegistryExplorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${proofRegistryTxHash}`,
    note: storedProof.note
      ?.split(",")
      .filter((note) => note !== "awaiting_user_registry_signature")
      .join(","),
  });

  return NextResponse.json({
    success: true,
    data: {
      proofRegistryAddress: updatedProof.proofRegistryAddress,
      proofRegistryTxHash: updatedProof.proofRegistryTxHash,
      proofRegistryProofId: updatedProof.proofRegistryProofId,
      proofRegistryExplorerUrl: updatedProof.proofRegistryExplorerUrl,
      walletAddress: updatedProof.walletAddress,
    },
  });
}
