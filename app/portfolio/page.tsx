import FeaturePageView from "@/components/ui/FeaturePageView";
import { getPortfolioPageConfig } from "@/lib/server/feature-page-loaders";

export default async function PortfolioPage() {
  const config = await getPortfolioPageConfig();
  return <FeaturePageView {...config} />;
}
