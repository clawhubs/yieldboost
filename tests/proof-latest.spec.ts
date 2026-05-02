import { expect, test } from "@playwright/test";
import { Contract, JsonRpcProvider, type EventLog } from "ethers";
import { DEFAULT_WALLET_ADDRESS, getServer0GNetworkConfig } from "../lib/wallet";

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
] as const;

const MAX_BLOCK_LOOKBACK = 1_000_000;
const BLOCK_SCAN_CHUNK = 50_000;

type ProofRegistryLog = Awaited<
  ReturnType<Contract["queryFilter"]>
>[number];

function isEventLog(log: ProofRegistryLog | null): log is EventLog {
  return Boolean(log && "args" in log);
}

async function findLatestProofLog(
  contract: Contract,
  provider: JsonRpcProvider,
  walletAddress: string,
) {
  const latestBlock = await provider.getBlockNumber();
  const minBlock = Math.max(0, latestBlock - MAX_BLOCK_LOOKBACK);
  const filter = contract.filters.ProofRecorded(null, walletAddress);

  for (let toBlock = latestBlock; toBlock >= minBlock; toBlock -= BLOCK_SCAN_CHUNK) {
    const fromBlock = Math.max(minBlock, toBlock - BLOCK_SCAN_CHUNK + 1);
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);
    if (logs.length > 0) {
      return logs[logs.length - 1] as ProofRegistryLog;
    }
  }

  return null;
}

test("latest proof API follows the newest on-chain ProofRegistry event for the demo wallet", async ({
  request,
}) => {
  const config = getServer0GNetworkConfig("testnet");
  test.skip(!config.rpcUrl || !config.proofRegistryAddress, "ProofRegistry is not configured for testnet.");
  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return;
  }

  const provider = new JsonRpcProvider(config.rpcUrl);
  const contract = new Contract(config.proofRegistryAddress, proofRegistryAbi, provider);
  const latestLog = await findLatestProofLog(contract, provider, DEFAULT_WALLET_ADDRESS);

  expect(isEventLog(latestLog), "No ProofRecorded event found for the demo wallet.").toBeTruthy();
  if (!isEventLog(latestLog)) {
    return;
  }

  const response = await request.get(
    `/api/agent/latest?wallet=${DEFAULT_WALLET_ADDRESS}&network=testnet`,
  );
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    data?: {
      storageProof?: string;
      txHash?: string;
      timestamp?: string;
      proofRegistryAddress?: string;
      proofRegistryTxHash?: string;
      proofRegistryProofId?: string;
    } | null;
  };

  expect(payload.data).not.toBeNull();
  expect(payload.data?.storageProof?.toLowerCase()).toBe(
    String(latestLog.args.cid).toLowerCase(),
  );
  expect(payload.data?.txHash?.toLowerCase()).toBe(
    String(latestLog.args.storageTxHash).toLowerCase(),
  );
  expect(payload.data?.proofRegistryAddress?.toLowerCase()).toBe(
    config.proofRegistryAddress.toLowerCase(),
  );
  expect(payload.data?.proofRegistryTxHash?.toLowerCase()).toBe(
    latestLog.transactionHash.toLowerCase(),
  );
  expect(payload.data?.proofRegistryProofId).toBe(
    latestLog.args.proofId.toString(),
  );
  expect(payload.data?.timestamp).toBe(
    new Date(Number(latestLog.args.timestamp) * 1000).toISOString(),
  );
});

test("judge page links to the newest on-chain ProofRegistry receipt for the demo wallet", async ({
  page,
}) => {
  const config = getServer0GNetworkConfig("testnet");
  test.skip(!config.rpcUrl || !config.proofRegistryAddress, "ProofRegistry is not configured for testnet.");
  if (!config.rpcUrl || !config.proofRegistryAddress) {
    return;
  }

  const provider = new JsonRpcProvider(config.rpcUrl);
  const contract = new Contract(config.proofRegistryAddress, proofRegistryAbi, provider);
  const latestLog = await findLatestProofLog(contract, provider, DEFAULT_WALLET_ADDRESS);

  expect(isEventLog(latestLog), "No ProofRecorded event found for the demo wallet.").toBeTruthy();
  if (!isEventLog(latestLog)) {
    return;
  }

  await page.goto("/judge", { waitUntil: "networkidle" });

  const latestProofLink = page.getByRole("link", { name: "Open ProofRegistry tx" });
  await expect(latestProofLink).toBeVisible();
  await expect(latestProofLink).toHaveAttribute(
    "href",
    `https://chainscan-galileo.0g.ai/tx/${latestLog.transactionHash}`,
  );
});
