import FeaturePageView from "@/components/ui/FeaturePageView";
import { getOpportunitiesPageConfig } from "@/lib/server/feature-page-loaders";

export default async function OpportunitiesPage() {
  const config = await getOpportunitiesPageConfig();
  return <FeaturePageView {...config} />;
}
