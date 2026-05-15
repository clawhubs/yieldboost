import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";

import {
  type SettingsPatchInput,
  type SettingsState,
  type StoredAgentMemoryRecord,
  type StoredBlacklistRecord,
  type StoredCrossAgentHandshake,
  type StoredZkComplianceProof,
  type StoredGovernanceDecision,
  type StoredProofRecord,
  type StoredStressTestReport,
  type StoredZkReasoningProof,
  buildSettingsResponse,
  getDefaultSettingsState,
} from "@/lib/backend-data";
import type { WalletNetworkKey } from "@/lib/wallet";
import { isWalletAddress, sameWalletAddress } from "@/lib/wallet";

const PROOFS_KEY = "yieldboost:proofs";
const GLOBAL_STATS_LEDGER_KEY = "yieldboost:global-stats-ledger";
const MEMORIES_KEY = "yieldboost:agent-memories";
const BLACKLIST_KEY = "yieldboost:blacklist";
const STRESS_REPORTS_KEY = "yieldboost:stress-reports";
const ZK_REASONING_PROOFS_KEY = "yieldboost:zk-reasoning-proofs";
const GOVERNANCE_DECISIONS_KEY = "yieldboost:governance-decisions";
const CROSS_AGENT_HANDSHAKES_KEY = "yieldboost:cross-agent-handshakes";
const ZK_COMPLIANCE_PROOFS_KEY = "yieldboost:zk-compliance-proofs";
const AGENT_NFT_METADATA_KEY = "yieldboost:agent-nft-metadata";
const SETTINGS_KEY = "yieldboost:settings";
const MAX_PROOFS = 50;
const MAX_MEMORY_RECORDS = 50;
const MAX_BLACKLIST_RECORDS = 80;
const MAX_STRESS_REPORTS = 40;
const MAX_ZK_REASONING_PROOFS = 40;
const MAX_GOVERNANCE_DECISIONS = 60;
const MAX_CROSS_AGENT_HANDSHAKES = 60;
const MAX_ZK_COMPLIANCE_PROOFS = 60;
const MAX_AGENT_NFT_METADATA = 100;
const LOCAL_STORE_PATH = path.join(process.cwd(), ".artifacts", "runtime-store.local.json");
const LEGACY_LOCAL_STORE_PATH = path.join(process.cwd(), ".artifacts", "runtime-store.json");
const GLOBAL_STATS_LEDGER_LOCAL_PATH = path.join(
  process.cwd(),
  ".artifacts",
  "global-stats-ledger.local.json",
);

export interface GlobalStatsLedger {
  proofKeys: string[];
  walletsSeen: string[];
  protocolsSeen: string[];
  totalTvlProcessed: number;
  totalProofJobs: number;
  updatedAt: string | null;
}

export interface StoredAgentNftMetadata {
  networkKey: WalletNetworkKey;
  contentHash: string;
  tokenUri: string;
  encryptedStrategy: string;
  name: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  proof: {
    contentHash: string;
    storageCid?: string | null;
    proofTxHash?: string | null;
    proofExplorerUrl?: string | null;
    mintTxHash?: string | null;
    mintExplorerUrl?: string | null;
    contractAddress?: string | null;
  };
  walletAddress: string;
  tokenId?: string | null;
  apy: number;
  currentApy: number;
  createdAt: string;
}

export function isRuntimeStoreKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// --- In-memory fallback (for local dev without KV) ---
interface RuntimeStore {
  proofs: StoredProofRecord[];
  agentMemories: StoredAgentMemoryRecord[];
  blacklist: StoredBlacklistRecord[];
  stressReports: StoredStressTestReport[];
  zkReasoningProofs: StoredZkReasoningProof[];
  governanceDecisions: StoredGovernanceDecision[];
  crossAgentHandshakes: StoredCrossAgentHandshake[];
  zkComplianceProofs: StoredZkComplianceProof[];
  agentNftMetadata: StoredAgentNftMetadata[];
  settings: SettingsState;
}

const globalStore = globalThis as typeof globalThis & {
  __yieldboostRuntimeStore?: RuntimeStore;
};

