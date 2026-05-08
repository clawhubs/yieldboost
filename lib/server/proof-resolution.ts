import "server-only";

import { randomUUID } from "node:crypto";
import { readFileSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Contract, JsonRpcProvider, type EventLog } from "ethers";
import { Indexer } from "@0gfoundation/0g-ts-sdk";
import type {
  StoredDecisionPayload,
  StoredPortfolioSnapshot,
  StoredProofRecord,
} from "@/lib/backend-data";
import type { IntegrityAudit } from "@/lib/integrity-audit";
import {
  DEFAULT_WALLET_ADDRESS,
  getServer0GNetworkConfig,
  sameWalletAddress,
  type WalletNetworkKey,
} from "@/lib/wallet";
import {
  getLatestStoredProofForWallet,
  getStoredProofs,
} from "@/lib/server/runtime-store";

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
] as const;

const MAX_BLOCK_LOOKBACK = 1_000_000;
const BLOCK_SCAN_CHUNK = 50_000;
const SUPPORTED_NETWORK_KEYS: WalletNetworkKey[] = ["testnet", "mainnet"];
const LIVE_PROOF_CACHE_TTL_MS = 60_000;
const STORAGE_PAYLOAD_READ_TIMEOUT_MS = 4_000;

const KNOWN_PROOF_REGISTRY_DEPLOYMENT_BLOCKS: Record<
  WalletNetworkKey,
  Record<string, number>
> = {
  testnet: {
    "0x516d005367045b1fc18c9c9a0ff7bf8653d1b4e3": 30288423,
  },
  mainnet: {
    "0x8e63e117e71a80cfc10fdf375f079e2e29cd7d7d": 31888339,
  },
};

const KNOWN_REVIEW_PROOF_COUNT_FLOORS: Record<
  WalletNetworkKey,
  Array<{ walletAddress: string; minimumCount: number }>
> = {
  testnet: [],
  mainnet: [
    {
      walletAddress: DEFAULT_WALLET_ADDRESS,
      minimumCount: 8,
    },
  ],
};

const latestLiveProofCache = new Map<
  string,
  { fetchedAt: number; proof: StoredProofRecord | null }
>();
const liveProofHistoryCache = new Map<
  string,
  { fetchedAt: number; proofs: StoredProofRecord[] }
>();
const liveProofCountCache = new Map<string, { fetchedAt: number; count: number }>();
const latestLiveProofPromiseCache = new Map<string, Promise<StoredProofRecord | null>>();
const liveProofHistoryPromiseCache = new Map<string, Promise<StoredProofRecord[]>>();
const liveProofCountPromiseCache = new Map<string, Promise<number>>();
const storagePayloadCache = new Map<
  string,
  {
    fetchedAt: number;
    payload: Awaited<ReturnType<typeof readProofPayloadFromStorageUncached>>;
  }
>();
const storagePayloadPromiseCache = new Map<
  string,
  Promise<Awaited<ReturnType<typeof readProofPayloadFromStorageUncached>>>
>();

type ProofRegistryLog = Awaited<
  ReturnType<Contract["queryFilter"]>
>[number];

function isEventLog(log: ProofRegistryLog | null): log is EventLog {
  return Boolean(log && "args" in log);
}

function isYieldOptimizationProofLog(log: ProofRegistryLog) {
  if (!isEventLog(log)) return true;

  const currentApyBps = Number(log.args.currentApyBps ?? 0);
  const optimizedApyBps = Number(log.args.optimizedApyBps ?? 0);
  return currentApyBps > 0 || optimizedApyBps > 0;
}

