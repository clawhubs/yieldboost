import { cookies } from "next/headers";
import JudgeSyncOverlay from "@/components/judge/JudgeSyncOverlay";
import {
  getDefaultWalletNetworkKey,
  getServer0GNetworkConfig,
  JUDGE_NETWORK_COOKIE_KEY,
  resolveWalletNetworkKey,
} from "@/lib/wallet";

export default async function JudgeLoading() {
  const cookieStore = await cookies();
  const networkCookie = cookieStore.get(JUDGE_NETWORK_COOKIE_KEY)?.value;
  const networkKey = networkCookie
    ? resolveWalletNetworkKey(networkCookie)
    : getServer0GNetworkConfig("mainnet").enabled
      ? "mainnet"
      : getDefaultWalletNetworkKey();

  return <JudgeSyncOverlay networkKey={networkKey} />;
}