function getLocalStore(): RuntimeStore {
  if (!globalStore.__yieldboostRuntimeStore) {
    globalStore.__yieldboostRuntimeStore = {
      proofs: [],
      agentMemories: [],
      blacklist: [],
      stressReports: [],
      zkReasoningProofs: [],
      governanceDecisions: [],
      crossAgentHandshakes: [],
      zkComplianceProofs: [],
      agentNftMetadata: [],
      settings: getDefaultSettingsState(),
    };
  }
  return globalStore.__yieldboostRuntimeStore;
}

function parseProofTimestamp(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createEmptyGlobalStatsLedger(): GlobalStatsLedger {
  return {
    proofKeys: [],
    walletsSeen: [],
    protocolsSeen: [],
    totalTvlProcessed: 0,
    totalProofJobs: 0,
    updatedAt: null,
  };
}

function normalizeGlobalStatsLedger(
  payload: Partial<GlobalStatsLedger> | null | undefined,
): GlobalStatsLedger {
  const proofKeys = Array.isArray(payload?.proofKeys)
    ? payload.proofKeys
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .map((value) => value.toLowerCase())
    : [];
  const walletsSeen = Array.isArray(payload?.walletsSeen)
    ? payload.walletsSeen
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .map((value) => value.toLowerCase())
    : [];
  const protocolsSeen = Array.isArray(payload?.protocolsSeen)
    ? payload.protocolsSeen.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      )
    : [];

  return {
    proofKeys: [...new Set(proofKeys)],
    walletsSeen: [...new Set(walletsSeen)],
    protocolsSeen: [...new Set(protocolsSeen)],
    totalTvlProcessed:
      typeof payload?.totalTvlProcessed === "number" && Number.isFinite(payload.totalTvlProcessed)
        ? payload.totalTvlProcessed
        : 0,
    totalProofJobs:
      typeof payload?.totalProofJobs === "number" && Number.isFinite(payload.totalProofJobs)
        ? payload.totalProofJobs
        : 0,
    updatedAt: typeof payload?.updatedAt === "string" ? payload.updatedAt : null,
  };
}

function buildGlobalStatsProofKey(proof: StoredProofRecord) {
  return (
    proof.proofRegistryTxHash ||
    proof.txHash ||
    proof.cid
  ).toLowerCase();
}

function mergeGlobalStatsLedgerRecord(
  ledger: GlobalStatsLedger,
  proof: StoredProofRecord,
): boolean {
  const proofKey = buildGlobalStatsProofKey(proof);
  if (ledger.proofKeys.includes(proofKey)) {
    return false;
  }

  ledger.proofKeys.push(proofKey);
  ledger.totalProofJobs += 1;
  ledger.totalTvlProcessed += proof.decision.totalPortfolio ?? 0;

  const walletAddress = proof.walletAddress;
  if (walletAddress && isWalletAddress(walletAddress)) {
    const normalizedWallet = walletAddress.toLowerCase();
    if (!ledger.walletsSeen.includes(normalizedWallet)) {
      ledger.walletsSeen.push(normalizedWallet);
    }
  }

  const protocol = proof.decision.recommended?.trim();
  if (protocol && !ledger.protocolsSeen.includes(protocol)) {
    ledger.protocolsSeen.push(protocol);
  }

  ledger.updatedAt = new Date().toISOString();
  return true;
}

function sortProofsNewestFirst(proofs: StoredProofRecord[]) {
  return [...proofs].sort((left, right) => {
    const timestampDelta =
      parseProofTimestamp(right.timestamp) - parseProofTimestamp(left.timestamp);
    if (timestampDelta !== 0) {
      return timestampDelta;
    }

    const blockDelta = (right.blockNumber ?? 0) - (left.blockNumber ?? 0);
    if (blockDelta !== 0) {
      return blockDelta;
    }

    return right.txHash.localeCompare(left.txHash);
  });
}

function sortTimestampedNewestFirst<T extends { timestamp: string }>(
  items: T[],
  maxItems: number,
) {
  return [...items]
    .sort((left, right) => parseProofTimestamp(right.timestamp) - parseProofTimestamp(left.timestamp))
    .slice(0, maxItems);
}

