import type { Metadata } from "next";
import VaultSwapView from "@/components/swap/VaultSwapView";

export const metadata: Metadata = {
  title: "Vault Swap | YieldBoost AI",
  description:
    "UI-only closed-alpha Vault Swap preview for the YieldBoost AI 9-layer security stack.",
};

export default function VaultSwapPage() {
  return <VaultSwapView />;
}
