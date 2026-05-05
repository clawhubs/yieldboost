"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createManagedApiKey, revokeManagedApiKey } from "@/lib/dev-portal";

export async function createApiKeyAction(formData: FormData) {
  const appName = String(formData.get("app_name") || "").trim();
  const ownerLabel = String(formData.get("owner_label") || "").trim();
  const ownerWalletAddress = String(formData.get("owner_wallet_address") || "").trim();
  const environment = String(formData.get("environment") || "testnet").trim() as
    | "testnet"
    | "mainnet"
    | "multi";
  const notes = String(formData.get("notes") || "").trim();
  const returnPath = String(formData.get("return_path") || "/dev/apps").trim();

  if (!appName) {
    throw new Error("App name is required.");
  }

  const created = await createManagedApiKey({
    appName,
    ownerLabel: ownerLabel || undefined,
    ownerWalletAddress: ownerWalletAddress || undefined,
    environment,
    notes: notes || undefined,
  });

  const cookieStore = await cookies();
  cookieStore.set("dev_portal_created_api_key", created.apiKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set("dev_portal_created_api_key_label", created.item.app_name, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  revalidatePath("/dev");
  revalidatePath("/dev/apps");
  revalidatePath("/dev/console");

  const safeReturnPath = ["/dev/apps", "/dev/console"].includes(returnPath)
    ? returnPath
    : "/dev/apps";
  redirect(safeReturnPath);
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
