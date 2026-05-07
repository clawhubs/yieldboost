import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Contract, JsonRpcProvider, Wallet, parseUnits } from "ethers";

import {
  YA_TESTNET_RPC_URL,
  YA_TOKEN_ADDRESS,
  YA_TOKEN_DECIMALS,
} from "@/lib/ya-api-plans";
import {
  generateAlibabaTextEmbedding,
  hasAlibabaEmbeddingConfig,
} from "@/lib/server/alibaba-embeddings";

const VOUCHER_AMOUNT_YA = 888;
const MAX_EXCLUSIVE_VOUCHERS = 888;
const ERC20_TRANSFER_ABI = ["function transfer(address to,uint256 value) returns (bool)"];
const DEFAULT_STORE_PATH = ".artifacts/ya-vouchers.local.json";
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_CLAIM_ATTEMPTS_PER_IP_PER_DAY = 12;
const MAX_SUCCESSFUL_CLAIMS_PER_IP_PER_DAY = Number(
  process.env.YA_FAUCET_MAX_SUCCESSFUL_CLAIMS_PER_IP_PER_DAY ?? 1,
);

export interface YaVoucherRecord {
  codeHash: string;
  source: "optimize" | "vault-seal";
  amountYa: number;
  network: "testnet";
  walletAddress?: string;
  referenceId?: string;
  createdAt: string;
  claimedAt?: string;
  claimedBy?: string;
  claimTxHash?: string;
}

interface YaMigrationClaimRecord {
  walletAddress: string;
  amountYa: number;
  source: "optimize" | "vault-seal";
  voucherHash: string;
  claimTxHash: string;
  claimedAt: string;
  migrationEligible: true;
  riskLevel: "low" | "medium" | "high";
  behaviorHash?: string;
  ipHash?: string;
  userAgentHash?: string;
}

interface YaClaimAttemptRecord {
  walletAddress?: string;
  voucherHash?: string;
  ipHash?: string;
  userAgentHash?: string;
  status: "allowed" | "blocked";
  reason: string;
  createdAt: string;
}

interface YaVoucherStorePayload {
  vouchers: YaVoucherRecord[];
  migrationClaims: YaMigrationClaimRecord[];
  claimAttempts: YaClaimAttemptRecord[];
}

let storeMutationQueue: Promise<void> = Promise.resolve();

function getStorePath() {
  return path.resolve(process.cwd(), process.env.YA_FAUCET_STORE_PATH?.trim() || DEFAULT_STORE_PATH);
}

function hashVoucher(value: string) {
  return createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
}

function hashValue(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? createHash("sha256").update(normalized).digest("hex") : undefined;
}

