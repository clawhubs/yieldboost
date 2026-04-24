import FeaturePageView from "@/components/ui/FeaturePageView";
import { getHistoryPageConfig } from "@/lib/server/feature-page-loaders";

export default async function HistoryPage() {
  const config = await getHistoryPageConfig();
  return <FeaturePageView {...config} />;
}
