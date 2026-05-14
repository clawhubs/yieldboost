import { redirect } from "next/navigation";

import DeveloperAppsView from "@/components/dev/DeveloperAppsView";
import { getPortalSession } from "@/lib/dev-portal-auth";
import { getManagedApiKeysForWallet } from "@/lib/dev-portal";
import { getHiddenDashboardKeyIds } from "@/lib/dev-portal-key-visibility";

export const dynamic = "force-dynamic";

export default async function DeveloperAppsPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  const session = await getPortalSession();
  if (!session) {
    redirect("/dev#connect-api");
  }
  const [apiKeys, hiddenKeyIds] = await Promise.all([
    getManagedApiKeysForWallet(session.walletAddress),
    getHiddenDashboardKeyIds(session.walletAddress),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filteredApiKeys = (apiKeys?.items ?? []).filter(
    (item) => !hiddenKeyIds.includes(item.key_id),
  );

  return (
    <DeveloperAppsView
      session={session}
      apiKeys={filteredApiKeys}
      initialPlanId={resolvedSearchParams.plan}
    />
  );
}
