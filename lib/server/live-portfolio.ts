import "server-only";

import { formatUnits, JsonRpcProvider } from "ethers";
import type { PortfolioResponse } from "@/lib/backend-data";
import {
  getServer0GNetworkConfig,
  type WalletNetworkKey,
  resolveWalletAddress,
} from "@/lib/wallet";
import { getLatestStoredProofForWallet } from "@/lib/server/runtime-store";

function round(value: number, digits = 6) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

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
      displayTotal: undefined,
      displayUnit: undefined,
      displayLabel: undefined,
    };
  }
  const rpcUrl = getServer0GNetworkConfig(networkKey).rpcUrl;
  const latestProof = await getLatestStoredProofForWallet(walletAddress);

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

  // Always use actual RPC balance, don't use stored proof
  const exactNativeBalance = round(nativeBalance, 6);
  const totalUSD = exactNativeBalance;

  return {
    walletAddress: walletAddress ?? undefined,
    source,
    latestTxHash: latestProof?.txHash,
    tokens:
      nativeBalance > 0
        ? [
            {
              symbol: "0G",
              amount: exactNativeBalance,
              valueUSD: exactNativeBalance,
            },
          ]
        : [],
    totalUSD,
    currentAPY: latestProof?.decision.current_apy ?? 0,
    displayTotal: exactNativeBalance,
    displayUnit: "0G",
    displayLabel: "Native 0G balance",
  };
}