function sortCreatedNewestFirst<T extends { createdAt: string }>(
  items: T[],
  maxItems: number,
) {
  return [...items]
    .sort((left, right) => parseProofTimestamp(right.createdAt) - parseProofTimestamp(left.createdAt))
    .slice(0, maxItems);
}

function sameStoredProofRun(
  left: StoredProofRecord,
  right: StoredProofRecord,
) {
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

async function readLocalStoreFile(): Promise<RuntimeStore | null> {
  const candidatePaths = [LOCAL_STORE_PATH, LEGACY_LOCAL_STORE_PATH];

  try {
    for (const candidatePath of candidatePaths) {
      try {
        const raw = await fs.readFile(candidatePath, "utf8");
        const parsed = JSON.parse(raw) as Partial<RuntimeStore>;

        return {
          proofs: Array.isArray(parsed.proofs) ? parsed.proofs : [],
          agentMemories: Array.isArray(parsed.agentMemories)
            ? parsed.agentMemories
            : [],
          blacklist: Array.isArray(parsed.blacklist) ? parsed.blacklist : [],
          stressReports: Array.isArray(parsed.stressReports)
            ? parsed.stressReports
            : [],
          zkReasoningProofs: Array.isArray(parsed.zkReasoningProofs)
            ? parsed.zkReasoningProofs
            : [],
          governanceDecisions: Array.isArray(parsed.governanceDecisions)
            ? parsed.governanceDecisions
            : [],
          crossAgentHandshakes: Array.isArray(parsed.crossAgentHandshakes)
            ? parsed.crossAgentHandshakes
            : [],
          zkComplianceProofs: Array.isArray(parsed.zkComplianceProofs)
            ? parsed.zkComplianceProofs
            : [],
          agentNftMetadata: Array.isArray(parsed.agentNftMetadata)
            ? parsed.agentNftMetadata
            : [],
          settings: parsed.settings
            ? { ...getDefaultSettingsState(), ...parsed.settings }
            : getDefaultSettingsState(),
        };
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function writeLocalStoreFile(store: RuntimeStore) {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    console.warn("[runtime-store] Local file write failed:", error);
  }
}

async function readGlobalStatsLedgerLocalFile(): Promise<GlobalStatsLedger | null> {
  try {
    const raw = await fs.readFile(GLOBAL_STATS_LEDGER_LOCAL_PATH, "utf8");
    return normalizeGlobalStatsLedger(JSON.parse(raw) as Partial<GlobalStatsLedger>);
  } catch {
    return null;
  }
}

async function writeGlobalStatsLedgerLocalFile(ledger: GlobalStatsLedger) {
  try {
    await fs.mkdir(path.dirname(GLOBAL_STATS_LEDGER_LOCAL_PATH), { recursive: true });
    await fs.writeFile(
      GLOBAL_STATS_LEDGER_LOCAL_PATH,
      JSON.stringify(ledger, null, 2),
      "utf8",
    );
  } catch (error) {
    console.warn("[runtime-store] Global stats ledger write failed:", error);
  }
}

async function loadLocalStore(): Promise<RuntimeStore> {
  const cached = getLocalStore();
  const fromDisk = await readLocalStoreFile();

  if (fromDisk) {
    globalStore.__yieldboostRuntimeStore = fromDisk;
    return fromDisk;
  }

  return cached;
}

async function loadGlobalStatsLedger(): Promise<GlobalStatsLedger> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const payload = await kv.get<GlobalStatsLedger>(GLOBAL_STATS_LEDGER_KEY);
      if (payload) {
        return normalizeGlobalStatsLedger(payload);
      }
    } catch (error) {
      console.warn("[runtime-store] Global stats ledger KV read failed:", error);
    }
  }

  return (await readGlobalStatsLedgerLocalFile()) ?? createEmptyGlobalStatsLedger();
}

async function persistGlobalStatsLedger(ledger: GlobalStatsLedger) {
  const normalized = normalizeGlobalStatsLedger(ledger);

  if (isRuntimeStoreKvConfigured()) {
    try {
      await kv.set(GLOBAL_STATS_LEDGER_KEY, normalized);
      return normalized;
    } catch (error) {
      console.warn("[runtime-store] Global stats ledger KV write failed:", error);
    }
  }

  await writeGlobalStatsLedgerLocalFile(normalized);
  return normalized;
}

// --- Public API (async) ---
export async function recordStoredProof(
  record: StoredProofRecord,
): Promise<StoredProofRecord> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredProofRecord>(PROOFS_KEY, 0, MAX_PROOFS - 1);
      const filtered = (existing ?? []).filter((item) => !sameStoredProofRun(item, record));
      const next = sortProofsNewestFirst([record, ...filtered]).slice(0, MAX_PROOFS);
      await kv.del(PROOFS_KEY);
      if (next.length > 0) {
        // lpush accepts variadic; push in reverse so head = newest
        await kv.lpush(PROOFS_KEY, ...next.slice().reverse());
      }
      const statsLedger = await loadGlobalStatsLedger();
      if (mergeGlobalStatsLedgerRecord(statsLedger, record)) {
        await persistGlobalStatsLedger(statsLedger);
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV write failed, using local fallback:", error);
    }
  }
  const store = await loadLocalStore();
  store.proofs = sortProofsNewestFirst([
    record,
    ...store.proofs.filter((item) => !sameStoredProofRun(item, record)),
  ]).slice(0, MAX_PROOFS);
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  const statsLedger = await loadGlobalStatsLedger();
  if (mergeGlobalStatsLedgerRecord(statsLedger, record)) {
    await persistGlobalStatsLedger(statsLedger);
  }
  return record;
}

