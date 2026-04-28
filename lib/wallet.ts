export const DEFAULT_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_DEMO_WALLET_ADDRESS ??
  "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D";

export const WALLET_COOKIE_KEY = "yb_wallet";
export const WALLET_NETWORK_COOKIE_KEY = "yb_wallet_network";
export const WALLET_CHANGE_EVENT = "yb:wallet-change";
export const WALLET_CONNECT_REQUEST_EVENT = "yb:wallet-connect-request";
export const JUDGE_MODE_COOKIE_KEY = "yb_judge_mode";
export const JUDGE_MODE_STORAGE_KEY = "yb_judge_mode";

export const WALLET_OVERRIDE_STORAGE_KEY = "yb_wallet_override";
export const WALLET_NETWORK_STORAGE_KEY = "yb_wallet_network";
export const WALLET_PROVIDER_STORAGE_KEY = "yb_wallet_provider";

export type WalletNetworkKey = "testnet" | "mainnet";

export interface WalletChangeDetail {
  walletAddress?: string;
  networkKey?: WalletNetworkKey;
  walletLabel?: string;
  connected?: boolean;
}

export interface WalletNetworkConfig {
  key: WalletNetworkKey;
  label: string;
  chainName: string;
  chainId?: number;
  chainIdHex?: string;
  rpcUrl?: string;
  storageUrl?: string;
  explorerBase: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  enabled: boolean;
}

export interface Server0GNetworkConfig extends WalletNetworkConfig {
  privateKey?: string;
  proofRegistryAddress?: string;
}

const DEFAULT_TESTNET_STORAGE_URL =
  "https://indexer-storage-testnet-turbo.0g.ai";
const DEFAULT_TESTNET_RPC_URL = "https://evmrpc-testnet.0g.ai";
const DEFAULT_MAINNET_RPC_URL = "https://evmrpc.0g.ai";

function normalizeStorageUrl(
  key: WalletNetworkKey,
  value: string | undefined,
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return key === "testnet" ? DEFAULT_TESTNET_STORAGE_URL : undefined;
  }

  if (
    key === "testnet" &&
    /(^https?:\/\/)?(indexer-storage\.0g\.ai|indexer-storage-testnet-standard\.0g\.ai)\/?$/i.test(trimmed)
  ) {
    return DEFAULT_TESTNET_STORAGE_URL;
  }

  return trimmed;
}

