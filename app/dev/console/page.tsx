import { redirect } from "next/navigation";

import DeveloperConsoleView from "@/components/dev/DeveloperConsoleView";
import { getPortalSession } from "@/lib/dev-portal-auth";
import {
  getDeveloperDashboardData,
  getDevPortalSetupState,
  getManagedApiKeys,
} from "@/lib/dev-portal";

export const dynamic = "force-dynamic";

export default async function DeveloperPortalConsolePage() {
  const session = await getPortalSession();
  if (!session) {
    redirect("/dev");
  }
  if (session.role !== "owner") {
    redirect("/dev/apps");
  }
  const setup = getDevPortalSetupState();
  const [dashboard, apiKeys] = await Promise.all([
    getDeveloperDashboardData(),
    getManagedApiKeys(),
  ]);

  return (
    <DeveloperConsoleView
      session={session}
      setup={setup}
      dashboard={dashboard}
      apiKeys={apiKeys?.items ?? []}
    />
  );
}
