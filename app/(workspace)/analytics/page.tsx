import FeaturePageView from "@/components/ui/FeaturePageView";
import { getAnalyticsPageConfig } from "@/lib/server/feature-page-loaders";

export default async function AnalyticsPage() {
  const config = await getAnalyticsPageConfig();
  return <FeaturePageView {...config} />;
}
