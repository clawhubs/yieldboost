import DeveloperLandingView from "@/components/dev/DeveloperLandingView";
import { getPortalSession } from "@/lib/dev-portal-auth";

export default async function DeveloperPortalHomePage() {
  const session = await getPortalSession();
  return <DeveloperLandingView session={session} />;
}
