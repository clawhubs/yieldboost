import "server-only";

import { Contract, JsonRpcProvider, type EventLog } from "ethers";
import type { StoredDecisionPayload, StoredProofRecord } from "@/lib/backend-data";
import {
  getServer0GNetworkConfig,
  sameWalletAddress,
  type WalletNetworkKey,
} from "@/lib/wallet";
import {
  getLatestStoredProofForWallet,
  getStoredProofs,
  isRuntimeStoreKvConfigured,
} from "@/lib/server/runtime-store";

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
] as const;

const MAX_BLOCK_LOOKBACK = 1_000_000;
const BLOCK_SCAN_CHUNK = 50_000;
const SUPPORTED_NETWORK_KEYS: WalletNetworkKey[] = ["testnet", "mainnet"];

type ProofRegistryLog = Awaited<
  ReturnType<Contract["queryFilter"]>
>[number];

function isEventLog(log: ProofRegistryLog | null): log is EventLog {
  return Boolean(log && "args" in log);
}

function parseProofTimestamp(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareProofRecency(left: StoredProofRecord | null, right: StoredProofRecord | null) {
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;

  const timestampDelta = parseProofTimestamp(left.timestamp) - parseProofTimestamp(right.timestamp);
  if (timestampDelta !== 0) {
    return timestampDelta;
  }

  const blockDelta = (left.blockNumber ?? 0) - (right.blockNumber ?? 0);
  if (blockDelta !== 0) {
    return blockDelta;
  }

  return left.txHash.localeCompare(right.txHash);
}

function toPercent(value: bigint) {
  return Number(value) / 100;
}

function buildDecisionFromLiveProof(
  currentApy: number,
  optimizedApy: number,
  previous?: StoredDecisionPayload,
): StoredDecisionPayload {
  const yieldIncrease = Number((optimizedApy - currentApy).toFixed(2));
  const yieldIncreasePct =
    currentApy > 0
      ? Number((((optimizedApy - currentApy) / currentApy) * 100).toFixed(2))
      : 0;
  const apySignatureMatches =
    previous &&
    previous.current_apy === currentApy &&
    previous.optimized_apy === optimizedApy;

  return {
    current_apy: currentApy,
    optimized_apy: optimizedApy,
    yield_increase: previous?.yield_increase ?? yieldIncrease,
    yield_increase_pct: previous?.yield_increase_pct ?? yieldIncreasePct,
    recommended: apySignatureMatches
      ? previous.recommended
      : previous?.recommended ?? "Latest on-chain proof",
    confidence: apySignatureMatches ? previous.confidence : previous?.confidence ?? 0,
    executionSeconds: apySignatureMatches ? previous.executionSeconds : previous?.executionSeconds,
    estimatedAnnualGain: apySignatureMatches
      ? previous.estimatedAnnualGain
      : previous?.estimatedAnnualGain ?? yieldIncrease,
    totalPortfolio: apySignatureMatches ? previous.totalPortfolio : previous?.totalPortfolio,
    reasoning: apySignatureMatches
      ? previous.reasoning
      : "Hydrated from the latest on-chain ProofRegistry event because the runtime proof store has not caught up yet.",
  };
}

async function findLatestRegistryProofLog(
  contract: Contract,
  walletAddress: string,
) {
  const provider = contract.runner?.provider;
  if (!provider || typeof provider.getBlockNumber !== "function") {
    return null;
  }

  const latestBlock = await provider.getBlockNumber();
  const minBlock = Math.max(0, latestBlock - MAX_BLOCK_LOOKBACK);
  const filter = contract.filters.ProofRecorded(null, walletAddress);

  for (let toBlock = latestBlock; toBlock >= minBlock; toBlock -= BLOCK_SCAN_CHUNK) {
    const fromBlock = Math.max(minBlock, toBlock - BLOCK_SCAN_CHUNK + 1);
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);
    if (logs.length > 0) {
      return logs[logs.length - 1] as ProofRegistryLog;
    }
  }

  return null;
}