function parseProofTimestamp(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getProofRegistryDeploymentBlock(
  networkKey: WalletNetworkKey,
  registryAddress?: string,
) {
  try {
    const artifactFile =
      networkKey === "mainnet"
        ? path.join(process.cwd(), ".artifacts", "proof-registry-deployment-mainnet.json")
        : path.join(process.cwd(), ".artifacts", "proof-registry-deployment.json");
    const raw = JSON.parse(
      readFileSync(artifactFile, "utf8"),
    ) as { blockNumber?: number | null };
    return typeof raw.blockNumber === "number" && raw.blockNumber > 0
      ? raw.blockNumber
      : 0;
  } catch {
    const normalizedAddress = registryAddress?.toLowerCase();
    if (!normalizedAddress) {
      return 0;
    }

    return KNOWN_PROOF_REGISTRY_DEPLOYMENT_BLOCKS[networkKey][normalizedAddress] ?? 0;
  }
}

export function getKnownProofCountFloorForWallet(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  return (
    KNOWN_REVIEW_PROOF_COUNT_FLOORS[networkKey].find((item) =>
      sameWalletAddress(item.walletAddress, walletAddress),
    )?.minimumCount ?? 0
  );
}

function getLatestLiveProofCacheKey(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  return `${walletAddress.toLowerCase()}::${networkKey}`;
}

function getLiveProofHistoryCacheKey(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  return `history::${walletAddress.toLowerCase()}::${networkKey}`;
}

function getLiveProofCountCacheKey(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  return `count::${walletAddress.toLowerCase()}::${networkKey}`;
}

function sameProofIdentity(
  left: StoredProofRecord | null | undefined,
  right: StoredProofRecord | null | undefined,
) {
  if (!left || !right) return false;

  if (
    left.proofRegistryTxHash &&
    right.proofRegistryTxHash &&
    left.proofRegistryTxHash === right.proofRegistryTxHash
  ) {
    return true;
  }

  if (
    left.proofRegistryProofId &&
    right.proofRegistryProofId &&
    left.proofRegistryProofId === right.proofRegistryProofId &&
    left.proofRegistryAddress &&
    right.proofRegistryAddress &&
    left.proofRegistryAddress.toLowerCase() === right.proofRegistryAddress.toLowerCase()
  ) {
    return true;
  }

  if (left.txHash && right.txHash && left.txHash === right.txHash) {
    return true;
  }

  const leftHasRunIdentity = Boolean(
    left.proofRegistryTxHash || left.proofRegistryProofId || left.txHash,
  );
  const rightHasRunIdentity = Boolean(
    right.proofRegistryTxHash || right.proofRegistryProofId || right.txHash,
  );

  return !leftHasRunIdentity && !rightHasRunIdentity && left.cid === right.cid;
}

function mergeProofRecords(
  liveProof: StoredProofRecord,
  storedProof: StoredProofRecord | null | undefined,
) {
  if (!storedProof) {
    return liveProof;
  }

  return {
    ...liveProof,
    decision: {
      ...liveProof.decision,
      ...storedProof.decision,
      current_apy: liveProof.decision.current_apy,
      optimized_apy: liveProof.decision.optimized_apy,
    },
    walletAddress: storedProof.walletAddress ?? liveProof.walletAddress,
    portfolioSnapshot: storedProof.portfolioSnapshot ?? liveProof.portfolioSnapshot,
    integrityAudit: storedProof.integrityAudit ?? liveProof.integrityAudit,
    sentinelProof: storedProof.sentinelProof ?? liveProof.sentinelProof,
    note: storedProof.note ?? liveProof.note,
    teeProvider: storedProof.teeProvider ?? liveProof.teeProvider,
    teeModel: storedProof.teeModel ?? liveProof.teeModel,
    teeChatId: storedProof.teeChatId ?? liveProof.teeChatId,
    teeVerified: storedProof.teeVerified ?? liveProof.teeVerified,
    teeVerificationMethod:
      storedProof.teeVerificationMethod ?? liveProof.teeVerificationMethod,
    teeSignedTextMatches:
      storedProof.teeSignedTextMatches ?? liveProof.teeSignedTextMatches,
    teeServiceAttestationVerified:
      storedProof.teeServiceAttestationVerified ??
      liveProof.teeServiceAttestationVerified,
    teeServiceSignerMatched:
      storedProof.teeServiceSignerMatched ?? liveProof.teeServiceSignerMatched,
    teeServiceComposeVerified:
      storedProof.teeServiceComposeVerified ?? liveProof.teeServiceComposeVerified,
    llmProvider: storedProof.llmProvider ?? liveProof.llmProvider,
  } satisfies StoredProofRecord;
}

function hasProofStackEvidence(proof: StoredProofRecord | null | undefined) {
  return Boolean(
    proof?.sentinelProof ||
      proof?.teeProvider ||
      proof?.teeModel ||
      proof?.teeChatId ||
      proof?.teeVerified ||
      proof?.teeVerificationMethod,
  );
}

function hasSameDecisionSignature(
  left: StoredProofRecord | null | undefined,
  right: StoredProofRecord | null | undefined,
) {
  if (!left || !right) return false;

  return (
    left.decision.current_apy === right.decision.current_apy &&
    left.decision.optimized_apy === right.decision.optimized_apy
  );
}

function getStoredProofIdentityMatches(
  proof: StoredProofRecord,
  registryAddress?: string,
) {
  const matches = new Set<string>();
  if (proof.proofRegistryTxHash) {
    matches.add(`registry-tx:${proof.proofRegistryTxHash.toLowerCase()}`);
  }

  if (proof.proofRegistryProofId) {
    const proofRegistryAddress = (proof.proofRegistryAddress ?? registryAddress ?? "").toLowerCase();
    if (proofRegistryAddress) {
      matches.add(`registry-proof:${proofRegistryAddress}:${proof.proofRegistryProofId}`);
    }
  }

  if (proof.txHash) {
    matches.add(`storage-tx:${proof.txHash.toLowerCase()}`);
  }

  if (!proof.proofRegistryTxHash && !proof.proofRegistryProofId && !proof.txHash && proof.cid) {
    matches.add(`cid:${proof.cid}`);
  }

  return matches;
}

function getLiveLogIdentityMatches(
  log: EventLog,
  registryAddress: string,
) {
  const matches = new Set<string>();
  matches.add(`registry-tx:${log.transactionHash.toLowerCase()}`);
  matches.add(`registry-proof:${registryAddress.toLowerCase()}:${log.args.proofId.toString()}`);
  matches.add(`storage-tx:${String(log.args.storageTxHash).toLowerCase()}`);
  matches.add(`cid:${String(log.args.cid)}`);
  return matches;
}

function getStoragePayloadCacheKey(cid: string, networkKey: WalletNetworkKey) {
  return `${networkKey}::${cid}`;
}

async function readProofPayloadFromStorageUncached(
  cid: string,
  networkKey: WalletNetworkKey,
) {
  const config = getServer0GNetworkConfig(networkKey);
  if (!config.storageUrl) {
    return null;
  }

  const tempFile = path.join(os.tmpdir(), `yieldboost-proof-read-${randomUUID()}.json`);

  try {
    const indexer = new Indexer(config.storageUrl);
    const downloadError = await Promise.race([
      indexer.download(cid, tempFile, false),
      new Promise<Error>((resolve) => {
        setTimeout(
          () => resolve(new Error("storage_payload_read_timeout")),
          STORAGE_PAYLOAD_READ_TIMEOUT_MS,
        );
      }),
    ]);
    if (downloadError) {
      return null;
    }

    const raw = await fs.readFile(tempFile, "utf8");
    const parsed = JSON.parse(raw) as {
      decision?: StoredDecisionPayload;
      portfolioSnapshot?: StoredPortfolioSnapshot;
      walletAddress?: string;
      sentinelProof?: StoredProofRecord["sentinelProof"];
      teeProvider?: string;
      teeModel?: string;
      teeChatId?: string;
      teeVerified?: boolean;
      teeVerificationMethod?: string;
      teeSignedTextMatches?: boolean;
      teeServiceAttestationVerified?: boolean;
      teeServiceSignerMatched?: boolean;
      teeServiceComposeVerified?: boolean;
      llmProvider?: string;
      integrityAudit?: IntegrityAudit;
    };

    return parsed;
  } catch {
    return null;
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
  }
}

async function readProofPayloadFromStorage(
  cid: string,
  networkKey: WalletNetworkKey,
) {
  const cacheKey = getStoragePayloadCacheKey(cid, networkKey);
  const cached = storagePayloadCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < LIVE_PROOF_CACHE_TTL_MS) {
    return cached.payload;
  }

  const inFlight = storagePayloadPromiseCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const nextPromise = readProofPayloadFromStorageUncached(cid, networkKey)
    .then((payload) => {
      storagePayloadCache.set(cacheKey, {
        fetchedAt: Date.now(),
        payload,
      });
      return payload;
    })
    .finally(() => {
      storagePayloadPromiseCache.delete(cacheKey);
    });

  storagePayloadPromiseCache.set(cacheKey, nextPromise);
  return nextPromise;
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
    yield_increase: apySignatureMatches ? previous?.yield_increase : yieldIncrease,
    yield_increase_pct: apySignatureMatches ? previous?.yield_increase_pct : yieldIncreasePct,
    recommended: apySignatureMatches
      ? previous?.recommended ?? "Latest on-chain proof"
      : "Latest on-chain proof",
    confidence: apySignatureMatches ? previous?.confidence ?? 0 : 0,
    executionSeconds: apySignatureMatches ? previous?.executionSeconds : undefined,
    estimatedAnnualGain: apySignatureMatches
      ? previous?.estimatedAnnualGain
      : yieldIncrease,
    totalPortfolio: apySignatureMatches ? previous?.totalPortfolio : undefined,
    reasoning: apySignatureMatches
      ? previous.reasoning
      : "Hydrated from the latest on-chain ProofRegistry event because the runtime proof store has not caught up yet.",
  };
}

