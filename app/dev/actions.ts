"use server";

import { revalidatePath } from "next/cache";
import { getAddress, Interface, JsonRpcProvider, parseUnits } from "ethers";

import { createManagedApiKey, revokeManagedApiKey } from "@/lib/dev-portal";
import { getPortalSession } from "@/lib/dev-portal-auth";
import {
  getYaApiPlan,
  getYaTreasuryAddress,
  YA_TESTNET_CHAIN_ID,
  YA_TESTNET_RPC_URL,
  YA_TOKEN_ADDRESS,
  YA_TOKEN_DECIMALS,
} from "@/lib/ya-api-plans";

export interface CreateApiKeyActionState {
  success: boolean;
  apiKey: string | null;
  label: string | null;
  error: string | null;
}

const TRANSFER_EVENT = new Interface(["event Transfer(address indexed from,address indexed to,uint256 value)"]);

function compactTx(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function appendPaymentNote(input: {
  notes: string;
  planName: string;
  priceYa: number;
  txHash: string;
  adminBypass?: boolean;
}) {
  const planNote = input.adminBypass
    ? `YA plan ${input.planName}: owner console bypass`
    : input.priceYa
      ? `YA plan ${input.planName}: ${input.priceYa.toLocaleString("en-US")} YA; tx ${compactTx(input.txHash)}`
      : `YA plan ${input.planName}: free trial`;
  return [planNote, input.notes].filter(Boolean).join(" | ").slice(0, 240);
}

async function verifyYaPayment(input: {
  txHash: string;
  payerWalletAddress: string;
  amountYa: number;
}) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(input.txHash)) {
    throw new Error("Invalid YA payment transaction hash.");
  }

  const provider = new JsonRpcProvider(
    process.env.YA_PAYMENT_RPC_URL?.trim() || YA_TESTNET_RPC_URL,
    { chainId: YA_TESTNET_CHAIN_ID, name: "0g-galileo-testnet" },
    { staticNetwork: true },
  );
  const receipt = await provider.getTransactionReceipt(input.txHash);
  if (!receipt) {
    throw new Error("YA payment transaction is not confirmed yet.");
  }
  if (receipt.status !== 1) {
    throw new Error("YA payment transaction failed on-chain.");
  }

  const payerAddress = getAddress(input.payerWalletAddress);
  const treasuryAddress = getAddress(getYaTreasuryAddress());
  const tokenAddress = getAddress(YA_TOKEN_ADDRESS);
  const requiredAmount = parseUnits(String(input.amountYa), YA_TOKEN_DECIMALS);

  for (const log of receipt.logs) {
    if (getAddress(log.address) !== tokenAddress) {
      continue;
    }

    try {
      const parsed = TRANSFER_EVENT.parseLog(log);
      if (!parsed) {
        continue;
      }
      const from = getAddress(String(parsed.args.from));
      const to = getAddress(String(parsed.args.to));
      const value = BigInt(parsed.args.value);

      if (from === payerAddress && to === treasuryAddress && value >= requiredAmount) {
        return;
      }
    } catch {
      // Ignore non-Transfer logs from the token contract.
    }
  }

  throw new Error("YA payment receipt does not contain the required token transfer.");
}

export async function createApiKeyAction(
  _previousState: CreateApiKeyActionState,
  formData: FormData,
): Promise<CreateApiKeyActionState> {
  const session = await getPortalSession();
  const appName = String(formData.get("app_name") || "").trim();
  const ownerLabel = String(formData.get("owner_label") || "").trim();
  const submittedOwnerWalletAddress = String(formData.get("owner_wallet_address") || "").trim();
  const environment = String(formData.get("environment") || "testnet").trim() as
    | "testnet"
    | "mainnet"
    | "multi";
  const notes = String(formData.get("notes") || "").trim();
  const plan = getYaApiPlan(String(formData.get("plan_id") || "builder").trim());
  const paymentTxHash = String(formData.get("payment_tx_hash") || "").trim();

  if (!session) {
    return {
      success: false,
      apiKey: null,
      label: null,
      error: "Connect your developer wallet before creating an API key.",
    };
  }

  if (!appName) {
    return {
      success: false,
      apiKey: null,
      label: null,
      error: "App name is required.",
    };
  }

  try {
    const ownerWalletAddress =
      session.role === "owner" && submittedOwnerWalletAddress
        ? submittedOwnerWalletAddress
        : session.walletAddress;

    if (plan.priceYa > 0 && session.role !== "owner") {
      await verifyYaPayment({
        txHash: paymentTxHash,
        payerWalletAddress: ownerWalletAddress,
        amountYa: plan.priceYa,
      });
    }

    const created = await createManagedApiKey({
      appName,
      ownerLabel: ownerLabel || undefined,
      ownerWalletAddress,
      environment,
      notes: appendPaymentNote({
        notes,
        planName: plan.name,
        priceYa: plan.priceYa,
        txHash: paymentTxHash,
        adminBypass: session.role === "owner",
      }),
      scopes: plan.scopes,
    });

    revalidatePath("/dev");
    revalidatePath("/dev/apps");
    revalidatePath("/dev/console");

    return {
      success: true,
      apiKey: created.apiKey,
      label: created.item.app_name,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      apiKey: null,
      label: null,
      error: error instanceof Error ? error.message : "Unable to create API key.",
    };
  }
}

export async function revokeApiKeyAction(formData: FormData) {
  const keyId = String(formData.get("key_id") || "").trim();
  if (!keyId) {
    throw new Error("Key ID is required.");
  }
  await revokeManagedApiKey(keyId);
  revalidatePath("/dev");
  revalidatePath("/dev/apps");
  revalidatePath("/dev/console");
}
