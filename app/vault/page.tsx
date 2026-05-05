import type { Metadata } from "next";
import VaultDashboard from "@/components/vault/VaultDashboard";

export const metadata: Metadata = {
  title: "YieldBoost Vault",
  description: "9-layer integrity vault and live security challenge for YieldBoost AI.",
};

export default function VaultPage() {
  return <VaultDashboard />;
}
