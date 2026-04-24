import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { Indexer, ZgFile } from "@0gfoundation/0g-ts-sdk";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  Wallet,
  type Log,
} from "ethers";
import { z } from "zod";
import {
  type StoredProofRecord,
  type StoredDecisionPayload,
} from "@/lib/backend-data";
import { recordStoredProof } from "@/lib/server/runtime-store";

export const runtime = "nodejs";

const decisionSchema = z.object({
  current_apy: z.number(),
  optimized_apy: z.number(),
  yield_increase: z.number(),
  yield_increase_pct: z.number(),
  recommended: z.string(),
  confidence: z.number(),
  executionSeconds: z.number().optional(),
  estimatedAnnualGain: z.number().optional(),
  totalPortfolio: z.number().optional(),
  reasoning: z.string().optional(),
});

function getConfig() {
  return {
    storageUrl: process.env.ZG_STORAGE_URL ?? process.env.NEXT_PUBLIC_ZG_STORAGE,
    rpcUrl: process.env.ZG_RPC_URL ?? process.env.NEXT_PUBLIC_ZG_RPC,
    privateKey: process.env.ZG_PRIVATE_KEY,
    proofRegistryAddress: process.env.ZG_PROOF_REGISTRY_ADDRESS,
    explorerBase:
      process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
      "https://chainscan-galileo.0g.ai",
  };
}

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
  "function recordProof(string cid, bytes32 rootHash, bytes32 storageTxHash, uint256 currentApyBps, uint256 optimizedApyBps) external returns (uint256 proofId)",
] as const;

function toBasisPoints(value: number) {
  return Math.round(value * 100);
}

function joinNotes(...notes: Array<string | undefined>) {
  const values = notes.filter(Boolean);
  return values.length ? values.join(",") : undefined;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as { decision?: unknown };
  const decision = decisionSchema.parse(payload.decision) as StoredDecisionPayload;
  const config = getConfig();

  if (!config.storageUrl || !config.rpcUrl || !config.privateKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "0G storage is not configured. Set ZG_STORAGE_URL, ZG_RPC_URL, and ZG_PRIVATE_KEY.",
      },
      { status: 503 },
    );
  }

  const timestamp = new Date().toISOString();
  const tempFile = path.join(os.tmpdir(), `yieldboost-proof-${randomUUID()}.json`);

  try {
    await fs.writeFile(
      tempFile,
      JSON.stringify(
        {
          ...decision,
          appId: "yieldboost-ai",
          timestamp,
        },
        null,
        2,
      ),
      "utf8",
    );

    const file = await ZgFile.fromFilePath(tempFile);

    try {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const signer = new Wallet(config.privateKey, provider);
      const indexer = new Indexer(config.storageUrl);
      const [uploadResult, uploadError] = await indexer.upload(file, config.rpcUrl, signer);

      if (uploadError) {
        return NextResponse.json(
          {
            success: false,
            error: uploadError.message,
          },
          { status: 502 },
        );
      }

      const txHash =
        "txHash" in uploadResult ? uploadResult.txHash : uploadResult.txHashes[0];
      const rootHash =
        "rootHash" in uploadResult ? uploadResult.rootHash : uploadResult.rootHashes[0];
      let receipt = null;

      if (txHash) {
        try {
          receipt = await provider.getTransactionReceipt(txHash);
        } catch {
          receipt = null;
        }
      }

      const proof: StoredProofRecord = {
        cid: rootHash,
        txHash,
        blockNumber: receipt?.blockNumber ?? 0,
        timestamp,
        explorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${txHash}`,
        decision,
        note: receipt ? undefined : "pending_receipt",
      };

      if (!config.proofRegistryAddress) {
        proof.note = joinNotes(proof.note, "proof_registry_not_configured");
      }

      if (config.proofRegistryAddress) {
        try {
          const proofRegistry = new Contract(
            config.proofRegistryAddress,
            proofRegistryAbi,
            signer,
          );

          const registryTx = await proofRegistry.recordProof(
            rootHash,
            rootHash,
            txHash,
            toBasisPoints(decision.current_apy),
            toBasisPoints(decision.optimized_apy),
          );

          proof.proofRegistryAddress = config.proofRegistryAddress;
          proof.proofRegistryTxHash = registryTx.hash;
          proof.proofRegistryExplorerUrl = `${config.explorerBase.replace(/\/$/, "")}/tx/${registryTx.hash}`;

          const registryReceipt = await registryTx.wait();
          if (registryReceipt) {
            const iface = new Interface(proofRegistryAbi);
            const eventLog = registryReceipt.logs.find((log: Log) => {
              try {
                const parsed = iface.parseLog(log);
                return parsed?.name === "ProofRecorded";
              } catch {
                return false;
              }
            });

            if (eventLog) {
              const parsed = iface.parseLog(eventLog);
              if (parsed) {
                proof.proofRegistryProofId = parsed.args.proofId.toString();
              }
            }
          } else {
            proof.note = joinNotes(proof.note, "pending_registry_receipt");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "proof_registry_failed";
          proof.note = joinNotes(proof.note, `proof_registry_failed:${message}`);
        }
      }

      await recordStoredProof(proof);

      return NextResponse.json({
        success: true,
        cid: proof.cid,
        rootHash,
        txHash: proof.txHash,
        blockNumber: proof.blockNumber,
        timestamp: proof.timestamp,
        explorerUrl: proof.explorerUrl,
        proofRegistryAddress: proof.proofRegistryAddress,
        proofRegistryTxHash: proof.proofRegistryTxHash,
        proofRegistryProofId: proof.proofRegistryProofId,
        proofRegistryExplorerUrl: proof.proofRegistryExplorerUrl,
        note: proof.note,
      });
    } finally {
      await file.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown 0G storage error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 502 },
    );
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
  }
}
