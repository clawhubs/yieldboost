import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";

import {
  type SettingsPatchInput,
  type SettingsState,
  type StoredProofRecord,
  buildSettingsResponse,
  getDefaultSettingsState,
} from "@/lib/backend-data";
import { sameWalletAddress } from "@/lib/wallet";

const PROOFS_KEY = "yieldboost:proofs";
const SETTINGS_KEY = "yieldboost:settings";
const MAX_PROOFS = 50;
const LOCAL_STORE_PATH = path.join(process.cwd(), ".artifacts", "runtime-store.json");

export function isRuntimeStoreKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// --- In-memory fallback (for local dev without KV) ---
interface RuntimeStore {
  proofs: StoredProofRecord[];
  settings: SettingsState;
}

const globalStore = globalThis as typeof globalThis & {
  __yieldboostRuntimeStore?: RuntimeStore;
};

function getLocalStore(): RuntimeStore {
  if (!globalStore.__yieldboostRuntimeStore) {
    globalStore.__yieldboostRuntimeStore = {
      proofs: [],
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

async function readLocalStoreFile(): Promise<RuntimeStore | null> {
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<RuntimeStore>;

    return {
      proofs: Array.isArray(parsed.proofs) ? parsed.proofs : [],
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
      const filtered = (existing ?? []).filter((item) => item.cid !== record.cid);
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
    ...store.proofs.filter((item) => item.cid !== record.cid),
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
): Promise<StoredProofRecord | null> {
  const proofs = await getStoredProofs();
  return proofs.find((proof) => sameWalletAddress(proof.walletAddress, walletAddress)) ?? null;
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
