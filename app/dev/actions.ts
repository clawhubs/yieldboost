"use server";

import { revalidatePath } from "next/cache";
import { getAddress, JsonRpcProvider, parseEther } from "ethers";

import {
  createManagedApiKey,
  getManagedApiKeys,
  revokeManagedApiKey,
  verify0GCheckout,
} from "@/lib/dev-portal";
import { getPortalSession } from "@/lib/dev-portal-auth";
import {
  get0GTreasuryAddress,
  getYaApiPlan,
  O_G_MAINNET_CHAIN_ID,
  O_G_MAINNET_RPC_URL,
} from "@/lib/ya-api-plans";
import { DEFAULT_WALLET_ADDRESS } from "@/lib/wallet";

export interface CreateApiKeyActionState {
  success: boolean;
  apiKey: string | null;
  label: string | null;
  error: string | null;
}

function compactHash(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function appendActivationNote(input: {
  notes: string;
  planName: string;
  priceLabel: string;
  listPrice0g?: string | null;
  paymentTxHash?: string;
  effectiveAmountOg?: string;
  demoWalletBypass?: boolean;
  adminBypass?: boolean;
}) {
  const planNote = input.adminBypass
    ? `0G plan ${input.planName}: owner console bypass`
    : input.paymentTxHash
      ? input.demoWalletBypass
        ? `0G plan ${input.planName}: demo-wallet gas-only checkout; tx ${compactHash(input.paymentTxHash)}`
        : `0G plan ${input.planName}: ${input.effectiveAmountOg || input.priceLabel}; tx ${compactHash(input.paymentTxHash)}${input.listPrice0g ? ` (list ${input.listPrice0g} 0G)` : ""}`
      : `0G plan ${input.planName}: free`;
  return [planNote, input.notes].filter(Boolean).join(" | ").slice(0, 240);
}

function planExpiryIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isDemoWallet(walletAddress: string) {
  return walletAddress.toLowerCase() === DEFAULT_WALLET_ADDRESS.toLowerCase();
}

async function verifyNativeOgCheckout(input: {
  txHash: string;
  payerWalletAddress: string;
  requiredAmountOg: string;
}) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(input.txHash)) {
    throw new Error("Invalid 0G payment transaction hash.");
  }

  const provider = new JsonRpcProvider(
    process.env.ZG_MAINNET_RPC_URL?.trim() || O_G_MAINNET_RPC_URL,
    { chainId: O_G_MAINNET_CHAIN_ID, name: "0g-mainnet" },
    { staticNetwork: true },
  );
  const [receipt, transaction, network] = await Promise.all([
    provider.getTransactionReceipt(input.txHash),
    provider.getTransaction(input.txHash),
    provider.getNetwork(),
  ]);

  if (Number(network.chainId) !== O_G_MAINNET_CHAIN_ID) {
    throw new Error("0G mainnet RPC is not pointing at chain 16661.");
  }
  if (!receipt) {
    throw new Error("0G payment transaction is not confirmed yet.");
  }
  if (receipt.status !== 1) {
    throw new Error("0G payment transaction failed on-chain.");
  }
  if (!transaction?.to || !transaction.from) {
    throw new Error("0G payment transaction is missing sender or recipient.");
  }

  const payerAddress = getAddress(input.payerWalletAddress);
  const treasuryAddress = getAddress(get0GTreasuryAddress());
  const fromAddress = getAddress(transaction.from);
  const toAddress = getAddress(transaction.to);
  const requiredAmount = parseEther(input.requiredAmountOg);

  if (fromAddress !== payerAddress) {
    throw new Error("0G receipt sender does not match the developer wallet.");
  }
  if (toAddress !== treasuryAddress) {
    throw new Error("0G receipt recipient does not match the treasury wallet.");
  }
  if (transaction.value < requiredAmount) {
    throw new Error("0G receipt value is below the required payment amount.");
  }
}

export async function createApiKeyAction(
  _previousState: CreateApiKeyActionState,
  formData: FormData,
): Promise<CreateApiKeyActionState> {
  const session = await getPortalSession();
  const appName = String(formData.get("app_name") || "").trim();
  const ownerLabel = String(formData.get("owner_label") || "").trim();
  const submittedOwnerWalletAddress = String(formData.get("owner_wallet_address") || "").trim();
  const paymentMode = String(formData.get("payment_mode") || "required").trim() as
    | "required"
    | "admin";
  const environment = String(formData.get("environment") || "mainnet").trim() as
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
    const usingAdminBypass = session.role === "owner" && paymentMode === "admin";
    const ownerWalletAddress =
      usingAdminBypass && submittedOwnerWalletAddress
        ? submittedOwnerWalletAddress
        : session.walletAddress;
    const demoWalletBypass = isDemoWallet(ownerWalletAddress);
    const requiredAmountOg =
      plan.checkoutPrice0g !== "0" && demoWalletBypass ? "0" : plan.checkoutPrice0g;
    let checkoutIntegrityHash: string | undefined;

    if (!usingAdminBypass && plan.checkoutPrice0g !== "0") {
      if (!paymentTxHash) {
        throw new Error("0G payment transaction hash is required.");
      }
      await verifyNativeOgCheckout({
        txHash: paymentTxHash,
        payerWalletAddress: ownerWalletAddress,
        requiredAmountOg,
      });
      const checkoutProof = await verify0GCheckout({
        walletAddress: ownerWalletAddress,
        planId: plan.id,
        amountOg: requiredAmountOg,
        txHash: paymentTxHash,
      });
      checkoutIntegrityHash = checkoutProof.integrity_hash;
    }

    const created = await createManagedApiKey({
      appName,
      ownerLabel: ownerLabel || undefined,
      ownerWalletAddress,
      environment,
      notes: appendActivationNote({
        notes,
        planName: plan.name,
        priceLabel: plan.priceLabel,
        listPrice0g: plan.listPrice0g,
        paymentTxHash: paymentTxHash || undefined,
        effectiveAmountOg: requiredAmountOg,
        demoWalletBypass,
        adminBypass: usingAdminBypass,
      }),
      scopes: plan.scopes,
      planId: plan.id,
      planName: plan.name,
      planPriceOg: plan.checkoutPrice0g,
      planMaxKeys: demoWalletBypass ? undefined : plan.apiKeys,
      planQuotaMonthly: plan.monthlyQuota,
      planExpiresAt: planExpiryIso(plan.expiresInDays),
      checkoutTxHash: paymentTxHash || undefined,
      checkoutIntegrityHash,
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
  const session = await getPortalSession();
  if (!session) {
    throw new Error("Connect your developer wallet before deleting an API key.");
  }

  const keyId = String(formData.get("key_id") || "").trim();
  if (!keyId) {
    throw new Error("Key ID is required.");
  }

  if (session.role !== "owner") {
    const payload = await getManagedApiKeys();
    const item = payload?.items.find((candidate) => candidate.key_id === keyId);
    if (!item || item.owner_wallet_address?.toLowerCase() !== session.walletAddress.toLowerCase()) {
      throw new Error("This API key does not belong to the connected wallet.");
    }
  }

  await revokeManagedApiKey(keyId);
  revalidatePath("/dev");
  revalidatePath("/dev/apps");
  revalidatePath("/dev/console");
}