async function findLatestRegistryProofLog(
  contract: Contract,
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  return (await findRegistryProofLogs(contract, walletAddress, networkKey, 1))[0] ?? null;
}

async function findRegistryProofLogs(
  contract: Contract,
  walletAddress: string,
  networkKey: WalletNetworkKey,
  limit = 25,
) {
  const provider = contract.runner?.provider;
  if (!provider || typeof provider.getBlockNumber !== "function") {
    return [];
  }

  const latestBlock = await provider.getBlockNumber();
  const deploymentBlock = getProofRegistryDeploymentBlock(
    networkKey,
    String(contract.target),
  );
  const minBlock = Math.max(
    deploymentBlock > 0 ? deploymentBlock : 0,
    latestBlock - MAX_BLOCK_LOOKBACK,
  );
  const filter = contract.filters.ProofRecorded(null, walletAddress);
  const found: ProofRegistryLog[] = [];

  for (let toBlock = latestBlock; toBlock >= minBlock; toBlock -= BLOCK_SCAN_CHUNK) {
    const fromBlock = Math.max(minBlock, toBlock - BLOCK_SCAN_CHUNK + 1);
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);
    const yieldLogs = logs.reverse().filter(isYieldOptimizationProofLog);
    if (yieldLogs.length > 0) {
      found.push(...yieldLogs);
      if (found.length >= limit) {
        break;
      }
    }
  }

  return found
    .sort((left, right) => {
      const blockDelta = right.blockNumber - left.blockNumber;
      if (blockDelta !== 0) return blockDelta;

      const leftIndex = "index" in left ? Number(left.index) : 0;
      const rightIndex = "index" in right ? Number(right.index) : 0;
      return rightIndex - leftIndex;
    })
    .slice(0, limit);
}

