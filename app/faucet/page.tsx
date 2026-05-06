import { Suspense } from "react";

import YaFaucetView from "@/components/faucet/YaFaucetView";

export const metadata = {
  title: "YA Faucet | YieldBoost AI",
  description: "Claim 0G Galileo testnet YA vouchers earned from YieldBoost AI testnet actions.",
};

export default function FaucetPage() {
  return (
    <Suspense fallback={null}>
      <YaFaucetView />
    </Suspense>
  );
}
