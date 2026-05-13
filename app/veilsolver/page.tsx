import type { Metadata } from "next";
import VeilSolverPlayground from "@/components/marketplace/VeilSolverPlayground";

export const metadata: Metadata = {
  title: "VeilSolver API Playground - YieldBoost AI",
  description: "Test the YieldBoost Secure Proxy for VeilSolver with a selected-protection response envelope derived from TITAN PROTOCOL.",
};

export default function VeilSolverPage() {
  return <VeilSolverPlayground />;
}