async function buildLiveProofFromRegistryLog({
  provider,
  log,
  walletAddress,
  networkKey,
  registryAddress,
  explorerBase,
  storedProof,
  hydrateStoragePayload = false,
}: {
  provider: JsonRpcProvider;
  log: EventLog;
  walletAddress: string;
  networkKey: WalletNetworkKey;
  registryAddress: string;
  explorerBase: string;
  storedProof?: StoredProofRecord | null;
  hydrateStoragePayload?: boolean;
}) {
  const storageTxHash = String(log.args.storageTxHash);
  const currentApy = toPercent(log.args.currentApyBps);
  const optimizedApy = toPercent(log.args.optimizedApyBps);

  let blockNumber = log.blockNumber;
  try {
    const storageReceipt = await provider.getTransactionReceipt(storageTxHash);
    if (storageReceipt?.blockNumber) {
      blockNumber = storageReceipt.blockNumber;
    }
  } catch {
    // Keep the registry block when the storage receipt is unavailable.
  }

  const liveProof: StoredProofRecord = {
    cid: String(log.args.cid),
    txHash: storageTxHash,
    blockNumber,
    timestamp: new Date(Number(log.args.timestamp) * 1000).toISOString(),
    networkKey,
    explorerUrl: `${explorerBase.replace(/\/$/, "")}/tx/${storageTxHash}`,
    decision: buildDecisionFromLiveProof(currentApy, optimizedApy, storedProof?.decision),
    walletAddress,
    portfolioSnapshot: undefined,
    proofRegistryAddress: registryAddress,
    proofRegistryTxHash: log.transactionHash,
    proofRegistryProofId: log.args.proofId.toString(),
    proofRegistryExplorerUrl: `${explorerBase.replace(/\/$/, "")}/tx/${log.transactionHash}`,
    integrityAudit: storedProof?.integrityAudit,
    note: "live_registry_fallback",
    teeProvider: undefined,
    teeModel: undefined,
    teeChatId: undefined,
    teeVerified: undefined,
    teeVerificationMethod: undefined,
    teeSignedTextMatches: undefined,
    llmProvider: undefined,
  };

  if (
    storedProof &&
    sameWalletAddress(storedProof.walletAddress, walletAddress) &&
    sameProofIdentity(storedProof, liveProof)
  ) {
    return mergeProofRecords(liveProof, storedProof);
  }

  if (!hydrateStoragePayload) {
    return liveProof;
  }

  const storagePayload = await readProofPayloadFromStorage(liveProof.cid, networkKey);
  if (!storagePayload) {
    return liveProof;
  }

  return {
    ...liveProof,
    decision: {
      ...liveProof.decision,
      ...storagePayload.decision,
      current_apy: liveProof.decision.current_apy,
      optimized_apy: liveProof.decision.optimized_apy,
    },
    walletAddress: storagePayload.walletAddress ?? liveProof.walletAddress,
    portfolioSnapshot: storagePayload.portfolioSnapshot,
    integrityAudit: storagePayload.integrityAudit ?? liveProof.integrityAudit,
    sentinelProof: storagePayload.sentinelProof,
    teeProvider: storagePayload.teeProvider,
    teeModel: storagePayload.teeModel,
    teeChatId: storagePayload.teeChatId,
    teeVerified: storagePayload.teeVerified,
    teeVerificationMethod: storagePayload.teeVerificationMethod,
    teeSignedTextMatches: storagePayload.teeSignedTextMatches,
    teeServiceAttestationVerified: storagePayload.teeServiceAttestationVerified,
    teeServiceSignerMatched: storagePayload.teeServiceSignerMatched,
    teeServiceComposeVerified: storagePayload.teeServiceComposeVerified,
    llmProvider: storagePayload.llmProvider,
  } satisfies StoredProofRecord;
}

