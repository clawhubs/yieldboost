import { redirect } from "next/navigation";

import DeveloperAppsView from "@/components/dev/DeveloperAppsView";
import { getPortalSession } from "@/lib/dev-portal-auth";
import { getManagedApiKeysForWallet } from "@/lib/dev-portal";

export const dynamic = "force-dynamic";

export default async function DeveloperAppsPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  const session = await getPortalSession();
  if (!session) {
    redirect("/dev");
  }
  const apiKeys = await getManagedApiKeysForWallet(session.walletAddress);
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <DeveloperAppsView
      session={session}
      apiKeys={apiKeys?.items ?? []}
      initialPlanId={resolvedSearchParams.plan}
    />
  );
}
