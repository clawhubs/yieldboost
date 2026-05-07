import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { kv } from "@vercel/kv";
import { Redis } from "@upstash/redis";
import type { OptimizationResult } from "@/lib/optimizations";
import type { WalletNetworkKey } from "@/lib/wallet";

const OPTIMIZATION_CACHE_KEY = "yieldboost:optimization-cache";
const OPTIMIZATION_CACHE_VERSION = "native-0g-v3";
const LOCAL_CACHE_PATH = path.join(process.cwd(), ".artifacts", "optimization-cache.json");
const MAX_CACHE_ENTRIES = 80;

export interface OptimizationCacheEntry {
  id: string;
  cacheVersion?: string;
  cacheKey: string;
  walletAddress?: string;
  networkKey: WalletNetworkKey;
  normalizedPrompt: string;
  compactPrompt: string;
  portfolioDigest: string;
  portfolioSignature: string;
  requestDocument: string;
  embedding: number[] | null;
  narrative: string;
  result: OptimizationResult;
  provider: string;
  computeStatus: string;
  createdAt: string;
  lastHitAt: string;
  hits: number;
}

interface OptimizationCacheStore {
  entries: OptimizationCacheEntry[];
}

const globalCacheStore = globalThis as typeof globalThis & {
  __yieldboostOptimizationCacheStore?: OptimizationCacheStore;
};

function getLocalStore(): OptimizationCacheStore {
  if (!globalCacheStore.__yieldboostOptimizationCacheStore) {
    globalCacheStore.__yieldboostOptimizationCacheStore = { entries: [] };
  }

  return globalCacheStore.__yieldboostOptimizationCacheStore;
}

function hasVercelKvConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function hasUpstashConfig() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getUpstashRedis() {
  if (!hasUpstashConfig()) {
    return null;
  }

  return Redis.fromEnv();
}

function parseTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortEntries(entries: OptimizationCacheEntry[]) {
  return [...entries]
    .sort((left, right) => parseTimestamp(right.lastHitAt) - parseTimestamp(left.lastHitAt))
    .slice(0, MAX_CACHE_ENTRIES);
}