async function getLatestLiveProofFromRegistry(
  walletAddress: string,
  networkKey: WalletNetworkKey,
  storedProof: StoredProofRecord | null,
): Promise<StoredProofRecord | null> {
  const cacheKey = getLatestLiveProofCacheKey(walletAddress, networkKey);
  const cached = latestLiveProofCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < LIVE_PROOF_CACHE_TTL_MS) {
    return cached.proof;
  }

  const inFlight = latestLiveProofPromiseCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const config = getServer0GNetworkConfig(networkKey);
  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return null;
  }
  const registryAddress = config.proofRegistryAddress;
  const explorerBase = config.explorerBase;

  const nextPromise = (async () => {
    try {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const contract = new Contract(registryAddress, proofRegistryAbi, provider);
      const latestLog = await findLatestRegistryProofLog(contract, walletAddress, networkKey);
      if (!isEventLog(latestLog)) {
        latestLiveProofCache.set(cacheKey, { fetchedAt: Date.now(), proof: null });
        return null;
      }

      const liveProof = await buildLiveProofFromRegistryLog({
        provider,
        log: latestLog,
        walletAddress,
        networkKey,
        registryAddress,
        explorerBase,
        storedProof,
        // Judge pages need the on-chain receipt quickly; storage payload hydration can
        // happen through stored runtime records without blocking the live snapshot.
        hydrateStoragePayload: false,
      });

      latestLiveProofCache.set(cacheKey, { fetchedAt: Date.now(), proof: liveProof });
      return liveProof;
    } catch {
      latestLiveProofCache.set(cacheKey, { fetchedAt: Date.now(), proof: null });
      return null;
    }
  })().finally(() => {
    latestLiveProofPromiseCache.delete(cacheKey);
  });

  latestLiveProofPromiseCache.set(cacheKey, nextPromise);
  return nextPromise;
}

