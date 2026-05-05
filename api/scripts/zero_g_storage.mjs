import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Indexer, ZgFile } from "@0gfoundation/0g-ts-sdk";
import { JsonRpcProvider, Wallet } from "ethers";

console.log = (...args) => {
  process.stderr.write(`${args.join(" ")}\n`);
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function uploadJson(input) {
  const tempFile = path.join(os.tmpdir(), `yb-api-zg-${randomUUID()}.json`);
  try {
    await fs.writeFile(tempFile, JSON.stringify(input.payload, null, 2), "utf8");
    const file = await ZgFile.fromFilePath(tempFile);
    try {
      const provider = new JsonRpcProvider(input.rpcUrl);
      const signer = new Wallet(input.privateKey, provider);
      let uploadResult = null;
      let lastUploadError = null;

      for (const storageUrl of unique(input.storageUrls)) {
        try {
          const indexer = new Indexer(storageUrl);
          const [nextUploadResult, uploadError] = await indexer.upload(
            file,
            input.rpcUrl,
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
        throw lastUploadError ?? new Error("0G upload failed across all endpoints.");
      }

      const txHash =
        "txHash" in uploadResult ? uploadResult.txHash : uploadResult.txHashes[0];
      const rootHash =
        "rootHash" in uploadResult ? uploadResult.rootHash : uploadResult.rootHashes[0];
      const receipt = txHash
        ? await provider.getTransactionReceipt(txHash).catch(() => null)
        : null;

      process.stdout.write(
        JSON.stringify({
          rootHash,
          txHash,
          blockNumber: receipt?.blockNumber ?? 0,
          explorerUrl: txHash
            ? `${input.explorerBase.replace(/\/$/, "")}/tx/${txHash}`
            : null,
        }),
      );
    } finally {
      await file.close();
    }
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
  }
}

async function downloadJson(input) {
  const tempFile = path.join(os.tmpdir(), `yb-api-zg-read-${randomUUID()}.json`);
  try {
    const indexer = new Indexer(input.storageUrl);
    const downloadError = await indexer.download(input.rootHash, tempFile, false);
    if (downloadError) {
      throw downloadError;
    }
    const raw = await fs.readFile(tempFile, "utf8");
    process.stdout.write(raw);
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
  }
}

async function main() {
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
  const input = JSON.parse(raw);
  if (input.command === "upload-json") {
    await uploadJson(input);
    return;
  }
  if (input.command === "download-json") {
    await downloadJson(input);
    return;
  }
  throw new Error("Unsupported command");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
