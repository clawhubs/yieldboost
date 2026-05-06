import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Contract, JsonRpcProvider, Wallet, parseUnits } from "ethers";

import {
  YA_TESTNET_RPC_URL,
  YA_TOKEN_ADDRESS,
  YA_TOKEN_DECIMALS,
} from "@/lib/ya-api-plans";

const VOUCHER_AMOUNT_YA = 888;
const ERC20_TRANSFER_ABI = ["function transfer(address to,uint256 value) returns (bool)"];
const DEFAULT_STORE_PATH = ".artifacts/ya-vouchers.local.json";

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

interface YaVoucherStorePayload {
  vouchers: YaVoucherRecord[];
}

function getStorePath() {
  return path.resolve(process.cwd(), process.env.YA_FAUCET_STORE_PATH?.trim() || DEFAULT_STORE_PATH);
}

function hashVoucher(value: string) {
  return createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
}

function createVoucherCode() {
  const body = randomBytes(6).toString("hex").toUpperCase();
  return `YA-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

async function readStore(): Promise<YaVoucherStorePayload> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<YaVoucherStorePayload>;
    return { vouchers: parsed.vouchers || [] };
  } catch {
    return { vouchers: [] };
  }
}

async function writeStore(payload: YaVoucherStorePayload) {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(payload, null, 2), "utf8");
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

export async function issueYaVoucher(input: {
  source: "optimize" | "vault-seal";
  network: string;
  walletAddress?: string;
  referenceId?: string;
}) {
  if (input.network !== "testnet") {
    return null;
  }

  const code = createVoucherCode();
  const store = await readStore();
  store.vouchers.push({
    codeHash: hashVoucher(code),
    source: input.source,
    amountYa: VOUCHER_AMOUNT_YA,
    network: "testnet",
    walletAddress: input.walletAddress,
    referenceId: input.referenceId,
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);

  return {
    voucher: code,
    amountYa: VOUCHER_AMOUNT_YA,
    faucetUrl: "/faucet",
  };
}

export async function claimYaVoucher(input: {
  voucher: string;
  walletAddress: string;
}) {
  const normalizedVoucher = input.voucher.trim().toUpperCase();
  const codeHash = hashVoucher(normalizedVoucher);
  const store = await readStore();
  const index = store.vouchers.findIndex((item) => item.codeHash === codeHash);
  if (index < 0) {
    throw new Error("Voucher is invalid.");
  }

  const voucher = store.vouchers[index];
  if (voucher.claimedAt) {
    throw new Error("Voucher has already been claimed.");
  }

  const provider = new JsonRpcProvider(
    process.env.YA_FAUCET_RPC_URL?.trim() || YA_TESTNET_RPC_URL,
    { chainId: 16602, name: "0g-galileo-testnet" },
    { staticNetwork: true },
  );
  const wallet = new Wallet(getTreasuryPrivateKey(), provider);
  const token = new Contract(YA_TOKEN_ADDRESS, ERC20_TRANSFER_ABI, wallet);
  const transaction = await token.transfer(
    input.walletAddress,
    parseUnits(String(voucher.amountYa), YA_TOKEN_DECIMALS),
  );
  const receipt = await transaction.wait();
  const txHash = receipt?.hash || transaction.hash;

  store.vouchers[index] = {
    ...voucher,
    claimedAt: new Date().toISOString(),
    claimedBy: input.walletAddress,
    claimTxHash: txHash,
  };
  await writeStore(store);

  return {
    amountYa: voucher.amountYa,
    txHash,
    explorerUrl: `https://chainscan-galileo.0g.ai/tx/${txHash}`,
  };
}
