import FeaturePageView from "@/components/ui/FeaturePageView";
import { getWatchlistPageConfig } from "@/lib/server/feature-page-loaders";

export default async function WatchlistPage() {
  const config = await getWatchlistPageConfig();
  return <FeaturePageView {...config} />;
}
