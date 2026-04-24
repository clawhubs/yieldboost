export const DEFAULT_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_DEMO_WALLET_ADDRESS ??
  "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D";

export const WALLET_COOKIE_KEY = "yb_wallet";
export const WALLET_CHANGE_EVENT = "yb:wallet-change";

export function isWalletAddress(value: string | null | undefined) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

export function resolveWalletAddress(value: string | null | undefined) {
  return isWalletAddress(value) ? value! : DEFAULT_WALLET_ADDRESS;
}
