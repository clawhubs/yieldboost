"use server";

import { revalidatePath } from "next/cache";

import { createManagedApiKey, revokeManagedApiKey } from "@/lib/dev-portal";

export interface CreateApiKeyActionState {
  success: boolean;
  apiKey: string | null;
  label: string | null;
  error: string | null;
}

export async function createApiKeyAction(
  _previousState: CreateApiKeyActionState,
  formData: FormData,
): Promise<CreateApiKeyActionState> {
  const appName = String(formData.get("app_name") || "").trim();
  const ownerLabel = String(formData.get("owner_label") || "").trim();
  const ownerWalletAddress = String(formData.get("owner_wallet_address") || "").trim();
  const environment = String(formData.get("environment") || "testnet").trim() as
    | "testnet"
    | "mainnet"
    | "multi";
  const notes = String(formData.get("notes") || "").trim();

  if (!appName) {
    return {
      success: false,
      apiKey: null,
      label: null,
      error: "App name is required.",
    };
  }

  try {
    const created = await createManagedApiKey({
      appName,
      ownerLabel: ownerLabel || undefined,
      ownerWalletAddress: ownerWalletAddress || undefined,
      environment,
      notes: notes || undefined,
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
