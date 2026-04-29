import "server-only";

import { type WalletNetworkKey } from "@/lib/wallet";

function fromEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

export function getComputeProviderAddress(networkKey: WalletNetworkKey) {
  if (networkKey === "mainnet") {
    return fromEnv(
      "ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS",
      "ZG_COMPUTE_PROVIDER_ADDRESS",
    );
  }

  return fromEnv(
    "ZG_TESTNET_COMPUTE_PROVIDER_ADDRESS",
    "ZG_COMPUTE_PROVIDER_ADDRESS",
  );
}

export function getComputeLedgerPrivateKey(networkKey: WalletNetworkKey) {
  if (networkKey === "mainnet") {
    return fromEnv(
      "ZG_MAINNET_LEDGER_PRIVATE_KEY",
      "ZG_LEDGER_PRIVATE_KEY",
    );
  }

  return fromEnv(
    "ZG_TESTNET_LEDGER_PRIVATE_KEY",
    "ZG_LEDGER_PRIVATE_KEY",
  );
}

export function getContractSignerPrivateKey(networkKey: WalletNetworkKey) {
  if (networkKey === "mainnet") {
    return fromEnv(
      "ZG_MAINNET_LEDGER_PRIVATE_KEY",
      "ZG_MAINNET_PRIVATE_KEY",
      "ZG_LEDGER_PRIVATE_KEY",
      "ZG_PRIVATE_KEY",
    );
  }

  return fromEnv(
    "ZG_TESTNET_LEDGER_PRIVATE_KEY",
    "ZG_TESTNET_PRIVATE_KEY",
    "ZG_LEDGER_PRIVATE_KEY",
    "ZG_PRIVATE_KEY",
  );
}

export function hasComputeCredentials(networkKey: WalletNetworkKey) {
  return Boolean(
    getComputeProviderAddress(networkKey) &&
    getComputeLedgerPrivateKey(networkKey),
  );
}
