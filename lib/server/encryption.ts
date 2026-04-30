import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ethers } from "ethers";

const STRATEGY_ENCRYPTION_PREFIX = "yb-aesgcm:v1:";

type CanonicalJson =
  | null
  | boolean
  | number
  | string
  | CanonicalJson[]
  | { [key: string]: CanonicalJson };

interface EncryptedEnvelopeV1 {
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
}

interface AttestationHashInput {
  contentHash: string;
  timestamp: string | number;
  provider: string;
  model?: string;
  chatId?: string;
  verified?: boolean;
  verificationMethod?: string;
}

function canonicalize(value: unknown): CanonicalJson {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)] as const);

    return Object.fromEntries(entries);
  }

  return String(value);
}

function stableStringify(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function decodeEncryptionKey(rawValue: string) {
  const normalized = rawValue.trim();
  const hexCandidate = normalized.startsWith("0x")
    ? normalized.slice(2)
    : normalized;

  if (/^[0-9a-fA-F]{64}$/.test(hexCandidate)) {
    return Buffer.from(hexCandidate, "hex");
  }

  for (const encoding of ["base64url", "base64"] as const) {
    try {
      const decoded = Buffer.from(normalized, encoding);
      if (decoded.length === 32) {
        return decoded;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    "STRATEGY_METADATA_ENCRYPTION_KEY must be a 32-byte secret encoded as 64-char hex, base64, or base64url.",
  );
}

function getStrategyEncryptionKey() {
  const rawValue = process.env.STRATEGY_METADATA_ENCRYPTION_KEY;

  if (!rawValue) {
    throw new Error(
      "Missing STRATEGY_METADATA_ENCRYPTION_KEY. Configure a 32-byte secret before minting Agent NFTs.",
    );
  }

  return decodeEncryptionKey(rawValue);
}

/**
 * Generate a deterministic hash from strategy data
 */
export function hashStrategy(data: {
  portfolio: Record<string, number>;
  decision: {
    current_apy: number;
    optimized_apy: number;
    recommended: string;
    reasoning?: string;
  };
}): string {
  const dataStr = stableStringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(dataStr));
}

/**
 * Encrypt strategy metadata using AES-256-GCM.
 */
export function encryptStrategy(data: unknown): string {
  const plaintext = Buffer.from(stableStringify(data), "utf8");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getStrategyEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const envelope: EncryptedEnvelopeV1 = {
    alg: "aes-256-gcm",
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };

  return `${STRATEGY_ENCRYPTION_PREFIX}${Buffer.from(
    JSON.stringify(envelope),
    "utf8",
  ).toString("base64url")}`;
}

/**
 * Decrypt strategy data.
 * Supports both the current AES-GCM envelope and older base64-only payloads.
 */
export function decryptStrategy(encrypted: string): unknown {
  if (encrypted.startsWith(STRATEGY_ENCRYPTION_PREFIX)) {
    const encodedEnvelope = encrypted.slice(STRATEGY_ENCRYPTION_PREFIX.length);
    const envelopeJson = Buffer.from(encodedEnvelope, "base64url").toString("utf8");
    const envelope = JSON.parse(envelopeJson) as EncryptedEnvelopeV1;

    if (envelope.alg !== "aes-256-gcm") {
      throw new Error(`Unsupported strategy metadata encryption algorithm: ${envelope.alg}`);
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getStrategyEncryptionKey(),
      Buffer.from(envelope.iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
  }

  const dataStr = Buffer.from(encrypted, "base64").toString("utf8");
  return JSON.parse(dataStr);
}

/**
 * Generate an attestation-linked hash for runtime-verified compute metadata.
 */
export function generateAttestationHash(input: AttestationHashInput): string {
  return ethers.keccak256(ethers.toUtf8Bytes(stableStringify(input)));
}
