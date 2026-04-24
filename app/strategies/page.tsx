import FeaturePageView from "@/components/ui/FeaturePageView";
import { getStrategiesPageConfig } from "@/lib/server/feature-page-loaders";

export default async function StrategiesPage() {
  const config = await getStrategiesPageConfig();
  return <FeaturePageView {...config} />;
}
