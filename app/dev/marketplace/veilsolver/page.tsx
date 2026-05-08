import type { Metadata } from "next";

import DeveloperApiPlayground from "@/components/dev/DeveloperApiPlayground";
import { getApiMarketplaceProduct } from "@/lib/military-grade-api-marketplace";

export const metadata: Metadata = {
  title: "VeilSolver Playground - YieldBoost Developer Portal",
  description: "Run the VeilSolver secure proxy endpoint from its own API Store playground.",
};

export default function VeilSolverApiPlaygroundPage() {
  const product = getApiMarketplaceProduct("veilsolver");

  if (!product) return null;

  return <DeveloperApiPlayground product={product} />;
}