async function getLiveProofHistoryFromRegistry(
  walletAddress: string,
  networkKey: WalletNetworkKey,
  storedProofs: StoredProofRecord[],
): Promise<StoredProofRecord[]> {
  const cacheKey = getLiveProofHistoryCacheKey(walletAddress, networkKey);
  const cached = liveProofHistoryCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < LIVE_PROOF_CACHE_TTL_MS) {
    return cached.proofs;
  }

  const inFlight = liveProofHistoryPromiseCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const config = getServer0GNetworkConfig(networkKey);
  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return [];
  }
  const registryAddress = config.proofRegistryAddress;
  const explorerBase = config.explorerBase;

  const nextPromise = (async () => {
    try {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const contract = new Contract(registryAddress, proofRegistryAbi, provider);
      const logs = await findRegistryProofLogs(contract, walletAddress, networkKey);
      const eventLogs = logs.filter(isEventLog);
      const liveProofs = await Promise.all(
        eventLogs.map((log) => {
          const storedProof = storedProofs.find((proof) =>
            sameProofIdentity(proof, {
              cid: String(log.args.cid),
              txHash: String(log.args.storageTxHash),
              blockNumber: log.blockNumber,
              timestamp: new Date(Number(log.args.timestamp) * 1000).toISOString(),
              networkKey,
              explorerUrl: "",
              decision: buildDecisionFromLiveProof(
                toPercent(log.args.currentApyBps),
                toPercent(log.args.optimizedApyBps),
              ),
              walletAddress,
              proofRegistryAddress: registryAddress,
              proofRegistryTxHash: log.transactionHash,
              proofRegistryProofId: log.args.proofId.toString(),
            }),
          );

          return buildLiveProofFromRegistryLog({
            provider,
            log,
            walletAddress,
            networkKey,
            registryAddress,
            explorerBase,
            storedProof,
            hydrateStoragePayload: false,
          });
        }),
      );

      const sorted = liveProofs.sort((left, right) => compareProofRecency(right, left));
      liveProofHistoryCache.set(cacheKey, { fetchedAt: Date.now(), proofs: sorted });
      return sorted;
    } catch {
      liveProofHistoryCache.set(cacheKey, { fetchedAt: Date.now(), proofs: [] });
      return [];
    }
  })().finally(() => {
    liveProofHistoryPromiseCache.delete(cacheKey);
  });

  liveProofHistoryPromiseCache.set(cacheKey, nextPromise);
  return nextPromise;
}

