import type { Metadata } from "next";

import DeveloperApiStore from "@/components/dev/DeveloperApiStore";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";

export const metadata: Metadata = {
  title: "API Store - YieldBoost Developer Portal",
  description: "Developer API marketplace for the YieldBoost 9-layer military-grade stack and partner SDKs.",
};

export default function DevMarketplacePage() {
  return (
    <DeveloperPortalShell
      eyebrow="API Store"
      title="Developer marketplace for 9-layer verification APIs."
      description="Choose the complete military-grade endpoint, one exact verification layer, or the VeilSolver secure proxy from the developer portal."
    >
      <DeveloperApiStore />
    </DeveloperPortalShell>
  );
}
