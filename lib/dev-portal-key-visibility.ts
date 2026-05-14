import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { verifyMessage } from "ethers";

const HIDE_KEY_CHALLENGE_COOKIE = "yb_dev_hide_key_challenge";
const HIDDEN_KEYS_COOKIE = "yb_dev_hidden_keys";
const HIDE_KEY_CHALLENGE_TTL_SECONDS = 5 * 60;

function getSecret() {
  return process.env.INTEGRITY_MASTER_KEY || "dev-master-key-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readSignedCookie(raw: string | undefined) {
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(sign(encoded), signature)) return null;
  try {
    return JSON.parse(fromBase64Url(encoded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writeSignedCookiePayload(payload: Record<string, unknown>) {
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function getHideKeyMessage(input: {
  walletAddress: string;
  keyId: string;
  nonce: string;
  expiresAt: number;
}) {
  return [
    "YieldBoost Developer Dashboard Key Removal",
    "",
    "Sign this message to remove a revoked API key from the /dev/apps dashboard view.",
    `Wallet: ${input.walletAddress}`,
    `Key ID: ${input.keyId}`,
    `Nonce: ${input.nonce}`,
    `Expires At: ${new Date(input.expiresAt).toISOString()}`,
    "Domain: dev.yieldboostai.xyz",
  ].join("\n");
}

export async function createHideKeyChallenge(input: {
  walletAddress: string;
  keyId: string;
}) {
  const nonce = randomUUID().replace(/-/g, "");
  const expiresAt = Date.now() + HIDE_KEY_CHALLENGE_TTL_SECONDS * 1000;
  const payload = {
    walletAddress: input.walletAddress.toLowerCase(),
    keyId: input.keyId,
    nonce,
    expiresAt,
  };
  const cookieStore = await cookies();
  cookieStore.set(
    HIDE_KEY_CHALLENGE_COOKIE,
    writeSignedCookiePayload(payload),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: HIDE_KEY_CHALLENGE_TTL_SECONDS,
    },
  );

  return {
    message: getHideKeyMessage({
      walletAddress: input.walletAddress,
      keyId: input.keyId,
      nonce,
      expiresAt,
    }),
    expiresAt,
  };
}

export async function verifyHideKeySignature(input: {
  walletAddress: string;
  keyId: string;
  message: string;
  signature: string;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(HIDE_KEY_CHALLENGE_COOKIE)?.value;
  const payload = readSignedCookie(raw);
  if (!payload) {
    throw new Error("Key removal challenge is missing or invalid.");
  }

  const walletAddress = String(payload.walletAddress || "").toLowerCase();
  const keyId = String(payload.keyId || "");
  const nonce = String(payload.nonce || "");
  const expiresAt = Number(payload.expiresAt || 0);
  if (!walletAddress || !keyId || !nonce || !expiresAt || Date.now() > expiresAt) {
    throw new Error("Key removal challenge has expired.");
  }

  if (walletAddress !== input.walletAddress.toLowerCase() || keyId !== input.keyId) {
    throw new Error("Key removal challenge mismatch.");
  }

  const expected = getHideKeyMessage({
    walletAddress: input.walletAddress,
    keyId: input.keyId,
    nonce,
    expiresAt,
  });
  if (input.message !== expected) {
    throw new Error("Key removal message mismatch.");
  }

  const recovered = verifyMessage(input.message, input.signature);
  if (recovered.toLowerCase() !== input.walletAddress.toLowerCase()) {
    throw new Error("Wallet signature verification failed.");
  }

  cookieStore.delete(HIDE_KEY_CHALLENGE_COOKIE);
}

export async function getHiddenDashboardKeyIds(walletAddress: string) {
  const cookieStore = await cookies();
  const payload = readSignedCookie(cookieStore.get(HIDDEN_KEYS_COOKIE)?.value);
  const byWallet =
    payload && typeof payload.byWallet === "object" && payload.byWallet
      ? (payload.byWallet as Record<string, unknown>)
      : {};
  const hidden = byWallet[walletAddress.toLowerCase()];
  if (!Array.isArray(hidden)) {
    return [];
  }
  return hidden.filter((value): value is string => typeof value === "string");
}

export async function hideDashboardKeyId(input: {
  walletAddress: string;
  keyId: string;
}) {
  const cookieStore = await cookies();
  const payload = readSignedCookie(cookieStore.get(HIDDEN_KEYS_COOKIE)?.value);
  const byWallet =
    payload && typeof payload.byWallet === "object" && payload.byWallet
      ? { ...(payload.byWallet as Record<string, unknown>) }
      : {};
  const walletKey = input.walletAddress.toLowerCase();
  const existing = Array.isArray(byWallet[walletKey])
    ? (byWallet[walletKey] as unknown[]).filter((value): value is string => typeof value === "string")
    : [];

  byWallet[walletKey] = Array.from(new Set([...existing, input.keyId])).slice(-100);

  cookieStore.set(
    HIDDEN_KEYS_COOKIE,
    writeSignedCookiePayload({ byWallet }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    },
  );
}
