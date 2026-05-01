import type { Metadata } from "next";
import StrategyMarketplace from "@/components/marketplace/StrategyMarketplace";

export const metadata: Metadata = {
  title: "Marketplace - YieldBoost AI",
  description:
    "Browse proof-backed YieldBoost strategy NFTs with ROI, accuracy, and 0G proof links.",
};

export default function MarketplacePage() {
  return (
    <main className="space-y-5 p-[10px]">
      <StrategyMarketplace />
    </main>
  );
}
