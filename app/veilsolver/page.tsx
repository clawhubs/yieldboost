import type { Metadata } from "next";
import VeilSolverPlayground from "@/components/marketplace/VeilSolverPlayground";

export const metadata: Metadata = {
  title: "VeilSolver API Playground - YieldBoost AI",
  description: "Test the YieldBoost Secure Proxy for VeilSolver with a 9-layer verified response envelope.",
};

export default function VeilSolverPage() {
  return <VeilSolverPlayground />;
}
