import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DeveloperApiProductDocs from "@/components/dev/DeveloperApiProductDocs";
import {
  type ApiMarketplaceProductId,
  getApiMarketplaceProduct,
} from "@/lib/military-grade-api-marketplace";

export const metadata: Metadata = {
  title: "API Docs - YieldBoost Developer Portal",
  description: "Per-endpoint integration docs for YieldBoost API Store products.",
};

export default async function DevApiProductDocsPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: productId } = await params;
  const product = getApiMarketplaceProduct(productId as ApiMarketplaceProductId);

  if (!product) {
    notFound();
  }

  return <DeveloperApiProductDocs product={product} />;
}
