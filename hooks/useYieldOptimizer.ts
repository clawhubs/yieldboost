"use client";

import { useYieldOptimizerContext } from "@/components/providers/AppDataProvider";

export function useYieldOptimizer() {
  return useYieldOptimizerContext();
}
