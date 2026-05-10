"use server";

import { revalidatePath } from "next/cache";

import { createManagedApiKey, getManagedApiKeys, revokeManagedApiKey } from "@/lib/dev-portal";
import { verifyPlanActivationSignature } from "@/lib/dev-plan-activation";
import { getPortalSession } from "@/lib/dev-portal-auth";
import { getYaApiPlan } from "@/lib/ya-api-plans";

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
  activationSignature?: string;
  adminBypass?: boolean;
}) {
  const planNote = input.adminBypass
    ? `0G plan ${input.planName}: owner console bypass`
    : input.activationSignature
      ? `0G plan ${input.planName}: wallet-signed activation ${input.priceLabel}${input.listPrice0g ? ` (list ${input.listPrice0g} 0G)` : ""}; sig ${compactHash(input.activationSignature)}`
      : `0G plan ${input.planName}: free`;
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
  const activationSignature = String(formData.get("activation_signature") || "").trim();
  const activationExpiresAt = Number(formData.get("activation_expires_at") || 0);

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

    if (session.role !== "owner" && plan.checkoutPrice0g !== "0") {
      if (!activationSignature || !activationExpiresAt) {
        throw new Error("Package activation signature is required.");
      }
      verifyPlanActivationSignature({
        walletAddress: ownerWalletAddress,
        planId: plan.id,
        planName: plan.name,
        priceLabel: plan.priceLabel,
        expiresAt: activationExpiresAt,
        signature: activationSignature,
      });
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
        activationSignature: activationSignature || undefined,
        adminBypass: session.role === "owner",
      }),
      scopes: plan.scopes,
      planId: plan.id,
      planName: plan.name,
      planPriceOg: plan.checkoutPrice0g,
      planMaxKeys: plan.apiKeys,
      planQuotaMonthly: plan.monthlyQuota,
      planExpiresAt: planExpiryIso(plan.expiresInDays),
      checkoutTxHash: undefined,
      checkoutIntegrityHash: undefined,
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