async function getLatestLiveProofFromRegistry(
  walletAddress: string,
  networkKey: WalletNetworkKey,
  storedProof: StoredProofRecord | null,
): Promise<StoredProofRecord | null> {
  const config = getServer0GNetworkConfig(networkKey);
  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return null;
  }

  try {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const contract = new Contract(config.proofRegistryAddress, proofRegistryAbi, provider);
    const latestLog = await findLatestRegistryProofLog(contract, walletAddress);
    if (!isEventLog(latestLog)) {
      return null;
    }

    const storageTxHash = String(latestLog.args.storageTxHash);
    const currentApy = toPercent(latestLog.args.currentApyBps);
    const optimizedApy = toPercent(latestLog.args.optimizedApyBps);

    let blockNumber = latestLog.blockNumber;
    try {
      const storageReceipt = await provider.getTransactionReceipt(storageTxHash);
      if (storageReceipt?.blockNumber) {
        blockNumber = storageReceipt.blockNumber;
      }
    } catch {
      // Keep the registry block when the storage receipt is unavailable.
    }

    return {
      cid: String(latestLog.args.cid),
      txHash: storageTxHash,
      blockNumber,
      timestamp: new Date(Number(latestLog.args.timestamp) * 1000).toISOString(),
      networkKey,
      explorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${storageTxHash}`,
      decision: buildDecisionFromLiveProof(currentApy, optimizedApy, storedProof?.decision),
      walletAddress,
      portfolioSnapshot:
        storedProof && sameWalletAddress(storedProof.walletAddress, walletAddress)
          ? storedProof.portfolioSnapshot
          : undefined,
      proofRegistryAddress: config.proofRegistryAddress,
      proofRegistryTxHash: latestLog.transactionHash,
      proofRegistryProofId: latestLog.args.proofId.toString(),
      proofRegistryExplorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${latestLog.transactionHash}`,
      note: "live_registry_fallback",
      teeProvider:
        storedProof && sameWalletAddress(storedProof.walletAddress, walletAddress)
          ? storedProof.teeProvider
          : undefined,
      teeModel:
        storedProof && sameWalletAddress(storedProof.walletAddress, walletAddress)
          ? storedProof.teeModel
          : undefined,
      teeChatId:
        storedProof && sameWalletAddress(storedProof.walletAddress, walletAddress)
          ? storedProof.teeChatId
          : undefined,
      teeVerified:
        storedProof && sameWalletAddress(storedProof.walletAddress, walletAddress)
          ? storedProof.teeVerified
          : undefined,
      llmProvider:
        storedProof && sameWalletAddress(storedProof.walletAddress, walletAddress)
          ? storedProof.llmProvider
          : undefined,
    };
  } catch {
    return null;
  }
}

export async function resolveLatestProofForWallet(
  walletAddress: string,
  networkKey: WalletNetworkKey,
): Promise<StoredProofRecord | null> {
  const storedProof = await getLatestStoredProofForWallet(walletAddress);
  if (isRuntimeStoreKvConfigured()) {
    return storedProof;
  }

  const liveProof = await getLatestLiveProofFromRegistry(walletAddress, networkKey, storedProof);
  if (!liveProof) {
    return storedProof;
  }

  return compareProofRecency(liveProof, storedProof) >= 0 ? liveProof : storedProof;
}

export async function resolveProofHistoryForWallet(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  const storedProofs = (await getStoredProofs()).filter((proof) =>
    sameWalletAddress(proof.walletAddress, walletAddress),
  );
  const latestProof = await resolveLatestProofForWallet(walletAddress, networkKey);
  if (!latestProof) {
    return storedProofs;
  }

  const withoutLatestDuplicate = storedProofs.filter(
    (proof) =>
      proof.cid !== latestProof.cid &&
      proof.txHash !== latestProof.txHash &&
      proof.proofRegistryTxHash !== latestProof.proofRegistryTxHash,
  );

  return [latestProof, ...withoutLatestDuplicate].sort(
    (left, right) => compareProofRecency(right, left),
  );
}

export async function resolveLatestProofForWalletAcrossNetworks(
  walletAddress: string,
) {
  const proofs = await Promise.all(
    SUPPORTED_NETWORK_KEYS.map((networkKey) =>
      resolveLatestProofForWallet(walletAddress, networkKey),
    ),
  );

  return proofs
    .filter((proof): proof is StoredProofRecord => Boolean(proof))
    .sort((left, right) => compareProofRecency(right, left))[0] ?? null;
}

export async function resolveProofHistoryForWalletAcrossNetworks(
  walletAddress: string,
) {
  const storedProofs = (await getStoredProofs()).filter((proof) =>
    sameWalletAddress(proof.walletAddress, walletAddress),
  );
  const liveProofs = await Promise.all(
    SUPPORTED_NETWORK_KEYS.map((networkKey) =>
      resolveLatestProofForWallet(walletAddress, networkKey),
    ),
  );
  const mergedProofs = [...storedProofs];

  for (const proof of liveProofs) {
    if (!proof) continue;
    const duplicateIndex = mergedProofs.findIndex(
      (item) =>
        item.cid === proof.cid ||
        item.txHash === proof.txHash ||
        item.proofRegistryTxHash === proof.proofRegistryTxHash,
    );

    if (duplicateIndex >= 0) {
      mergedProofs[duplicateIndex] = proof;
    } else {
      mergedProofs.push(proof);
    }
  }

  return mergedProofs.sort((left, right) => compareProofRecency(right, left));
}
