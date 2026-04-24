import { NextRequest, NextResponse } from "next/server";
import { formatUnits, JsonRpcProvider } from "ethers";
import { getLatestStoredProof } from "@/lib/server/runtime-store";
import { resolveWalletAddress, WALLET_COOKIE_KEY } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const walletAddress = resolveWalletAddress(
    req.nextUrl.searchParams.get("wallet") ?? req.cookies.get(WALLET_COOKIE_KEY)?.value,
  );
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

  const snapshotTotal = latestProof?.decision.totalPortfolio ?? 0;
  const totalUSD = snapshotTotal > 0 ? snapshotTotal : nativeBalance;

  return NextResponse.json({
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
  });
}
