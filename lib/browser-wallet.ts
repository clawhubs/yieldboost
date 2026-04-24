"use client";

import type { WalletNetworkConfig } from "@/lib/wallet";

declare global {
  interface Window {
    ethereum?: InjectedProvider & {
      providers?: InjectedProvider[];
    };
  }
}

export interface InjectedProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isOkxWallet?: boolean;
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

export interface WalletOption {
  id: string;
  name: string;
  provider: InjectedProvider;
}

const walletMatchers = [
  {
    id: "rabby",
    name: "Rabby",
    test: (provider: InjectedProvider) => Boolean(provider.isRabby),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    test: (provider: InjectedProvider) => Boolean(provider.isCoinbaseWallet),
  },
  {
    id: "trust",
    name: "Trust Wallet",
    test: (provider: InjectedProvider) =>
      Boolean(provider.isTrust || provider.isTrustWallet),
  },
  {
    id: "okx",
    name: "OKX Wallet",
    test: (provider: InjectedProvider) => Boolean(provider.isOkxWallet),
  },
  {
    id: "metamask",
    name: "MetaMask",
    test: (provider: InjectedProvider) =>
      Boolean(
        provider.isMetaMask &&
          !provider.isCoinbaseWallet &&
          !provider.isRabby &&
          !provider.isTrust &&
          !provider.isTrustWallet &&
          !provider.isOkxWallet,
      ),
  },
];

function uniqueProviders() {
  if (typeof window === "undefined" || !window.ethereum) return [];

  const candidates = window.ethereum.providers?.length
    ? window.ethereum.providers
    : [window.ethereum];

  return candidates.filter((provider, index, items) => items.indexOf(provider) === index);
}

export function getInjectedWalletOptions(): WalletOption[] {
  const providers = uniqueProviders();
  const options: WalletOption[] = [];

  for (const provider of providers) {
    const match = walletMatchers.find((item) => item.test(provider));
    if (match) {
      options.push({
        id: match.id,
        name: match.name,
        provider,
      });
    }
  }

  if (options.length === 0 && typeof window !== "undefined" && window.ethereum) {
    options.push({
      id: "browser-wallet",
      name: "Browser Wallet",
      provider: window.ethereum,
    });
  }

  return options.filter(
    (option, index, items) => items.findIndex((item) => item.id === option.id) === index,
  );
}

export function getInjectedWalletById(id: string | null | undefined) {
  return getInjectedWalletOptions().find((wallet) => wallet.id === id) ?? null;
}

export function getDefaultInjectedWallet() {
  return getInjectedWalletOptions()[0] ?? null;
}

export async function getAuthorizedAccounts(provider: InjectedProvider) {
  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  return Array.isArray(accounts) ? accounts : [];
}

export function inferNetworkKeyFromChainId(
  chainIdHex: string | null | undefined,
  networks: WalletNetworkConfig[],
) {
  if (!chainIdHex) return null;

  const chainId = Number.parseInt(chainIdHex, 16);
  if (!Number.isFinite(chainId)) return null;

  return networks.find((network) => network.chainId === chainId)?.key ?? null;
}

export async function switchOrAddNetwork(
  provider: InjectedProvider,
  network: WalletNetworkConfig,
) {
  if (!network.chainIdHex) {
    throw new Error(`Missing chain id for ${network.label}.`);
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainIdHex }],
    });
    return;
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number"
        ? ((error as { code: number }).code)
        : undefined;

    if (code !== 4902) {
      throw error;
    }
  }

  if (!network.rpcUrl) {
    throw new Error(`Missing RPC URL for ${network.label}.`);
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: network.chainIdHex,
        chainName: network.chainName,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerBase],
      },
    ],
  });
}
