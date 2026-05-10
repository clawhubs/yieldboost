import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DeveloperApiPlayground from "@/components/dev/DeveloperApiPlayground";
import {
  type ApiMarketplaceProductId,
  getApiMarketplaceProduct,
} from "@/lib/military-grade-api-marketplace";

export const metadata: Metadata = {
  title: "API Playground - YieldBoost Developer Portal",
  description: "Run a YieldBoost Modular Immunity Armory endpoint from its own playground.",
};

export default async function DevApiProductPlaygroundPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: productId } = await params;
  const product = getApiMarketplaceProduct(productId as ApiMarketplaceProductId);

  if (!product) {
    notFound();
  }

  return <DeveloperApiPlayground product={product} />;
}