function parseChainId(value: string | undefined, fallback?: number) {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("0x")) {
    const parsed = Number.parseInt(trimmed, 16);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toHexChainId(chainId: number | undefined) {
  if (!chainId || !Number.isFinite(chainId)) return undefined;
  return `0x${chainId.toString(16)}`;
}

function buildNetworkConfig(
  key: WalletNetworkKey,
  options: {
    label: string;
    chainName: string;
    chainId?: number;
    rpcUrl?: string;
    storageUrl?: string;
    explorerBase: string;
    privateKey?: string;
    proofRegistryAddress?: string;
  },
): Server0GNetworkConfig {
  const chainId = options.chainId;
  const chainIdHex = toHexChainId(chainId);

  return {
    key,
    label: options.label,
    chainName: options.chainName,
    chainId,
    chainIdHex,
    rpcUrl: options.rpcUrl,
    storageUrl: options.storageUrl,
    explorerBase: options.explorerBase,
    nativeCurrency: {
      name: "0G",
      symbol: "0G",
      decimals: 18,
    },
    enabled: Boolean(chainId && options.rpcUrl),
    privateKey: options.privateKey,
    proofRegistryAddress: options.proofRegistryAddress,
  };
}

function getNetworkConfigs() {
  const testnetChainId = parseChainId(process.env.NEXT_PUBLIC_0G_TESTNET_CHAIN_ID, 16602);
  const mainnetChainId = parseChainId(process.env.NEXT_PUBLIC_0G_MAINNET_CHAIN_ID);

  return {
    testnet: buildNetworkConfig("testnet", {
      label: "0G Testnet",
      chainName:
        process.env.NEXT_PUBLIC_0G_TESTNET_CHAIN_NAME ?? "0G Galileo Testnet",
      chainId: testnetChainId,
      rpcUrl:
        process.env.ZG_TESTNET_RPC_URL ??
        process.env.NEXT_PUBLIC_ZG_RPC ??
        process.env.ZG_RPC_URL ??
        DEFAULT_TESTNET_RPC_URL,
      storageUrl: normalizeStorageUrl(
        "testnet",
        process.env.ZG_TESTNET_STORAGE_URL ??
          process.env.NEXT_PUBLIC_ZG_STORAGE ??
          process.env.ZG_STORAGE_URL,
      ),
      explorerBase:
        process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
        "https://chainscan-galileo.0g.ai",
      privateKey: process.env.ZG_TESTNET_PRIVATE_KEY ?? process.env.ZG_PRIVATE_KEY,
      proofRegistryAddress:
        process.env.ZG_TESTNET_PROOF_REGISTRY_ADDRESS ??
        process.env.ZG_PROOF_REGISTRY_ADDRESS,
    }),
    mainnet: buildNetworkConfig("mainnet", {
      label: "0G Mainnet",
      chainName: process.env.NEXT_PUBLIC_0G_MAINNET_CHAIN_NAME ?? "0G Mainnet",
      chainId: mainnetChainId,
      rpcUrl:
        process.env.ZG_MAINNET_RPC_URL ??
        process.env.NEXT_PUBLIC_0G_MAINNET_RPC ??
        DEFAULT_MAINNET_RPC_URL,
      storageUrl:
        process.env.ZG_MAINNET_STORAGE_URL ??
        process.env.NEXT_PUBLIC_0G_MAINNET_STORAGE,
      explorerBase:
        process.env.NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL ??
        "https://chainscan.0g.ai",
      privateKey: process.env.ZG_MAINNET_PRIVATE_KEY,
      proofRegistryAddress: process.env.ZG_MAINNET_PROOF_REGISTRY_ADDRESS,
    }),
  } satisfies Record<WalletNetworkKey, Server0GNetworkConfig>;
}

export function resolveWalletNetworkKey(
  value: string | null | undefined,
): WalletNetworkKey {
  return value === "mainnet" ? "mainnet" : "testnet";
}

export function getWalletNetworkConfig(
  networkKey: WalletNetworkKey,
): WalletNetworkConfig {
  return getNetworkConfigs()[networkKey];
}

export function getAvailableWalletNetworks() {
  return Object.values(getNetworkConfigs()) as Server0GNetworkConfig[];
}

export function getServer0GNetworkConfig(
  value: string | null | undefined,
): Server0GNetworkConfig {
  return getNetworkConfigs()[resolveWalletNetworkKey(value)];
}

export function getServerDefaultNetworkKey(): WalletNetworkKey {
  return resolveWalletNetworkKey(process.env.ZG_NETWORK_KEY);
}

export function getYieldStrategyInftAddress(
  value: string | null | undefined,
) {
  const networkKey = resolveWalletNetworkKey(value);

  if (networkKey === "mainnet") {
    return (
      process.env.YIELD_STRATEGY_INFT_MAINNET_ADDRESS ??
      process.env.YIELD_STRATEGY_INFT_ADDRESS
    );
  }

  return process.env.YIELD_STRATEGY_INFT_ADDRESS;
}

export function isWalletAddress(value: string | null | undefined) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

export function resolveWalletAddress(value: string | null | undefined) {
  return isWalletAddress(value) ? value : undefined;
}

export function normalizeWalletAddress(value: string | null | undefined) {
  return typeof value === "string" && isWalletAddress(value)
    ? value.toLowerCase()
    : undefined;
}

export function sameWalletAddress(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const normalizedLeft = normalizeWalletAddress(left);
  const normalizedRight = normalizeWalletAddress(right);

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}
