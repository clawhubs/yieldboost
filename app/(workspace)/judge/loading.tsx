import { cookies } from "next/headers";
import JudgeSyncOverlay from "@/components/judge/JudgeSyncOverlay";
import {
  getDefaultWalletNetworkKey,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export default async function JudgeLoading() {
  const cookieStore = await cookies();
  const networkCookie = cookieStore.get(WALLET_NETWORK_COOKIE_KEY)?.value;
  const networkKey = networkCookie
    ? resolveWalletNetworkKey(networkCookie)
    : getDefaultWalletNetworkKey();

  return <JudgeSyncOverlay networkKey={networkKey} />;
}
