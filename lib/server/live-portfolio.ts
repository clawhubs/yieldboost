import "server-only";

import { formatUnits, JsonRpcProvider } from "ethers";
import type {
  PortfolioResponse,
  StoredPortfolioSnapshot,
  StoredProofRecord,
} from "@/lib/backend-data";
import {
  getServer0GNetworkConfig,
  type WalletNetworkKey,
  resolveWalletAddress,
} from "@/lib/wallet";
import { resolveLatestProofForWallet } from "@/lib/server/proof-resolution";

function round(value: number, digits = 6) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

interface LivePortfolioSnapshotOptions {
  preferProofSnapshot?: boolean;
}

function sanitizeSnapshot(
  snapshot: StoredPortfolioSnapshot | undefined,
): StoredPortfolioSnapshot | null {
  if (!snapshot) {
    return null;
  }

  const tokens = Array.isArray(snapshot.tokens)
    ? snapshot.tokens
        .filter(
          (token) =>
            typeof token?.symbol === "string" &&
            Number.isFinite(token.amount) &&
            Number.isFinite(token.valueUSD),
        )
        .map((token) => ({
          symbol: token.symbol,
          amount: round(token.amount, 6),
          valueUSD: round(token.valueUSD, 6),
        }))
    : [];

  return {
    tokens,
    totalUSD: Number.isFinite(snapshot.totalUSD) ? round(snapshot.totalUSD, 6) : 0,
    currentAPY: Number.isFinite(snapshot.currentAPY) ? snapshot.currentAPY : 0,
    displayTotal:
      typeof snapshot.displayTotal === "number" && Number.isFinite(snapshot.displayTotal)
        ? round(snapshot.displayTotal, 6)
        : undefined,
    displayUnit: snapshot.displayUnit,
    displayLabel: snapshot.displayLabel,
  };
}

function buildPortfolioFromProof(
  proof: StoredProofRecord,
  walletAddress: string,
): PortfolioResponse | null {
  const snapshot = sanitizeSnapshot(proof.portfolioSnapshot);
  if (snapshot) {
    return {
      walletAddress,
      source: "wallet_proof_snapshot",
      latestTxHash: proof.txHash,
      tokens: snapshot.tokens,
      totalUSD: snapshot.totalUSD,
      currentAPY: snapshot.currentAPY,
      displayTotal: snapshot.displayTotal ?? snapshot.totalUSD,
      displayUnit: snapshot.displayUnit,
      displayLabel: snapshot.displayLabel ?? "Latest recorded wallet snapshot",
    };
  }

  const proofBackedBalance = round(proof.decision.totalPortfolio ?? 0, 6);
  if (proofBackedBalance <= 0) {
    return null;
  }

  return {
    walletAddress,
    source: "wallet_proof_snapshot",
    latestTxHash: proof.txHash,
    tokens: [
      {
        symbol: "0G",
        amount: proofBackedBalance,
        valueUSD: proofBackedBalance,
      },
    ],
    totalUSD: proofBackedBalance,
    currentAPY: proof.decision.current_apy ?? 0,
    displayTotal: proofBackedBalance,
    displayUnit: "0G",
    displayLabel: "Latest recorded wallet snapshot",
  };
}

export async function getLivePortfolioSnapshot(
  walletAddressInput?: string | null,
  networkKey: WalletNetworkKey = "testnet",
  options: LivePortfolioSnapshotOptions = {},
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
  const latestProof = await resolveLatestProofForWallet(walletAddress, networkKey);
  const proofBackedPortfolio = latestProof
    ? buildPortfolioFromProof(latestProof, walletAddress)
    : null;

  if (options.preferProofSnapshot && proofBackedPortfolio) {
    return {
      ...proofBackedPortfolio,
      source: "wallet_judge_snapshot",
    };
  }

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

  const shouldUseProofFallback =
    nativeBalance <= 0 &&
    Boolean(proofBackedPortfolio);

  if (shouldUseProofFallback && proofBackedPortfolio) {
    return {
      ...proofBackedPortfolio,
      source: "wallet_proof_fallback",
    };
  }

  const exactNativeBalance = round(nativeBalance, 6);
  const totalUSD = exactNativeBalance;

  return {
    walletAddress: walletAddress ?? undefined,
    source,
    latestTxHash: latestProof?.txHash,
    tokens:
      exactNativeBalance > 0
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
