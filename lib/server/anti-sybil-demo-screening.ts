import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  generateAlibabaTextEmbedding,
  hasAlibabaEmbeddingConfig,
} from "@/lib/server/alibaba-embeddings";

interface AntiSybilDemoAttemptRecord {
  requestId: string;
  walletHash: string;
  ipHash?: string;
  userAgentHash?: string;
  deviceLabel?: string;
  sessionId?: string;
  status: "allowed" | "blocked";
  createdAt: string;
}

interface AntiSybilDemoStore {
  attempts: AntiSybilDemoAttemptRecord[];
}

const DEFAULT_STORE_PATH = ".artifacts/anti-sybil-demo-screening.local.json";
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_STORE_RECORDS = 1500;
const MAX_ATTEMPTS_PER_IP_PER_DAY = 3;
const MAX_SUCCESSFUL_SCREENS_PER_IP_PER_DAY = 1;
const MAX_SUCCESSFUL_SCREENS_PER_WALLET_PER_DAY = 1;

let storeMutationQueue: Promise<void> = Promise.resolve();

function sha256Hex(value: unknown) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function hashValue(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? sha256Hex(normalized) : undefined;
}

function getClientIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    undefined
  );
}

function getStorePath() {
  return path.resolve(
    process.cwd(),
    process.env.ANTI_SYBIL_DEMO_SCREENING_STORE_PATH?.trim() || DEFAULT_STORE_PATH,
  );
}

async function readStore(): Promise<AntiSybilDemoStore> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AntiSybilDemoStore>;
    return { attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [] };
  } catch {
    return { attempts: [] };
  }
}

async function writeStore(payload: AntiSybilDemoStore) {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(payload, null, 2), "utf8");
}

async function mutateStore<T>(handler: (store: AntiSybilDemoStore) => Promise<T> | T) {
  const run = storeMutationQueue.then(async () => {
    const store = await readStore();
    const cutoff = Date.now() - WINDOW_MS;
    store.attempts = store.attempts.filter((record) => {
      const timestamp = Date.parse(record.createdAt);
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });
    if (store.attempts.length > MAX_STORE_RECORDS) {
      store.attempts = store.attempts.slice(-MAX_STORE_RECORDS);
    }
    const result = await handler(store);
    await writeStore(store);
    return result;
  });
  storeMutationQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function buildBehaviorFingerprint(input: {
  walletHash: string;
  ipHash?: string;
  userAgentHash?: string;
  deviceLabel?: string;
  sessionId?: string;
  intent?: string;
  ipAttempts24h: number;
  ipSuccess24h: number;
  walletSuccess24h: number;
}) {
  const behaviorText = [
    `wallet_hash=${input.walletHash}`,
    `ip_hash=${input.ipHash || "none"}`,
    `user_agent_hash=${input.userAgentHash || "none"}`,
    `device_label=${input.deviceLabel || "none"}`,
    `session_id=${input.sessionId || "none"}`,
    `intent=${input.intent || "none"}`,
    `ip_attempts_24h=${input.ipAttempts24h}`,
    `ip_success_24h=${input.ipSuccess24h}`,
    `wallet_success_24h=${input.walletSuccess24h}`,
  ].join(" | ");

  const behaviorHash = sha256Hex(behaviorText);
  if (!hasAlibabaEmbeddingConfig()) {
    return {
      behaviorHash,
      alibabaChecked: false,
      alibabaVectorDigest: null,
    };
  }

  try {
    const embedding = await Promise.race([
      generateAlibabaTextEmbedding(behaviorText),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Alibaba fingerprint timed out.")), 2500);
      }),
    ]);
    return {
      behaviorHash,
      alibabaChecked: true,
      alibabaVectorDigest: Array.isArray(embedding) ? sha256Hex(embedding.slice(0, 32)) : null,
    };
  } catch {
    return {
      behaviorHash,
      alibabaChecked: false,
      alibabaVectorDigest: null,
    };
  }
}

export async function runAntiSybilDemoScreening(input: {
  headers: Headers;
  walletAddress: string;
  sessionId?: string;
  deviceLabel?: string;
  intent?: string;
}) {
  return mutateStore(async (store) => {
    const requestId = `anti-sybil-demo-${randomUUID()}`;
    const ipHash = hashValue(getClientIp(input.headers));
    const userAgentHash = hashValue(input.headers.get("user-agent"));
    const walletHash = sha256Hex(input.walletAddress.toLowerCase());
    const now = new Date().toISOString();

    const ipAttempts24h = ipHash
      ? store.attempts.filter((record) => record.ipHash === ipHash).length
      : 0;
    const ipSuccess24h = ipHash
      ? store.attempts.filter(
          (record) => record.ipHash === ipHash && record.status === "allowed",
        ).length
      : 0;
    const walletSuccess24h = store.attempts.filter(
      (record) => record.walletHash === walletHash && record.status === "allowed",
    ).length;

    const fingerprint = await buildBehaviorFingerprint({
      walletHash,
      ipHash,
      userAgentHash,
      deviceLabel: input.deviceLabel,
      sessionId: input.sessionId,
      intent: input.intent,
      ipAttempts24h,
      ipSuccess24h,
      walletSuccess24h,
    });

    let reason = "Protected perimeter passed.";
    let status: "allowed" | "blocked" = "allowed";

    if (ipAttempts24h >= MAX_ATTEMPTS_PER_IP_PER_DAY) {
      status = "blocked";
      reason = "Anti-sybil demo lane blocked this network after too many attempts in the current 24h window.";
    } else if (ipSuccess24h >= MAX_SUCCESSFUL_SCREENS_PER_IP_PER_DAY) {
      status = "blocked";
      reason = "Anti-sybil demo lane allows only one successful screen per IP in the current 24h window.";
    } else if (walletSuccess24h >= MAX_SUCCESSFUL_SCREENS_PER_WALLET_PER_DAY) {
      status = "blocked";
      reason = "This wallet already consumed its anti-sybil demo allowance for the current 24h window.";
    }

    store.attempts.push({
      requestId,
      walletHash,
      ipHash,
      userAgentHash,
      deviceLabel: input.deviceLabel,
      sessionId: input.sessionId,
      status,
      createdAt: now,
    });

    return {
      allowed: status === "allowed",
      requestId,
      screening: {
        anti_sybil: status === "allowed" ? "passed" : "blocked",
        mode: "public-demo-lane",
        ip_attempts_24h: ipAttempts24h + 1,
        ip_success_24h: ipSuccess24h + (status === "allowed" ? 1 : 0),
        wallet_success_24h: walletSuccess24h + (status === "allowed" ? 1 : 0),
        alibaba_behavior_fingerprint: fingerprint.alibabaChecked ? "checked" : "not-configured",
        alibaba_vector_digest: fingerprint.alibabaVectorDigest,
        behavior_hash: fingerprint.behaviorHash,
        perimeter_note:
          "Public anti-sybil demo lane allows one successful screen per IP and one successful screen per wallet in each rolling 24h window.",
      },
      error: status === "allowed" ? null : reason,
    };
  });
}
