import type { Metadata } from "next";
import VeilSolverPlayground from "@/components/marketplace/VeilSolverPlayground";

export const metadata: Metadata = {
  title: "VeilSolver API Playground - YieldBoost Developer Portal",
  description: "Test the YieldBoost Secure Proxy for VeilSolver from the developer portal.",
};

export default function DevVeilSolverPage() {
  return <VeilSolverPlayground />;
}
