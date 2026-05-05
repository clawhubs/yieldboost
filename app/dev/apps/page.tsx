import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DeveloperAppsView from "@/components/dev/DeveloperAppsView";
import { getPortalSession } from "@/lib/dev-portal-auth";
import { getManagedApiKeysForWallet } from "@/lib/dev-portal";

export const dynamic = "force-dynamic";

export default async function DeveloperAppsPage() {
  const session = await getPortalSession();
  if (!session) {
    redirect("/dev");
  }
  const [apiKeys, cookieStore] = await Promise.all([
    getManagedApiKeysForWallet(session.walletAddress),
    cookies(),
  ]);

  return (
    <DeveloperAppsView
      session={session}
      apiKeys={apiKeys?.items ?? []}
      createdApiKey={cookieStore.get("dev_portal_created_api_key")?.value ?? null}
      createdApiKeyLabel={cookieStore.get("dev_portal_created_api_key_label")?.value ?? null}
    />
  );
}
