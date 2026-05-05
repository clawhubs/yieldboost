import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { verifyMessage } from "ethers";

import { getDeveloperUser, upsertDeveloperUser } from "@/lib/dev-portal-users";

const CHALLENGE_COOKIE = "yb_dev_portal_challenge";
const SESSION_COOKIE = "yb_dev_portal_session";
const CHALLENGE_TTL_SECONDS = 5 * 60;
const SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface DevPortalSession {
  walletAddress: string;
  role: "owner" | "developer";
  expiresAt: number;
}

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

function getExpectedMessage(nonce: string, expiresAt: number) {
  return [
    "YieldBoost Developer Portal Login",
    "",
    "Sign this message to register or log in with your wallet.",
    `Nonce: ${nonce}`,
    `Expires At: ${new Date(expiresAt).toISOString()}`,
    "Domain: dev.yieldboostai.xyz",
  ].join("\n");
}

function getOwnerWallets() {
  const values = [
    process.env.INTEGRITY_DEV_PORTAL_OWNER_WALLETS,
    process.env.FOUNDER_WALLET_ADDRESS,
    process.env.NEXT_PUBLIC_FOUNDER_WALLET_ADDRESS,
    process.env.NEXT_PUBLIC_DEMO_WALLET_ADDRESS,
    "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
  ]
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim())
    .filter((value) => /^0x[a-fA-F0-9]{40}$/.test(value));

  return Array.from(new Set(values.map((value) => value.toLowerCase())));
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

function getRoleForWallet(walletAddress: string) {
  if (getOwnerWallets().includes(walletAddress.toLowerCase())) {
    return "owner" as const;
  }
  return "developer" as const;
}

export async function createWalletChallenge() {
  const nonce = randomUUID().replace(/-/g, "");
  const expiresAt = Date.now() + CHALLENGE_TTL_SECONDS * 1000;
  const payload = JSON.stringify({ nonce, expiresAt });
  const encoded = toBase64Url(payload);
  const signature = sign(encoded);
  const cookieStore = await cookies();

  cookieStore.set(CHALLENGE_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  });

  return {
    message: getExpectedMessage(nonce, expiresAt),
    nonce,
    expiresAt,
  };
}

export async function verifyWalletSignature(input: {
  walletAddress: string;
  message: string;
  signature: string;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CHALLENGE_COOKIE)?.value;
  const payload = readSignedCookie(raw);
  if (!payload) {
    throw new Error("Portal login challenge is missing or invalid.");
  }

  const nonce = String(payload.nonce || "");
  const expiresAt = Number(payload.expiresAt || 0);
  if (!nonce || !expiresAt || Date.now() > expiresAt) {
    throw new Error("Portal login challenge has expired.");
  }

  const expectedMessage = getExpectedMessage(nonce, expiresAt);
  if (input.message !== expectedMessage) {
    throw new Error("Portal login message mismatch.");
  }

  const recovered = verifyMessage(input.message, input.signature);
  if (recovered.toLowerCase() !== input.walletAddress.toLowerCase()) {
    throw new Error("Wallet signature verification failed.");
  }

  const role = getRoleForWallet(recovered);
  const existing = await getDeveloperUser(recovered);
  const user = await upsertDeveloperUser({
    walletAddress: recovered,
    role: existing?.role === "owner" ? "owner" : role,
  });

  const sessionPayload = JSON.stringify({
    walletAddress: recovered,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
  const encoded = toBase64Url(sessionPayload);
  const signature = sign(encoded);

  cookieStore.set(SESSION_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  cookieStore.delete(CHALLENGE_COOKIE);

  return {
    walletAddress: recovered,
    role: user.role,
  };
}

export async function getPortalSession(): Promise<DevPortalSession | null> {
  const cookieStore = await cookies();
  const payload = readSignedCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const walletAddress = String(payload.walletAddress || "");
  const role = payload.role === "owner" ? "owner" : "developer";
  const expiresAt = Number(payload.expiresAt || 0);
  if (!walletAddress || !expiresAt || Date.now() > expiresAt) {
    return null;
  }

  return { walletAddress, role, expiresAt };
}

export async function clearPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(CHALLENGE_COOKIE);
}