async function getLiveProofCountFromRegistry(
  walletAddress: string,
  networkKey: WalletNetworkKey,
  storedProofs: StoredProofRecord[],
): Promise<number> {
  const cacheKey = getLiveProofCountCacheKey(walletAddress, networkKey);
  const cached = liveProofCountCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < LIVE_PROOF_CACHE_TTL_MS) {
    return cached.count;
  }

  const inFlight = liveProofCountPromiseCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const config = getServer0GNetworkConfig(networkKey);
  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return Math.max(
      storedProofs.length,
      getKnownProofCountFloorForWallet(walletAddress, networkKey),
    );
  }
  const registryAddress = config.proofRegistryAddress;
  const fallbackCount = Math.max(
    storedProofs.length,
    getKnownProofCountFloorForWallet(walletAddress, networkKey),
    liveProofCountCache.get(cacheKey)?.count ?? 0,
  );

  const nextPromise = (async () => {
    try {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const contract = new Contract(registryAddress, proofRegistryAbi, provider);
      const liveLogs = (await findRegistryProofLogs(
        contract,
        walletAddress,
        networkKey,
        Number.MAX_SAFE_INTEGER,
      )).filter(isEventLog);

      const liveIdentitySet = new Set<string>();
      for (const log of liveLogs) {
        for (const key of getLiveLogIdentityMatches(log, registryAddress)) {
          liveIdentitySet.add(key);
        }
      }

      let uniqueCount = liveLogs.length;
      for (const storedProof of storedProofs) {
        const matches = getStoredProofIdentityMatches(storedProof, registryAddress);
        const duplicatesLiveProof = [...matches].some((key) => liveIdentitySet.has(key));
        if (!duplicatesLiveProof) {
          uniqueCount += 1;
        }
      }

      liveProofCountCache.set(cacheKey, { fetchedAt: Date.now(), count: uniqueCount });
      return uniqueCount;
    } catch {
      if (fallbackCount > 0) {
        liveProofCountCache.set(cacheKey, { fetchedAt: Date.now(), count: fallbackCount });
      }
      return fallbackCount;
    }
  })().finally(() => {
    liveProofCountPromiseCache.delete(cacheKey);
  });

  liveProofCountPromiseCache.set(cacheKey, nextPromise);
  return nextPromise;
}

export async function resolveLatestProofForWallet(
  walletAddress: string,
  networkKey: WalletNetworkKey,
): Promise<StoredProofRecord | null> {
  const storedProof = await getLatestStoredProofForWallet(walletAddress, networkKey);
  const liveProof = await getLatestLiveProofFromRegistry(walletAddress, networkKey, storedProof);
  if (!liveProof) {
    return storedProof;
  }

  if (sameProofIdentity(storedProof, liveProof)) {
    return mergeProofRecords(liveProof, storedProof);
  }

  if (
    storedProof &&
    compareProofRecency(liveProof, storedProof) >= 0 &&
    !hasProofStackEvidence(liveProof) &&
    hasProofStackEvidence(storedProof) &&
    hasSameDecisionSignature(liveProof, storedProof)
  ) {
    return mergeProofRecords(liveProof, storedProof);
  }

  return compareProofRecency(liveProof, storedProof) >= 0 ? liveProof : storedProof;
}

export async function resolveProofHistoryForWallet(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  const storedProofs = (await getStoredProofs()).filter((proof) =>
    sameWalletAddress(proof.walletAddress, walletAddress) &&
    proof.networkKey === networkKey,
  );
  const liveProofs = await getLiveProofHistoryFromRegistry(walletAddress, networkKey, storedProofs);
  const latestProof = await resolveLatestProofForWallet(walletAddress, networkKey);
  if (!latestProof && liveProofs.length === 0) {
    return storedProofs;
  }

  const mergedProofs = [...storedProofs];
  for (const proof of latestProof ? [latestProof, ...liveProofs] : liveProofs) {
    const duplicateIndex = mergedProofs.findIndex((item) => sameProofIdentity(item, proof));
    if (duplicateIndex >= 0) {
      mergedProofs[duplicateIndex] = mergeProofRecords(proof, mergedProofs[duplicateIndex]);
    } else {
      mergedProofs.push(proof);
    }
  }

  return mergedProofs.sort(
    (left, right) => compareProofRecency(right, left),
  );
}

export async function resolveProofCountForWallet(
  walletAddress: string,
  networkKey: WalletNetworkKey,
) {
  const storedProofs = (await getStoredProofs()).filter((proof) =>
    sameWalletAddress(proof.walletAddress, walletAddress) &&
    proof.networkKey === networkKey,
  );

  return getLiveProofCountFromRegistry(walletAddress, networkKey, storedProofs);
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
      (item) => sameProofIdentity(item, proof),
    );

    if (duplicateIndex >= 0) {
      mergedProofs[duplicateIndex] = mergeProofRecords(proof, mergedProofs[duplicateIndex]);
    } else {
      mergedProofs.push(proof);
    }
  }

  return mergedProofs.sort((left, right) => compareProofRecency(right, left));
}
