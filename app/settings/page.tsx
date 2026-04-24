import FeaturePageView from "@/components/ui/FeaturePageView";
import { getSettingsPageConfig } from "@/lib/server/feature-page-loaders";

export default async function SettingsPage() {
  const config = await getSettingsPageConfig();
  return <FeaturePageView {...config} />;
}
