import "server-only";

import { formatUnits, JsonRpcProvider } from "ethers";
import type { PortfolioResponse } from "@/lib/backend-data";
import { resolveWalletAddress } from "@/lib/wallet";
import { getLatestStoredProof } from "@/lib/server/runtime-store";

export async function getLivePortfolioSnapshot(
  walletAddressInput?: string | null,
): Promise<PortfolioResponse> {
  const walletAddress = resolveWalletAddress(walletAddressInput);
  const rpcUrl = process.env.ZG_RPC_URL ?? process.env.NEXT_PUBLIC_ZG_RPC;
  const latestProof = await getLatestStoredProof();

  let nativeBalance = 0;
  let source = "wallet_rpc_unavailable";

  if (rpcUrl) {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      nativeBalance = Number(formatUnits(await provider.getBalance(walletAddress), 18));
      source = "wallet_rpc";
    } catch {
      source = "wallet_rpc_error";
    }
  }

  const totalUSD =
    latestProof?.decision.totalPortfolio && latestProof.decision.totalPortfolio > 0
      ? latestProof.decision.totalPortfolio
      : nativeBalance;

  return {
    walletAddress,
    source,
    latestTxHash: latestProof?.txHash,
    tokens:
      nativeBalance > 0
        ? [
            {
              symbol: "0G",
              amount: Number(nativeBalance.toFixed(6)),
              valueUSD: Number(totalUSD.toFixed(2)),
            },
          ]
        : [],
    totalUSD: Number(totalUSD.toFixed(2)),
    currentAPY: latestProof?.decision.current_apy ?? 0,
  };
}
