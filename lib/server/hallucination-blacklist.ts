import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type {
  StoredBlacklistRecord,
  StoredDecisionPayload,
  StoredPortfolioSnapshot,
} from "@/lib/backend-data";
import type { IntegrityAudit } from "@/lib/integrity-audit";
import type { WalletNetworkKey } from "@/lib/wallet";
import {
  getBlacklistEntries,
  recordBlacklistEntry,
} from "@/lib/server/runtime-store";
import { uploadJsonToZeroGStorage } from "@/lib/server/zero-g-storage";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.%$]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length >= 3),
  );
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }

  return intersection / (left.size + right.size - intersection);
}

export function buildBlacklistInputDocument(input: {
  prompt?: string;
  portfolio?: Record<string, number>;
  portfolioSnapshot?: StoredPortfolioSnapshot;
  decision?: StoredDecisionPayload;
}) {
  const holdings =
    input.portfolioSnapshot?.tokens.map((token) => `${token.symbol}:${token.valueUSD}`) ??
    (input.portfolio
      ? Object.entries(input.portfolio).map(([symbol, value]) => `${symbol}:${value}`)
      : []);

  const decisionSummary = input.decision
    ? [
        input.decision.recommended,
        `${input.decision.current_apy}->${input.decision.optimized_apy}`,
        input.decision.reasoning,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return normalizeText(
    [
      input.prompt,
      holdings.sort().join(" "),
      decisionSummary,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function fingerprint(value: string) {
  return createHash("sha256").update(normalizeText(value)).digest("hex");
}

export async function findHallucinationBlacklistMatch(input: {
  networkKey: WalletNetworkKey;
  prompt?: string;
  portfolio?: Record<string, number>;
  minimumSimilarity?: number;
}) {
  const requestDocument = buildBlacklistInputDocument(input);
  const requestTokens = tokenize(requestDocument);
  const entries = await getBlacklistEntries();
  const minimumSimilarity = input.minimumSimilarity ?? 0.42;

  let bestMatch: { entry: StoredBlacklistRecord; similarity: number } | null = null;

  for (const entry of entries) {
    if (entry.networkKey && entry.networkKey !== input.networkKey) continue;

    const similarity = jaccard(requestTokens, tokenize(entry.invalidInput));
    if (similarity < minimumSimilarity) continue;

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { entry, similarity };
    }
  }

  return bestMatch;
}

export async function recordHallucinationBlacklistEntry(input: {
  networkKey: WalletNetworkKey;
  decision: StoredDecisionPayload;
  portfolioSnapshot?: StoredPortfolioSnapshot;
  audit: IntegrityAudit;
}) {
  const timestamp = new Date().toISOString();
  const invalidInput = buildBlacklistInputDocument({
    portfolioSnapshot: input.portfolioSnapshot,
    decision: input.decision,
  });
  const hallucinatedOutput =
    input.decision.reasoning ??
    `${input.decision.recommended} at ${input.decision.optimized_apy}% APY`;
  const entryFingerprint = fingerprint(
    `${input.networkKey}:${invalidInput}:${hallucinatedOutput}:${input.audit.reasons.join("|")}`,
  );
  const storagePayload = {
    appId: "yieldboost-ai",
    artifactType: "hallucination-blacklist-entry",
    timestamp,
    networkKey: input.networkKey,
    fingerprint: entryFingerprint,
    invalidInput,
    hallucinatedOutput,
    auditorReasoning: input.audit.reasons,
    auditScore: input.audit.score,
    source: input.audit.source,
  };
  const upload = await uploadJsonToZeroGStorage({
    networkKey: input.networkKey,
    payload: storagePayload,
    filenamePrefix: "yieldboost-blacklist",
    allowLocalFallback: true,
  });
  const record: StoredBlacklistRecord = {
    id: randomUUID(),
    networkKey: input.networkKey,
    cid: upload.cid,
    txHash: upload.txHash,
    blockNumber: upload.blockNumber,
    explorerUrl: upload.explorerUrl,
    fingerprint: entryFingerprint,
    invalidInput,
    hallucinatedOutput,
    auditorReasoning: input.audit.reasons,
    auditScore: input.audit.score,
    source: "integrity-auditor",
    timestamp,
    storageMode: upload.storageMode,
    note: upload.note,
  };

  return recordBlacklistEntry(record);
}
