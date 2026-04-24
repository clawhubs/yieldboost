"use client";

import { usePortfolioContext } from "@/components/providers/AppDataProvider";

export function usePortfolio() {
  return usePortfolioContext();
}
