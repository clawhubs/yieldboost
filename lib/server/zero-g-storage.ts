import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Indexer, ZgFile } from "@0gfoundation/0g-ts-sdk";
import { getServer0GNetworkConfig, type WalletNetworkKey } from "@/lib/wallet";
import type { ProofStorageMode } from "@/lib/backend-data";
import {
  waitForTransactionReceipt,
  withBackendSignerQueue,
} from "@/lib/server/backend-signer";

export interface ZeroGJsonUploadResult {
  cid: string;
  rootHash: string;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  storageMode: ProofStorageMode;
  note?: string;
}

function getStorageUrlCandidates(
  networkKey: WalletNetworkKey,
  configuredUrl: string | undefined,
) {
  const candidates =
    networkKey === "testnet"
      ? [
          configuredUrl,
          "https://indexer-storage-testnet-turbo.0g.ai",
          "https://indexer-storage-testnet-standard.0g.ai",
        ]
      : [configuredUrl, "https://indexer-storage-turbo.0g.ai"];

  return candidates.filter(
    (value, index, items): value is string =>
      Boolean(value) && items.indexOf(value) === index,
  );
}

async function writeLocalFallback(payload: unknown, prefix: string) {
  const serialized = JSON.stringify(payload, null, 2);
  const digest = createHash("sha256").update(serialized).digest("hex");
  const directory = path.join(process.cwd(), ".artifacts", "0g-fallback");
  const filename = `${prefix}-${digest.slice(0, 16)}.json`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), serialized, "utf8");

  return {
    cid: `local-${digest}`,
    rootHash: `0x${digest}`,
    storageMode: "local-fallback" as const,
    note: `0G env incomplete; payload persisted locally at .artifacts/0g-fallback/${filename}`,
  };
}

export async function uploadJsonToZeroGStorage(input: {
  networkKey: WalletNetworkKey;
  payload: unknown;
  filenamePrefix: string;
  allowLocalFallback?: boolean;
  priority?: "high" | "normal";
}): Promise<ZeroGJsonUploadResult> {
  const config = getServer0GNetworkConfig(input.networkKey);

  if (!config.storageUrl || !config.rpcUrl || !config.privateKey) {
    if (input.allowLocalFallback) {
      return writeLocalFallback(input.payload, input.filenamePrefix);
    }

    throw new Error(
      "0G storage is not configured. Set ZG_STORAGE_URL, ZG_RPC_URL, and ZG_PRIVATE_KEY.",
    );
  }

  const tempFile = path.join(
    os.tmpdir(),
    `${input.filenamePrefix}-${randomUUID()}.json`,
  );

  try {
    await fs.writeFile(tempFile, JSON.stringify(input.payload, null, 2), "utf8");
    const file = await ZgFile.fromFilePath(tempFile);

    try {
      return await withBackendSignerQueue(input.networkKey, async ({
        config: queuedConfig,
        provider,
        signer,
      }) => {
        const storageUrlCandidates = getStorageUrlCandidates(
          input.networkKey,
          queuedConfig.storageUrl,
        );

        let uploadResult:
          | { txHash: string; rootHash: string }
          | { txHashes: string[]; rootHashes: string[] }
          | null = null;
        let lastUploadError: unknown = null;

        for (const storageUrl of storageUrlCandidates) {
          try {
            const indexer = new Indexer(storageUrl);
            const [nextUploadResult, uploadError] = await indexer.upload(
              file,
              queuedConfig.rpcUrl!,
              signer,
            );

            if (uploadError) {
              lastUploadError = uploadError;
              continue;
            }

            uploadResult = nextUploadResult;
            break;
          } catch (error) {
            lastUploadError = error;
          }
        }

        if (!uploadResult) {
          if (input.allowLocalFallback) {
            const fallback = await writeLocalFallback(
              input.payload,
              input.filenamePrefix,
            );
            const message =
              lastUploadError instanceof Error
                ? lastUploadError.message
                : "0G storage upload failed across all configured endpoints.";
            return {
              ...fallback,
              note: `${fallback.note}; upload fallback reason: ${message}`,
            };
          }

          throw lastUploadError instanceof Error
            ? lastUploadError
            : new Error("0G storage upload failed across all configured endpoints.");
        }

        const txHash =
          "txHash" in uploadResult ? uploadResult.txHash : uploadResult.txHashes[0];
        const rootHash =
          "rootHash" in uploadResult ? uploadResult.rootHash : uploadResult.rootHashes[0];
        const receipt = await waitForTransactionReceipt(provider, txHash);

        return {
          cid: rootHash,
          rootHash,
          txHash,
          blockNumber: receipt?.blockNumber ?? 0,
          explorerUrl: txHash
            ? `${queuedConfig.explorerBase.replace(/\/$/, "")}/tx/${txHash}`
            : undefined,
          storageMode: "0g" as const,
          note: receipt ? undefined : "pending_receipt",
        };
      }, { priority: input.priority });
    } finally {
      await file.close();
    }
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
  }
}