export async function getGlobalStatsLedger(): Promise<GlobalStatsLedger> {
  return loadGlobalStatsLedger();
}

export async function mergeGlobalStatsLedgerFromProofs(
  proofs: StoredProofRecord[],
): Promise<GlobalStatsLedger> {
  const ledger = await loadGlobalStatsLedger();
  let changed = false;

  for (const proof of proofs) {
    changed = mergeGlobalStatsLedgerRecord(ledger, proof) || changed;
  }

  if (!changed) {
    return ledger;
  }

  return persistGlobalStatsLedger(ledger);
}

export async function getStoredProofs(): Promise<StoredProofRecord[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredProofRecord>(PROOFS_KEY, 0, MAX_PROOFS - 1);
      return sortProofsNewestFirst(items ?? []);
    } catch (error) {
      console.warn("[runtime-store] KV read failed, using local fallback:", error);
    }
  }
  return sortProofsNewestFirst((await loadLocalStore()).proofs);
}

export async function getStoredProofByCid(
  cid: string,
): Promise<StoredProofRecord | null> {
  const proofs = await getStoredProofs();
  return proofs.find((proof) => proof.cid === cid) ?? null;
}

export async function getLatestStoredProof(): Promise<StoredProofRecord | null> {
  const proofs = await getStoredProofs();
  return proofs[0] ?? null;
}

export async function getLatestStoredProofForWallet(
  walletAddress: string,
  networkKey?: StoredProofRecord["networkKey"],
): Promise<StoredProofRecord | null> {
  const proofs = await getStoredProofs();
  return (
    proofs.find(
      (proof) =>
        sameWalletAddress(proof.walletAddress, walletAddress) &&
        (!networkKey || proof.networkKey === networkKey),
    ) ?? null
  );
}

