import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";

import {
  type SettingsPatchInput,
  type SettingsState,
  type StoredAgentMemoryRecord,
  type StoredBlacklistRecord,
  type StoredProofRecord,
  type StoredStressTestReport,
  buildSettingsResponse,
  getDefaultSettingsState,
} from "@/lib/backend-data";
import { sameWalletAddress } from "@/lib/wallet";

const PROOFS_KEY = "yieldboost:proofs";
const MEMORIES_KEY = "yieldboost:agent-memories";
const BLACKLIST_KEY = "yieldboost:blacklist";
const STRESS_REPORTS_KEY = "yieldboost:stress-reports";
const SETTINGS_KEY = "yieldboost:settings";
const MAX_PROOFS = 50;
const MAX_MEMORY_RECORDS = 50;
const MAX_BLACKLIST_RECORDS = 80;
const MAX_STRESS_REPORTS = 40;
const LOCAL_STORE_PATH = path.join(process.cwd(), ".artifacts", "runtime-store.json");

export function isRuntimeStoreKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// --- In-memory fallback (for local dev without KV) ---
interface RuntimeStore {
  proofs: StoredProofRecord[];
  agentMemories: StoredAgentMemoryRecord[];
  blacklist: StoredBlacklistRecord[];
  stressReports: StoredStressTestReport[];
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
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, "utf8");
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
      settings: parsed.settings
        ? { ...getDefaultSettingsState(), ...parsed.settings }
        : getDefaultSettingsState(),
    };
  } catch {
    return null;
  }
}

async function writeLocalStoreFile(store: RuntimeStore) {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    console.warn("[runtime-store] Local file write failed:", error);
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
  return record;
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