async function readLocalFile(): Promise<OptimizationCacheStore | null> {
  try {
    const raw = await fs.readFile(LOCAL_CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<OptimizationCacheStore>;
  return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    return null;
  }
}

async function writeLocalFile(store: OptimizationCacheStore) {
  try {
    await fs.mkdir(path.dirname(LOCAL_CACHE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_CACHE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    console.warn("[optimization-cache] Local file write failed:", error);
  }
}

async function readStore(): Promise<OptimizationCacheStore> {
  if (hasVercelKvConfig()) {
    try {
      const stored = await kv.get<OptimizationCacheStore>(OPTIMIZATION_CACHE_KEY);
      if (stored?.entries) {
        return { entries: sortEntries(stored.entries) };
      }
    } catch (error) {
      console.warn("[optimization-cache] Vercel KV read failed:", error);
    }
  }

  const redis = getUpstashRedis();
  if (redis) {
    try {
      const stored = await redis.get<OptimizationCacheStore>(OPTIMIZATION_CACHE_KEY);
      if (stored?.entries) {
        return { entries: sortEntries(stored.entries) };
      }
    } catch (error) {
      console.warn("[optimization-cache] Upstash read failed:", error);
    }
  }

  const fromDisk = await readLocalFile();
  if (fromDisk) {
    globalCacheStore.__yieldboostOptimizationCacheStore = fromDisk;
    return { entries: sortEntries(fromDisk.entries) };
  }

  return getLocalStore();
}

async function writeStore(store: OptimizationCacheStore) {
  const next = { entries: sortEntries(store.entries) };

  if (hasVercelKvConfig()) {
    try {
      await kv.set(OPTIMIZATION_CACHE_KEY, next);
      globalCacheStore.__yieldboostOptimizationCacheStore = next;
      return;
    } catch (error) {
      console.warn("[optimization-cache] Vercel KV write failed:", error);
    }
  }

  const redis = getUpstashRedis();
  if (redis) {
    try {
      await redis.set(OPTIMIZATION_CACHE_KEY, next);
      globalCacheStore.__yieldboostOptimizationCacheStore = next;
      return;
    } catch (error) {
      console.warn("[optimization-cache] Upstash write failed:", error);
    }
  }

  globalCacheStore.__yieldboostOptimizationCacheStore = next;
  await writeLocalFile(next);
}

export function buildOptimizationCacheKey(input: {
  walletAddress?: string;
  networkKey: WalletNetworkKey;
  normalizedPrompt: string;
  portfolioDigest: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        walletAddress: input.walletAddress?.toLowerCase() ?? "disconnected",
        networkKey: input.networkKey,
        version: OPTIMIZATION_CACHE_VERSION,
        normalizedPrompt: input.normalizedPrompt.toLowerCase(),
        portfolioDigest: input.portfolioDigest,
      }),
    )
    .digest("hex");
}

export async function findExactOptimizationCacheEntry(cacheKey: string) {
  const store = await readStore();
  return store.entries.find((entry) => entry.cacheKey === cacheKey) ?? null;
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export async function findSimilarOptimizationCacheEntry(input: {
  walletAddress?: string;
  networkKey: WalletNetworkKey;
  portfolioSignature: string;
  embedding: number[];
  minimumSimilarity?: number;
}) {
  const store = await readStore();
  const minimumSimilarity = input.minimumSimilarity ?? 0.965;

  let bestMatch: { entry: OptimizationCacheEntry; similarity: number } | null = null;

  for (const entry of store.entries) {
    if (entry.cacheVersion !== OPTIMIZATION_CACHE_VERSION) continue;
    if (!entry.embedding?.length) continue;
    if (entry.networkKey !== input.networkKey) continue;
    if ((entry.walletAddress?.toLowerCase() ?? "") !== (input.walletAddress?.toLowerCase() ?? "")) {
      continue;
    }
    if (entry.portfolioSignature !== input.portfolioSignature) continue;

    const similarity = cosineSimilarity(input.embedding, entry.embedding);
    if (similarity < minimumSimilarity) continue;

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { entry, similarity };
    }
  }

  return bestMatch;
}

export async function upsertOptimizationCacheEntry(
  entry: OptimizationCacheEntry,
) {
  const store = await readStore();
  const filtered = store.entries.filter((item) => item.id !== entry.id);
  store.entries = sortEntries([entry, ...filtered]);
  await writeStore(store);
  return entry;
}

export async function touchOptimizationCacheEntry(
  entry: OptimizationCacheEntry,
) {
  return upsertOptimizationCacheEntry({
    ...entry,
    hits: entry.hits + 1,
    lastHitAt: new Date().toISOString(),
  });
}

export function buildOptimizationCacheEntry(input: {
  cacheKey: string;
  walletAddress?: string;
  networkKey: WalletNetworkKey;
  normalizedPrompt: string;
  compactPrompt: string;
  portfolioDigest: string;
  portfolioSignature: string;
  requestDocument: string;
  embedding: number[] | null;
  narrative: string;
  result: OptimizationResult;
  provider: string;
  computeStatus: string;
}) {
  const now = new Date().toISOString();

    return {
    id: createHash("sha256")
      .update(`${input.cacheKey}:${now}`)
      .digest("hex"),
    cacheVersion: OPTIMIZATION_CACHE_VERSION,
    cacheKey: input.cacheKey,
    walletAddress: input.walletAddress,
    networkKey: input.networkKey,
    normalizedPrompt: input.normalizedPrompt,
    compactPrompt: input.compactPrompt,
    portfolioDigest: input.portfolioDigest,
    portfolioSignature: input.portfolioSignature,
    requestDocument: input.requestDocument,
    embedding: input.embedding,
    narrative: input.narrative,
    result: input.result,
    provider: input.provider,
    computeStatus: input.computeStatus,
    createdAt: now,
    lastHitAt: now,
    hits: 1,
  } satisfies OptimizationCacheEntry;
}