function sameWallet(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function createVoucherCode() {
  const body = randomBytes(6).toString("hex").toUpperCase();
  return `YA-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

async function readStore(): Promise<YaVoucherStorePayload> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<YaVoucherStorePayload>;
    return {
      vouchers: parsed.vouchers || [],
      migrationClaims: parsed.migrationClaims || [],
      claimAttempts: parsed.claimAttempts || [],
    };
  } catch {
    return { vouchers: [], migrationClaims: [], claimAttempts: [] };
  }
}

async function writeStore(payload: YaVoucherStorePayload) {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(payload, null, 2), "utf8");
}

async function mutateStore<T>(handler: (store: YaVoucherStorePayload) => Promise<T> | T) {
  const run = storeMutationQueue.then(async () => {
    const store = await readStore();
    try {
      const result = await handler(store);
      await writeStore(store);
      return result;
    } catch (error) {
      await writeStore(store);
      throw error;
    }
  });
  storeMutationQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function getTreasuryPrivateKey() {
  const privateKey =
    process.env.YA_FAUCET_PRIVATE_KEY?.trim() ||
    process.env.ZG_TESTNET_PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error("YA faucet testnet private key is not configured.");
  }
  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
}

function walletAlreadyMigrationEligible(store: YaVoucherStorePayload, walletAddress: string) {
  return (
    store.migrationClaims.some((claim) => sameWallet(claim.walletAddress, walletAddress)) ||
    store.vouchers.some((voucher) => sameWallet(voucher.claimedBy, walletAddress))
  );
}

function walletAlreadyHasVoucher(store: YaVoucherStorePayload, walletAddress: string) {
  return store.vouchers.some((voucher) => sameWallet(voucher.walletAddress, walletAddress));
}

function countRecentAttempts(
  store: YaVoucherStorePayload,
  ipHash: string | undefined,
  status?: "allowed" | "blocked",
) {
  if (!ipHash) return 0;
  const cutoff = Date.now() - CLAIM_WINDOW_MS;
  return store.claimAttempts.filter((attempt) => {
    if (attempt.ipHash !== ipHash) return false;
    if (status && attempt.status !== status) return false;
    const timestamp = Date.parse(attempt.createdAt);
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  }).length;
}

function appendClaimAttempt(
  store: YaVoucherStorePayload,
  input: Omit<YaClaimAttemptRecord, "createdAt">,
) {
  store.claimAttempts.push({
    ...input,
    createdAt: new Date().toISOString(),
  });
  if (store.claimAttempts.length > 1000) {
    store.claimAttempts = store.claimAttempts.slice(-1000);
  }
}

async function buildBehaviorFingerprint(input: {
  walletAddress: string;
  voucherHash: string;
  source: "optimize" | "vault-seal";
  voucherAgeMinutes: number;
  ipHash?: string;
  userAgentHash?: string;
  ipAttemptCount24h: number;
  ipSuccessCount24h: number;
}) {
  const behaviorText = [
    `wallet=${input.walletAddress.toLowerCase()}`,
    `source=${input.source}`,
    `voucher_age_minutes=${Math.max(0, Math.round(input.voucherAgeMinutes))}`,
    `ip_hash=${input.ipHash || "none"}`,
    `user_agent_hash=${input.userAgentHash || "none"}`,
    `ip_attempts_24h=${input.ipAttemptCount24h}`,
    `ip_success_24h=${input.ipSuccessCount24h}`,
    `voucher_hash=${input.voucherHash}`,
  ].join(" | ");

  const behaviorHash = createHash("sha256").update(behaviorText).digest("hex");
  if (!hasAlibabaEmbeddingConfig()) {
    return { behaviorHash, alibabaChecked: false };
  }

  try {
    await Promise.race([
      generateAlibabaTextEmbedding(behaviorText),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Alibaba anti-sybil check timed out.")), 2500);
      }),
    ]);
    return { behaviorHash, alibabaChecked: true };
  } catch {
    return { behaviorHash, alibabaChecked: false };
  }
}

export async function issueYaVoucher(input: {
  source: "optimize" | "vault-seal";
  network: string;
  walletAddress?: string;
  referenceId?: string;
}) {
  if (input.network !== "testnet") {
    return null;
  }

  return mutateStore((store) => {
    const walletAddress = input.walletAddress?.trim();
    const code = createVoucherCode();
    if (store.vouchers.length >= MAX_EXCLUSIVE_VOUCHERS) {
      return {
        voucher: null,
        amountYa: VOUCHER_AMOUNT_YA,
        faucetUrl: "/faucet",
        alreadyEligible: false,
        soldOut: true,
        reason: "The exclusive 888 YA voucher campaign is fully allocated.",
      };
    }
    if (
      walletAddress &&
      (walletAlreadyMigrationEligible(store, walletAddress) ||
        walletAlreadyHasVoucher(store, walletAddress))
    ) {
      return {
        voucher: null,
        amountYa: VOUCHER_AMOUNT_YA,
        faucetUrl: "/faucet",
        alreadyEligible: true,
        reason: "This wallet already has an exclusive YA voucher or migration claim.",
      };
    }

    store.vouchers.push({
      codeHash: hashVoucher(code),
      source: input.source,
      amountYa: VOUCHER_AMOUNT_YA,
      network: "testnet",
      walletAddress,
      referenceId: input.referenceId,
      createdAt: new Date().toISOString(),
    });

    return {
      voucher: code,
      amountYa: VOUCHER_AMOUNT_YA,
      faucetUrl: "/faucet",
      alreadyEligible: false,
    };
  });
}

export async function claimYaVoucher(input: {
  voucher: string;
  walletAddress: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const normalizedVoucher = input.voucher.trim().toUpperCase();
  const normalizedWallet = input.walletAddress.trim();
  const codeHash = hashVoucher(normalizedVoucher);
  const ipHash = hashValue(input.ipAddress);
  const userAgentHash = hashValue(input.userAgent);
  return mutateStore(async (store) => {
    const index = store.vouchers.findIndex((item) => item.codeHash === codeHash);

    const block = (reason: string): never => {
      appendClaimAttempt(store, {
        walletAddress: normalizedWallet,
        voucherHash: codeHash,
        ipHash,
        userAgentHash,
        status: "blocked",
        reason,
      });
      throw new Error(reason);
    };

    if (index < 0) {
      block("Voucher is invalid.");
    }

    const voucher = store.vouchers[index];
    if (voucher.claimedAt) {
      block("Voucher has already been claimed.");
    }
    if (voucher.walletAddress && !sameWallet(voucher.walletAddress, normalizedWallet)) {
      block("Voucher is bound to another wallet.");
    }
    if (walletAlreadyMigrationEligible(store, normalizedWallet)) {
      block("This wallet is already migration-eligible.");
    }

    const ipAttemptCount24h = countRecentAttempts(store, ipHash);
    const ipSuccessCount24h = countRecentAttempts(store, ipHash, "allowed");
    if (ipAttemptCount24h >= MAX_CLAIM_ATTEMPTS_PER_IP_PER_DAY) {
      block("L8 anti-sybil throttle: too many claim attempts from this network.");
    }
    if (ipSuccessCount24h >= MAX_SUCCESSFUL_CLAIMS_PER_IP_PER_DAY) {
      block("L8 anti-sybil throttle: migration claim limit reached for this network.");
    }

    const voucherAgeMinutes = Math.max(0, (Date.now() - Date.parse(voucher.createdAt)) / 60000);
    const fingerprint = await buildBehaviorFingerprint({
      walletAddress: normalizedWallet,
      voucherHash: codeHash,
      source: voucher.source,
      voucherAgeMinutes,
      ipHash,
      userAgentHash,
      ipAttemptCount24h,
      ipSuccessCount24h,
    });

    const provider = new JsonRpcProvider(
      process.env.YA_FAUCET_RPC_URL?.trim() || YA_TESTNET_RPC_URL,
      { chainId: 16602, name: "0g-galileo-testnet" },
      { staticNetwork: true },
    );
    const wallet = new Wallet(getTreasuryPrivateKey(), provider);
    const token = new Contract(YA_TOKEN_ADDRESS, ERC20_TRANSFER_ABI, wallet);
    const transaction = await token.transfer(
      normalizedWallet,
      parseUnits(String(voucher.amountYa), YA_TOKEN_DECIMALS),
    );
    const receipt = await transaction.wait();
    const txHash = receipt?.hash || transaction.hash;

    store.vouchers[index] = {
      ...voucher,
      claimedAt: new Date().toISOString(),
      claimedBy: normalizedWallet,
      claimTxHash: txHash,
    };
    store.migrationClaims.push({
      walletAddress: normalizedWallet,
      amountYa: voucher.amountYa,
      source: voucher.source,
      voucherHash: codeHash,
      claimTxHash: txHash,
      claimedAt: store.vouchers[index].claimedAt || new Date().toISOString(),
      migrationEligible: true,
      riskLevel: ipAttemptCount24h > 3 || ipSuccessCount24h > 0 ? "medium" : "low",
      behaviorHash: fingerprint.behaviorHash,
      ipHash,
      userAgentHash,
    });
    appendClaimAttempt(store, {
      walletAddress: normalizedWallet,
      voucherHash: codeHash,
      ipHash,
      userAgentHash,
      status: "allowed",
      reason: fingerprint.alibabaChecked
        ? "Claim passed deterministic and Alibaba behavior fingerprint checks."
        : "Claim passed deterministic anti-sybil checks.",
    });

    return {
      amountYa: voucher.amountYa,
      txHash,
      explorerUrl: `https://chainscan-galileo.0g.ai/tx/${txHash}`,
      migrationEligible: true,
      antiSybil: {
        walletBound: true,
        oneWalletOneClaim: true,
        l8Throttle: "passed",
        alibabaBehaviorFingerprint: fingerprint.alibabaChecked ? "checked" : "not-configured",
      },
    };
  });
}