export async function recordAgentMemory(
  record: StoredAgentMemoryRecord,
): Promise<StoredAgentMemoryRecord> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredAgentMemoryRecord>(
        MEMORIES_KEY,
        0,
        MAX_MEMORY_RECORDS - 1,
      );
      const filtered = (existing ?? []).filter((item) => item.id !== record.id);
      const next = sortTimestampedNewestFirst(
        [record, ...filtered],
        MAX_MEMORY_RECORDS,
      );
      await kv.del(MEMORIES_KEY);
      if (next.length > 0) {
        await kv.lpush(MEMORIES_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV memory write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.agentMemories = sortTimestampedNewestFirst(
    [record, ...store.agentMemories.filter((item) => item.id !== record.id)],
    MAX_MEMORY_RECORDS,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function getAgentMemories(): Promise<StoredAgentMemoryRecord[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredAgentMemoryRecord>(
        MEMORIES_KEY,
        0,
        MAX_MEMORY_RECORDS - 1,
      );
      return sortTimestampedNewestFirst(items ?? [], MAX_MEMORY_RECORDS);
    } catch (error) {
      console.warn("[runtime-store] KV memory read failed, using local fallback:", error);
    }
  }

  return sortTimestampedNewestFirst(
    (await loadLocalStore()).agentMemories,
    MAX_MEMORY_RECORDS,
  );
}

export async function getLatestAgentMemory(
  agentId?: string,
  networkKey?: StoredAgentMemoryRecord["networkKey"],
): Promise<StoredAgentMemoryRecord | null> {
  const memories = await getAgentMemories();
  return (
    memories.find(
      (memory) =>
        (!agentId || memory.agentId === agentId) &&
        (!networkKey || memory.networkKey === networkKey),
    ) ?? null
  );
}

export async function recordBlacklistEntry(
  record: StoredBlacklistRecord,
): Promise<StoredBlacklistRecord> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredBlacklistRecord>(
        BLACKLIST_KEY,
        0,
        MAX_BLACKLIST_RECORDS - 1,
      );
      const filtered = (existing ?? []).filter(
        (item) => item.fingerprint !== record.fingerprint,
      );
      const next = sortTimestampedNewestFirst(
        [record, ...filtered],
        MAX_BLACKLIST_RECORDS,
      );
      await kv.del(BLACKLIST_KEY);
      if (next.length > 0) {
        await kv.lpush(BLACKLIST_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV blacklist write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.blacklist = sortTimestampedNewestFirst(
    [
      record,
      ...store.blacklist.filter(
        (item) => item.fingerprint !== record.fingerprint,
      ),
    ],
    MAX_BLACKLIST_RECORDS,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function getBlacklistEntries(): Promise<StoredBlacklistRecord[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredBlacklistRecord>(
        BLACKLIST_KEY,
        0,
        MAX_BLACKLIST_RECORDS - 1,
      );
      return sortTimestampedNewestFirst(items ?? [], MAX_BLACKLIST_RECORDS);
    } catch (error) {
      console.warn("[runtime-store] KV blacklist read failed, using local fallback:", error);
    }
  }

  return sortTimestampedNewestFirst(
    (await loadLocalStore()).blacklist,
    MAX_BLACKLIST_RECORDS,
  );
}

export async function recordStressTestReport(
  record: StoredStressTestReport,
): Promise<StoredStressTestReport> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredStressTestReport>(
        STRESS_REPORTS_KEY,
        0,
        MAX_STRESS_REPORTS - 1,
      );
      const filtered = (existing ?? []).filter((item) => item.id !== record.id);
      const next = sortTimestampedNewestFirst(
        [record, ...filtered],
        MAX_STRESS_REPORTS,
      );
      await kv.del(STRESS_REPORTS_KEY);
      if (next.length > 0) {
        await kv.lpush(STRESS_REPORTS_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV stress report write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.stressReports = sortTimestampedNewestFirst(
    [record, ...store.stressReports.filter((item) => item.id !== record.id)],
    MAX_STRESS_REPORTS,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function getStressTestReports(): Promise<StoredStressTestReport[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredStressTestReport>(
        STRESS_REPORTS_KEY,
        0,
        MAX_STRESS_REPORTS - 1,
      );
      return sortTimestampedNewestFirst(items ?? [], MAX_STRESS_REPORTS);
    } catch (error) {
      console.warn("[runtime-store] KV stress report read failed, using local fallback:", error);
    }
  }

  return sortTimestampedNewestFirst(
    (await loadLocalStore()).stressReports,
    MAX_STRESS_REPORTS,
  );
}

export async function getLatestStressTestReport(
  agentId?: string,
  networkKey?: StoredStressTestReport["networkKey"],
): Promise<StoredStressTestReport | null> {
  const reports = await getStressTestReports();
  return (
    reports.find(
      (report) =>
        (!agentId || report.agentId === agentId) &&
        (!networkKey || report.networkKey === networkKey),
    ) ?? null
  );
}

export async function recordZkReasoningProof(
  record: StoredZkReasoningProof,
): Promise<StoredZkReasoningProof> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredZkReasoningProof>(
        ZK_REASONING_PROOFS_KEY,
        0,
        MAX_ZK_REASONING_PROOFS - 1,
      );
      const filtered = (existing ?? []).filter((item) => item.proofId !== record.proofId);
      const next = sortCreatedNewestFirst(
        [record, ...filtered],
        MAX_ZK_REASONING_PROOFS,
      );
      await kv.del(ZK_REASONING_PROOFS_KEY);
      if (next.length > 0) {
        await kv.lpush(ZK_REASONING_PROOFS_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV ZK proof write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.zkReasoningProofs = sortCreatedNewestFirst(
    [
      record,
      ...store.zkReasoningProofs.filter((item) => item.proofId !== record.proofId),
    ],
    MAX_ZK_REASONING_PROOFS,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function getZkReasoningProofs(): Promise<StoredZkReasoningProof[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredZkReasoningProof>(
        ZK_REASONING_PROOFS_KEY,
        0,
        MAX_ZK_REASONING_PROOFS - 1,
      );
      return sortCreatedNewestFirst(items ?? [], MAX_ZK_REASONING_PROOFS);
    } catch (error) {
      console.warn("[runtime-store] KV ZK proof read failed, using local fallback:", error);
    }
  }

  return sortCreatedNewestFirst(
    (await loadLocalStore()).zkReasoningProofs,
    MAX_ZK_REASONING_PROOFS,
  );
}

export async function getLatestZkReasoningProof(input: {
  walletAddress?: string;
  agentId?: string;
  networkKey?: WalletNetworkKey;
} = {}): Promise<StoredZkReasoningProof | null> {
  const proofs = await getZkReasoningProofs();
  return (
    proofs.find(
      (proof) =>
        (!input.networkKey || proof.networkKey === input.networkKey) &&
        (!input.walletAddress || sameWalletAddress(proof.walletAddress, input.walletAddress)) &&
        (!input.agentId || proof.agentId === input.agentId),
    ) ?? null
  );
}

export async function recordGovernanceDecision(
  record: StoredGovernanceDecision,
): Promise<StoredGovernanceDecision> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredGovernanceDecision>(
        GOVERNANCE_DECISIONS_KEY,
        0,
        MAX_GOVERNANCE_DECISIONS - 1,
      );
      const filtered = (existing ?? []).filter((item) => item.governanceId !== record.governanceId);
      const next = sortCreatedNewestFirst(
        [record, ...filtered],
        MAX_GOVERNANCE_DECISIONS,
      );
      await kv.del(GOVERNANCE_DECISIONS_KEY);
      if (next.length > 0) {
        await kv.lpush(GOVERNANCE_DECISIONS_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV governance write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.governanceDecisions = sortCreatedNewestFirst(
    [
      record,
      ...store.governanceDecisions.filter(
        (item) => item.governanceId !== record.governanceId,
      ),
    ],
    MAX_GOVERNANCE_DECISIONS,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function getGovernanceDecisions(): Promise<StoredGovernanceDecision[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredGovernanceDecision>(
        GOVERNANCE_DECISIONS_KEY,
        0,
        MAX_GOVERNANCE_DECISIONS - 1,
      );
      return sortCreatedNewestFirst(items ?? [], MAX_GOVERNANCE_DECISIONS);
    } catch (error) {
      console.warn("[runtime-store] KV governance read failed, using local fallback:", error);
    }
  }

  return sortCreatedNewestFirst(
    (await loadLocalStore()).governanceDecisions,
    MAX_GOVERNANCE_DECISIONS,
  );
}

export async function getLatestGovernanceDecision(input: {
  walletAddress?: string;
  agentId?: string;
  networkKey?: WalletNetworkKey;
} = {}): Promise<StoredGovernanceDecision | null> {
  const decisions = await getGovernanceDecisions();
  return (
    decisions.find(
      (decision) =>
        (!input.networkKey || decision.networkKey === input.networkKey) &&
        (!input.walletAddress || sameWalletAddress(decision.walletAddress, input.walletAddress)) &&
        (!input.agentId || decision.agentId === input.agentId),
    ) ?? null
  );
}

export async function recordCrossAgentHandshake(
  record: StoredCrossAgentHandshake,
): Promise<StoredCrossAgentHandshake> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredCrossAgentHandshake>(
        CROSS_AGENT_HANDSHAKES_KEY,
        0,
        MAX_CROSS_AGENT_HANDSHAKES - 1,
      );
      const filtered = (existing ?? []).filter((item) => item.handshakeId !== record.handshakeId);
      const next = sortCreatedNewestFirst(
        [record, ...filtered],
        MAX_CROSS_AGENT_HANDSHAKES,
      );
      await kv.del(CROSS_AGENT_HANDSHAKES_KEY);
      if (next.length > 0) {
        await kv.lpush(CROSS_AGENT_HANDSHAKES_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV handshake write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.crossAgentHandshakes = sortCreatedNewestFirst(
    [
      record,
      ...store.crossAgentHandshakes.filter(
        (item) => item.handshakeId !== record.handshakeId,
      ),
    ],
    MAX_CROSS_AGENT_HANDSHAKES,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function recordZkComplianceProof(
  record: StoredZkComplianceProof,
): Promise<StoredZkComplianceProof> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredZkComplianceProof>(
        ZK_COMPLIANCE_PROOFS_KEY,
        0,
        MAX_ZK_COMPLIANCE_PROOFS - 1,
      );
      const filtered = (existing ?? []).filter((item) => item.proofId !== record.proofId);
      const next = sortCreatedNewestFirst(
        [record, ...filtered],
        MAX_ZK_COMPLIANCE_PROOFS,
      );
      await kv.del(ZK_COMPLIANCE_PROOFS_KEY);
      if (next.length > 0) {
        await kv.lpush(ZK_COMPLIANCE_PROOFS_KEY, ...next.slice().reverse());
      }
      return record;
    } catch (error) {
      console.warn("[runtime-store] KV ZK compliance write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.zkComplianceProofs = sortCreatedNewestFirst(
    [
      record,
      ...store.zkComplianceProofs.filter((item) => item.proofId !== record.proofId),
    ],
    MAX_ZK_COMPLIANCE_PROOFS,
  );
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return record;
}

export async function getZkComplianceProofs(): Promise<StoredZkComplianceProof[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredZkComplianceProof>(
        ZK_COMPLIANCE_PROOFS_KEY,
        0,
        MAX_ZK_COMPLIANCE_PROOFS - 1,
      );
      return sortCreatedNewestFirst(items ?? [], MAX_ZK_COMPLIANCE_PROOFS);
    } catch (error) {
      console.warn("[runtime-store] KV ZK compliance read failed, using local fallback:", error);
    }
  }

  return sortCreatedNewestFirst(
    (await loadLocalStore()).zkComplianceProofs,
    MAX_ZK_COMPLIANCE_PROOFS,
  );
}

export async function getLatestZkComplianceProof(input: {
  walletAddress?: string;
  agentId?: string;
  networkKey?: WalletNetworkKey;
} = {}): Promise<StoredZkComplianceProof | null> {
  const proofs = await getZkComplianceProofs();
  return (
    proofs.find(
      (proof) =>
        (!input.networkKey || proof.networkKey === input.networkKey) &&
        (!input.walletAddress || sameWalletAddress(proof.walletAddress, input.walletAddress)) &&
        (!input.agentId || proof.agentId === input.agentId),
    ) ?? null
  );
}

export async function getCrossAgentHandshakes(): Promise<StoredCrossAgentHandshake[]> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredCrossAgentHandshake>(
        CROSS_AGENT_HANDSHAKES_KEY,
        0,
        MAX_CROSS_AGENT_HANDSHAKES - 1,
      );
      return sortCreatedNewestFirst(items ?? [], MAX_CROSS_AGENT_HANDSHAKES);
    } catch (error) {
      console.warn("[runtime-store] KV handshake read failed, using local fallback:", error);
    }
  }

  return sortCreatedNewestFirst(
    (await loadLocalStore()).crossAgentHandshakes,
    MAX_CROSS_AGENT_HANDSHAKES,
  );
}

export async function getLatestCrossAgentHandshake(input: {
  walletAddress?: string;
  requestingAgent?: string;
  respondingAgent?: string;
  networkKey?: WalletNetworkKey;
} = {}): Promise<StoredCrossAgentHandshake | null> {
  const handshakes = await getCrossAgentHandshakes();
  return (
    handshakes.find(
      (handshake) =>
        (!input.networkKey || handshake.networkKey === input.networkKey) &&
        (!input.walletAddress || sameWalletAddress(handshake.walletAddress, input.walletAddress)) &&
        (!input.requestingAgent || handshake.requestingAgent === input.requestingAgent) &&
        (!input.respondingAgent || handshake.respondingAgent === input.respondingAgent),
    ) ?? null
  );
}

export async function getSettingsState(): Promise<SettingsState> {
  if (isRuntimeStoreKvConfigured()) {
    try {
      const stored = await kv.get<SettingsState>(SETTINGS_KEY);
      if (stored) return { ...stored };
    } catch (error) {
      console.warn("[runtime-store] KV settings read failed:", error);
    }
  }
  return { ...(await loadLocalStore()).settings };
}

export async function getSettingsResponse() {
  return buildSettingsResponse(await getSettingsState());
}

export async function updateSettingsState(
  patch: SettingsPatchInput,
): Promise<SettingsState> {
  const current = await getSettingsState();
  const next = { ...current, ...patch };
  if (isRuntimeStoreKvConfigured()) {
    try {
      await kv.set(SETTINGS_KEY, next);
      return next;
    } catch (error) {
      console.warn("[runtime-store] KV settings write failed:", error);
    }
  }
  const store = await loadLocalStore();
  store.settings = next;
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return next;
}

function sameAgentNftMetadata(
  left: StoredAgentNftMetadata,
  right: StoredAgentNftMetadata,
) {
  return (
    left.networkKey === right.networkKey &&
    left.contentHash.toLowerCase() === right.contentHash.toLowerCase()
  );
}

export async function recordAgentNftMetadata(
  record: StoredAgentNftMetadata,
): Promise<StoredAgentNftMetadata> {
  const normalizedRecord = {
    ...record,
    contentHash: record.contentHash.toLowerCase(),
  };

  if (isRuntimeStoreKvConfigured()) {
    try {
      const existing = await kv.lrange<StoredAgentNftMetadata>(
        AGENT_NFT_METADATA_KEY,
        0,
        MAX_AGENT_NFT_METADATA - 1,
      );
      const next = [
        normalizedRecord,
        ...(existing ?? []).filter((item) => !sameAgentNftMetadata(item, normalizedRecord)),
      ].slice(0, MAX_AGENT_NFT_METADATA);
      await kv.del(AGENT_NFT_METADATA_KEY);
      if (next.length) await kv.rpush(AGENT_NFT_METADATA_KEY, ...next);
      return normalizedRecord;
    } catch (error) {
      console.warn("[runtime-store] KV Agent NFT metadata write failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  store.agentNftMetadata = [
    normalizedRecord,
    ...store.agentNftMetadata.filter((item) => !sameAgentNftMetadata(item, normalizedRecord)),
  ].slice(0, MAX_AGENT_NFT_METADATA);
  globalStore.__yieldboostRuntimeStore = store;
  await writeLocalStoreFile(store);
  return normalizedRecord;
}

export async function getAgentNftMetadataByContentHash(
  networkKey: WalletNetworkKey,
  contentHash: string,
): Promise<StoredAgentNftMetadata | null> {
  const normalizedHash = contentHash.toLowerCase();

  if (isRuntimeStoreKvConfigured()) {
    try {
      const items = await kv.lrange<StoredAgentNftMetadata>(
        AGENT_NFT_METADATA_KEY,
        0,
        MAX_AGENT_NFT_METADATA - 1,
      );
      return (
        (items ?? []).find(
          (item) =>
            item.networkKey === networkKey &&
            item.contentHash.toLowerCase() === normalizedHash,
        ) ?? null
      );
    } catch (error) {
      console.warn("[runtime-store] KV Agent NFT metadata read failed, using local fallback:", error);
    }
  }

  const store = await loadLocalStore();
  return (
    store.agentNftMetadata.find(
      (item) =>
        item.networkKey === networkKey &&
        item.contentHash.toLowerCase() === normalizedHash,
    ) ?? null
  );
}
