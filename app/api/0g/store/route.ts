import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { Indexer, ZgFile } from "@0gfoundation/0g-ts-sdk";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
} from "ethers";
import { z } from "zod";
import {
  type StoredProofRecord,
  type StoredDecisionPayload,
  type StoredPortfolioSnapshot,
} from "@/lib/backend-data";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import {
  getServer0GNetworkConfig,
  resolveWalletNetworkKey,
  type WalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";
import {
  getLatestStoredProofForWallet,
  recordStoredProof,
} from "@/lib/server/runtime-store";
import { recordHallucinationBlacklistEntry } from "@/lib/server/hallucination-blacklist";
import { syncSovereignMemory } from "@/lib/server/sovereign-memory";

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

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional();
const portfolioSnapshotSchema = z
  .object({
    tokens: z.array(
      z.object({
        symbol: z.string(),
        amount: z.number(),
        valueUSD: z.number(),
      }),
    ),
    totalUSD: z.number(),
    currentAPY: z.number(),
    displayTotal: z.number().optional(),
    displayUnit: z.string().optional(),
    displayLabel: z.string().optional(),
  })
  .optional();

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
      : [
          configuredUrl,
          "https://indexer-storage-turbo.0g.ai",
        ];

  return candidates.filter(
    (value, index, items): value is string =>
      Boolean(value) && items.indexOf(value) === index,
  );
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as {
    decision?: unknown;
    portfolioSnapshot?: unknown;
    networkKey?: WalletNetworkKey;
    walletAddress?: string;
    // TEE metadata from client
    teeProvider?: string;
    teeModel?: string;
    teeChatId?: string;
    teeVerified?: boolean;
    teeVerificationMethod?: string;
    teeSignedTextMatches?: boolean;
    llmProvider?: string;
  };
  const decision = decisionSchema.parse(payload.decision) as StoredDecisionPayload;
  const portfolioSnapshot = portfolioSnapshotSchema.parse(
    payload.portfolioSnapshot,
  ) as StoredPortfolioSnapshot | undefined;
  const walletAddress = walletAddressSchema.safeParse(payload.walletAddress).data;
  const networkKey = resolveWalletNetworkKey(
    payload.networkKey ?? req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
  );
  const config = getServer0GNetworkConfig(networkKey);
  const comparisonProof = walletAddress
    ? await getLatestStoredProofForWallet(walletAddress, networkKey)
    : null;
  const integrityAudit = auditOptimizationDecision({
    decision,
    portfolioSnapshot,
    comparisonProof,
  });

  if (integrityAudit.status === "REJECTED") {
    const blacklistEntry = await recordHallucinationBlacklistEntry({
      networkKey,
      decision,
      portfolioSnapshot,
      audit: integrityAudit,
    }).catch((error) => {
      console.warn("[integrity-audit] Blacklist indexing failed:", error);
      return null;
    });

    return NextResponse.json(
      {
        success: false,
        error: "Integrity Auditor rejected this optimization; proof write skipped.",
        integrityAudit,
        blacklistEntry,
      },
      { status: 422 },
    );
  }

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
          appId: "yieldboost-ai",
          timestamp,
          networkKey,
          walletAddress: walletAddress ?? undefined,
          decision,
          portfolioSnapshot,
          integrityAudit,
          teeProvider: payload.teeProvider,
          teeModel: payload.teeModel,
          teeChatId: payload.teeChatId,
          teeVerified: payload.teeVerified,
          teeVerificationMethod: payload.teeVerificationMethod,
          teeSignedTextMatches: payload.teeSignedTextMatches,
          llmProvider: payload.llmProvider,
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
      const storageUrlCandidates = getStorageUrlCandidates(
        networkKey,
        config.storageUrl,
      );

      console.log("0G Storage upload starting...");
      console.log("Storage URL candidates:", storageUrlCandidates);
      console.log("RPC URL:", config.rpcUrl);

      let uploadResult:
        | {
            txHash: string;
            rootHash: string;
          }
        | {
            txHashes: string[];
            rootHashes: string[];
          }
        | null = null;
      let lastUploadError: unknown = null;

      for (const storageUrl of storageUrlCandidates) {
        try {
          const indexer = new Indexer(storageUrl);
          const [nextUploadResult, uploadError] = await indexer.upload(
            file,
            config.rpcUrl,
            signer,
          );

          if (uploadError) {
            lastUploadError = uploadError;
            console.error(`0G Storage upload error via ${storageUrl}:`, uploadError);
            continue;
          }

          uploadResult = nextUploadResult;
          console.log(`0G Storage upload success via ${storageUrl}:`, uploadResult);
          break;
        } catch (error) {
          lastUploadError = error;
          console.error(`0G Storage upload threw via ${storageUrl}:`, error);
        }
      }

      if (!uploadResult) {
        const message =
          lastUploadError instanceof Error
            ? lastUploadError.message
            : "0G storage upload failed across all configured endpoints.";

        return NextResponse.json(
          {
            success: false,
            error: message,
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
        networkKey,
        explorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${txHash}`,
        decision,
        walletAddress: walletAddress ?? signer.address,
        portfolioSnapshot,
        integrityAudit,
        note: receipt ? undefined : "pending_receipt",
        // TEE / 0G Compute metadata
        teeProvider: payload.teeProvider,
        teeModel: payload.teeModel,
        teeChatId: payload.teeChatId,
        teeVerified: payload.teeVerified,
        teeVerificationMethod: payload.teeVerificationMethod,
        teeSignedTextMatches: payload.teeSignedTextMatches,
        llmProvider: payload.llmProvider,
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

          proof.note = joinNotes(proof.note, "pending_registry_receipt");
        } catch (error) {
          const message = error instanceof Error ? error.message : "proof_registry_failed";
          proof.note = joinNotes(proof.note, `proof_registry_failed:${message}`);
        }
      }

      await recordStoredProof(proof);
      const memoryRecord = await syncSovereignMemory({
        agentId: walletAddress ?? signer.address,
        walletAddress: walletAddress ?? signer.address,
        networkKey,
        proof,
      }).catch((error) => {
        console.warn("[sovereign-memory] Memory sync failed:", error);
        return null;
      });

      return NextResponse.json({
        success: true,
        cid: proof.cid,
        rootHash,
        txHash: proof.txHash,
        blockNumber: proof.blockNumber,
        timestamp: proof.timestamp,
        networkKey: proof.networkKey,
        explorerUrl: proof.explorerUrl,
        walletAddress: proof.walletAddress,
        proofRegistryAddress: proof.proofRegistryAddress,
        proofRegistryTxHash: proof.proofRegistryTxHash,
        proofRegistryProofId: proof.proofRegistryProofId,
        proofRegistryExplorerUrl: proof.proofRegistryExplorerUrl,
        integrityAudit: proof.integrityAudit,
        sovereignMemory: memoryRecord,
        note: proof.note,
        // TEE / 0G Compute metadata
        teeProvider: proof.teeProvider,
        teeModel: proof.teeModel,
        teeChatId: proof.teeChatId,
        teeVerified: proof.teeVerified,
        teeVerificationMethod: proof.teeVerificationMethod,
        teeSignedTextMatches: proof.teeSignedTextMatches,
        llmProvider: proof.llmProvider,
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
