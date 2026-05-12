import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  generateAlibabaTextEmbedding,
  hasAlibabaEmbeddingConfig,
} from "@/lib/server/alibaba-embeddings";

interface NitroDemoAttemptRecord {
  requestId: string;
  ipHash?: string;
  userAgentHash?: string;
  visitorHash: string;
  action: string;
  behaviorHash: string;
  status: "allowed" | "blocked";
  createdAt: string;
}

interface NitroDemoStore {
  attempts: NitroDemoAttemptRecord[];
}

const DEFAULT_STORE_PATH = ".artifacts/aws-nitro-demo-screening.local.json";
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_STORE_RECORDS = 1500;
const MAX_ATTEMPTS_PER_IP_PER_DAY = 9;
const MAX_SUCCESSFUL_RUNS_PER_IP_PER_ACTION_PER_DAY = 1;
const MAX_SUCCESSFUL_RUNS_PER_VISITOR_PER_ACTION_PER_DAY = 1;

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
    process.env.AWS_NITRO_DEMO_SCREENING_STORE_PATH?.trim() || DEFAULT_STORE_PATH,
  );
}

async function readStore(): Promise<NitroDemoStore> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<NitroDemoStore>;
    return { attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [] };
  } catch {
    return { attempts: [] };
  }
}

async function writeStore(payload: NitroDemoStore) {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(payload, null, 2), "utf8");
}

async function mutateStore<T>(handler: (store: NitroDemoStore) => Promise<T> | T) {
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
  action: string;
  secretDigest: string;
  visitorHash: string;
  ipHash?: string;
  userAgentHash?: string;
  ipAttempts24h: number;
  visitorAttempts24h: number;
}) {
  const behaviorText = [
    `action=${input.action}`,
    `secret_digest=${input.secretDigest}`,
    `visitor_hash=${input.visitorHash}`,
    `ip_hash=${input.ipHash || "none"}`,
    `user_agent_hash=${input.userAgentHash || "none"}`,
    `ip_attempts_24h=${input.ipAttempts24h}`,
    `visitor_attempts_24h=${input.visitorAttempts24h}`,
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

export async function screenAwsNitroDemoRequest(input: {
  headers: Headers;
  action: string;
  secret: string;
  visitorId?: string;
}) {
  return mutateStore(async (store) => {
    const requestId = `nitro-demo-${randomUUID()}`;
    const ipHash = hashValue(getClientIp(input.headers));
    const userAgentHash = hashValue(input.headers.get("user-agent"));
    const visitorId = input.visitorId?.trim() || "anonymous-demo-visitor";
    const visitorHash = sha256Hex(visitorId);
    const secretDigest = sha256Hex(input.secret || "");

    const ipAttempts24h = ipHash
      ? store.attempts.filter((record) => record.ipHash === ipHash).length
      : 0;
    const ipSuccessForAction24h = ipHash
      ? store.attempts.filter(
          (record) =>
            record.ipHash === ipHash &&
            record.action === input.action &&
            record.status === "allowed",
        ).length
      : 0;
    const visitorAttempts24h = store.attempts.filter(
      (record) => record.visitorHash === visitorHash,
    ).length;
    const visitorSuccessForAction24h = store.attempts.filter(
      (record) =>
        record.visitorHash === visitorHash &&
        record.action === input.action &&
        record.status === "allowed",
    ).length;

    const fingerprint = await buildBehaviorFingerprint({
      action: input.action,
      secretDigest,
      visitorHash,
      ipHash,
      userAgentHash,
      ipAttempts24h,
      visitorAttempts24h,
    });

    const status =
      ipAttempts24h >= MAX_ATTEMPTS_PER_IP_PER_DAY ||
      ipSuccessForAction24h >= MAX_SUCCESSFUL_RUNS_PER_IP_PER_ACTION_PER_DAY ||
      visitorSuccessForAction24h >= MAX_SUCCESSFUL_RUNS_PER_VISITOR_PER_ACTION_PER_DAY
        ? "blocked"
        : "allowed";

    const reason =
      ipAttempts24h >= MAX_ATTEMPTS_PER_IP_PER_DAY
        ? "Nitro public demo lane blocked this network after too many attempts in the current 24h window."
        : ipSuccessForAction24h >= MAX_SUCCESSFUL_RUNS_PER_IP_PER_ACTION_PER_DAY
          ? "This network already used this Nitro action in the current 24h window."
          : visitorSuccessForAction24h >= MAX_SUCCESSFUL_RUNS_PER_VISITOR_PER_ACTION_PER_DAY
            ? "This visitor already used this Nitro action in the current 24h window."
            : "Protected perimeter passed.";

    store.attempts.push({
      requestId,
      ipHash,
      userAgentHash,
      visitorHash,
      action: input.action,
      behaviorHash: fingerprint.behaviorHash,
      status,
      createdAt: new Date().toISOString(),
    });

    return {
      allowed: status === "allowed",
      requestId,
      screening: {
        anti_sybil: status === "allowed" ? "passed" : "blocked",
        wallet_or_visitor_binding: "visitor-bound demo lane",
        ip_attempts_24h: ipAttempts24h + 1,
        action: input.action,
        ip_action_success_24h: ipSuccessForAction24h + (status === "allowed" ? 1 : 0),
        visitor_attempts_24h: visitorAttempts24h + 1,
        visitor_action_success_24h:
          visitorSuccessForAction24h + (status === "allowed" ? 1 : 0),
        alibaba_behavior_fingerprint: fingerprint.alibabaChecked ? "checked" : "not-configured",
        alibaba_vector_digest: fingerprint.alibabaVectorDigest,
        behavior_hash: fingerprint.behaviorHash,
        perimeter_note:
          "Public Nitro demo lane allows one successful run for each action per IP and per visitor in each rolling 24h window.",
      },
      error:
        status === "allowed"
          ? null
          : reason,
    };
  });
}
