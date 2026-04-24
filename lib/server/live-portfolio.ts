import "server-only";

import { formatUnits, JsonRpcProvider } from "ethers";
import type { PortfolioResponse } from "@/lib/backend-data";
import {
  getServer0GNetworkConfig,
  type WalletNetworkKey,
  resolveWalletAddress,
} from "@/lib/wallet";
import { getLatestStoredProof } from "@/lib/server/runtime-store";

export async function getLivePortfolioSnapshot(
  walletAddressInput?: string | null,
  networkKey: WalletNetworkKey = "testnet",
): Promise<PortfolioResponse> {
  const walletAddress = resolveWalletAddress(walletAddressInput);
  if (!walletAddress) {
    return {
      walletAddress: undefined,
      source: "wallet_disconnected",
      latestTxHash: undefined,
      tokens: [],
      totalUSD: 0,
      currentAPY: 0,
    };
  }
  const rpcUrl = getServer0GNetworkConfig(networkKey).rpcUrl;
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
    walletAddress: walletAddress ?? undefined,
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
