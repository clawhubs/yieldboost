"use server";

import { revalidatePath } from "next/cache";

import { createManagedApiKey, revokeManagedApiKey, verify0GCheckout } from "@/lib/dev-portal";
import { getPortalSession } from "@/lib/dev-portal-auth";
import { getYaApiPlan } from "@/lib/ya-api-plans";

export interface CreateApiKeyActionState {
  success: boolean;
  apiKey: string | null;
  label: string | null;
  error: string | null;
}

function compactTx(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function appendPaymentNote(input: {
  notes: string;
  planName: string;
  checkoutPrice0g: string;
  listPrice0g?: string | null;
  txHash: string;
  integrityHash?: string;
  adminBypass?: boolean;
}) {
  const planNote = input.adminBypass
    ? `0G plan ${input.planName}: owner console bypass`
    : input.checkoutPrice0g !== "0"
      ? `0G plan ${input.planName}: ${input.checkoutPrice0g} 0G${input.listPrice0g ? ` (list ${input.listPrice0g} 0G)` : ""}; tx ${compactTx(input.txHash)}; proof ${input.integrityHash ? compactTx(`0x${input.integrityHash}`) : "pending"}`
      : `0G plan ${input.planName}: free trial`;
  return [planNote, input.notes].filter(Boolean).join(" | ").slice(0, 240);
}

function planExpiryIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function createApiKeyAction(
  _previousState: CreateApiKeyActionState,
  formData: FormData,
): Promise<CreateApiKeyActionState> {
  const session = await getPortalSession();
  const appName = String(formData.get("app_name") || "").trim();
  const ownerLabel = String(formData.get("owner_label") || "").trim();
  const submittedOwnerWalletAddress = String(formData.get("owner_wallet_address") || "").trim();
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
    const ownerWalletAddress =
      session.role === "owner" && submittedOwnerWalletAddress
        ? submittedOwnerWalletAddress
        : session.walletAddress;
    let checkoutProofHash: string | undefined;

    if (session.role !== "owner") {
      const checkout = await verify0GCheckout({
        walletAddress: ownerWalletAddress,
        planId: plan.id,
        amountOg: plan.checkoutPrice0g,
        txHash: paymentTxHash || undefined,
      });
      checkoutProofHash = checkout.integrity_hash;
    }

    const created = await createManagedApiKey({
      appName,
      ownerLabel: ownerLabel || undefined,
      ownerWalletAddress,
      environment,
      notes: appendPaymentNote({
        notes,
        planName: plan.name,
        checkoutPrice0g: plan.checkoutPrice0g,
        listPrice0g: plan.listPrice0g,
        txHash: paymentTxHash,
        integrityHash: checkoutProofHash,
        adminBypass: session.role === "owner",
      }),
      scopes: plan.scopes,
      planId: plan.id,
      planName: plan.name,
      planPriceOg: plan.checkoutPrice0g,
      planMaxKeys: plan.apiKeys,
      planQuotaMonthly: plan.monthlyQuota,
      planExpiresAt: planExpiryIso(plan.expiresInDays),
      checkoutTxHash: paymentTxHash || undefined,
      checkoutIntegrityHash: checkoutProofHash,
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
