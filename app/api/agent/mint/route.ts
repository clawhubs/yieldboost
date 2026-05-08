import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { z } from "zod";
import {
  hashStrategy,
  encryptStrategy,
  generateAttestationHash,
} from "@/lib/server/encryption";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import { getContractSignerPrivateKey } from "@/lib/server/network-credentials";
import { recordAgentNftMetadata } from "@/lib/server/runtime-store";
import {
  getYieldStrategyInftAddress,
  getYieldStrategyAttestationOracleAddress,
  getServer0GNetworkConfig,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

export const runtime = "nodejs";

const globalMintQueues = globalThis as typeof globalThis & {
  __yieldboostMintQueues?: Map<string, Promise<void>>;
};

function getMintQueues() {
  if (!globalMintQueues.__yieldboostMintQueues) {
    globalMintQueues.__yieldboostMintQueues = new Map();
  }
  return globalMintQueues.__yieldboostMintQueues;
}

async function withMintSignerQueue<T>(key: string, task: () => Promise<T>) {
  const queues = getMintQueues();
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(task);

  queues.set(
    key,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );

  return current;
}

function bumpFee(value: bigint | null | undefined) {
  return value
    ? (value * BigInt(125)) / BigInt(100) + BigInt(1)
    : undefined;
}

async function buildTxOverrides(
  provider: ethers.JsonRpcProvider,
  nonce: number,
) {
  const feeData = await provider.getFeeData();
  const maxFeePerGas = bumpFee(feeData.maxFeePerGas);
  const maxPriorityFeePerGas = bumpFee(feeData.maxPriorityFeePerGas);

  if (maxFeePerGas && maxPriorityFeePerGas) {
    return { nonce, maxFeePerGas, maxPriorityFeePerGas };
  }

  const gasPrice = bumpFee(feeData.gasPrice);
  return gasPrice ? { nonce, gasPrice } : { nonce };
}

function normalizeMintError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (message.toLowerCase().includes("replacement fee too low")) {
    return "A previous mint transaction from the server signer is still pending. Wait for it to confirm, then mint again.";
  }

  return message.length > 360 ? `${message.slice(0, 360)}...` : message;
}

function getPublicAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_AGENT_METADATA_BASE_URL?.trim() ||
    process.env.YIELDBOOST_PUBLIC_SITE_URL?.trim() ||
    "https://yieldboostai.xyz"
  ).replace(/\/$/, "");
}

const mintRequestSchema = z.object({
  portfolio: z.record(z.number()),
  walletAddress: z.string(),
  decision: z.object({
    current_apy: z.number(),
    optimized_apy: z.number(),
    recommended: z.string(),
    reasoning: z.string().optional(),
    yield_increase_pct: z.number().optional(),
    estimatedAnnualGain: z.number().optional(),
    confidence: z.number().optional(),
  }),
  storageCid: z.string().optional(),
  txHash: z.string().optional(),
  integrityAudit: z
    .object({
      status: z.enum(["APPROVED", "REJECTED"]),
      score: z.number(),
      reasons: z.array(z.string()),
      checkedAt: z.string(),
      source: z.literal("deterministic-logic-guardrail"),
    })
    .optional(),
  teeAttestation: z
    .object({
      chatId: z.string(),
      provider: z.string(),
      model: z.string(),
      timestamp: z.string(),
      isValid: z.boolean(),
      verificationMethod: z.string().optional(),
    })
    .optional(),
});

function buildMintAuditSnapshot(
  portfolio: Record<string, number>,
  currentAPY: number,
) {
  const tokens = Object.entries(portfolio).map(([symbol, value]) => ({
    symbol,
    amount: value,
    valueUSD: value,
  }));

  return {
    tokens,
    totalUSD: tokens.reduce((sum, token) => sum + token.valueUSD, 0),
    currentAPY,
  };
}

/**
 * Mint a new Strategy NFT from an optimization result
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      portfolio,
      walletAddress,
      decision,
      storageCid,
      txHash,
      integrityAudit,
      teeAttestation,
    } = mintRequestSchema.parse(body);
    const networkKey = resolveWalletNetworkKey(
      req.nextUrl.searchParams.get("network") ??
        req.cookies.get(WALLET_NETWORK_COOKIE_KEY)?.value,
    );
    const networkConfig = getServer0GNetworkConfig(networkKey);
    const targetWalletAddress = resolveWalletAddress(walletAddress);

    if (!targetWalletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid connected wallet address is required to mint the Agent NFT",
        },
        { status: 400 },
      );
    }

    const mintIntegrityAudit =
      integrityAudit ??
      auditOptimizationDecision({
        decision,
        portfolioSnapshot: buildMintAuditSnapshot(portfolio, decision.current_apy),
      });

    if (mintIntegrityAudit.status === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Integrity Auditor rejected this strategy, so it cannot be minted.",
          integrityAudit: mintIntegrityAudit,
        },
        { status: 422 },
      );
    }

    // Get contract addresses from env
    const inftAddress = getYieldStrategyInftAddress(networkKey);
    const oracleAddress = getYieldStrategyAttestationOracleAddress(networkKey);
    const privateKey = getContractSignerPrivateKey(networkKey);

    if (!inftAddress || !privateKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "YieldStrategy INFT address or deploy signer is not configured for the active network",
        },
        { status: 503 }
      );
    }

    if (!networkConfig.rpcUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `${networkConfig.label} RPC is not configured`,
        },
        { status: 503 },
      );
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Generate content hash
    const contentHash = hashStrategy({ portfolio, decision });

    // Encrypt strategy data. This stays private inside the public NFT metadata JSON.
    const encryptedStrategy = encryptStrategy({
      portfolio,
      decision,
      performance: {
        roi: decision.yield_increase_pct ?? decision.optimized_apy - decision.current_apy,
        accuracy: decision.confidence ?? null,
        currentApy: decision.current_apy,
        optimizedApy: decision.optimized_apy,
        estimatedAnnualGain: decision.estimatedAnnualGain ?? null,
      },
      storageCid,
      txHash,
      integrityAudit: mintIntegrityAudit,
      teeAttestation,
      timestamp: Date.now(),
    });
    const publicAppBaseUrl = getPublicAppBaseUrl();
    const tokenUri = `${publicAppBaseUrl}/api/agent/metadata/${networkKey}/${contentHash}`;
    const metadataCreatedAt = new Date().toISOString();

    // Calculate APY in basis points
    const apyBps = Math.round(decision.optimized_apy * 100);
    const metadataRecord = {
      networkKey,
      contentHash,
      tokenUri,
      encryptedStrategy,
      name: "YieldBoost Strategy Agent",
      description:
        "Proof-backed YieldBoost AI strategy agent on 0G. The strategy payload is encrypted; public metadata exposes only review-safe proof fields.",
      image: `${publicAppBaseUrl}/marketplace/ya-9-layer-logo.png`,
      externalUrl: `${publicAppBaseUrl}/agents`,
      attributes: [
        { trait_type: "Network", value: networkConfig.label },
        { trait_type: "9-Layer Stack", value: "Verified" },
        { trait_type: "Privacy", value: "Encrypted Strategy" },
        { trait_type: "Integrity Auditor", value: mintIntegrityAudit.status },
        { trait_type: "Optimized APY", value: decision.optimized_apy },
        { trait_type: "Current APY", value: decision.current_apy },
      ],
      proof: {
        contentHash,
        storageCid: storageCid ?? null,
        proofTxHash: txHash ?? null,
        proofExplorerUrl: txHash
          ? `${networkConfig.explorerBase.replace(/\/$/, "")}/tx/${txHash}`
          : null,
        mintTxHash: null,
        mintExplorerUrl: null,
        contractAddress: inftAddress,
      },
      walletAddress: targetWalletAddress,
      tokenId: null,
      apy: decision.optimized_apy,
      currentApy: decision.current_apy,
      createdAt: metadataCreatedAt,
    };
    await recordAgentNftMetadata(metadataRecord);

    const attestationHash =
      teeAttestation?.isValid &&
      teeAttestation.verificationMethod === "broker-response-signature" &&
      teeAttestation.chatId &&
      teeAttestation.provider &&
      teeAttestation.model
        ? generateAttestationHash({
            contentHash,
            timestamp: teeAttestation.timestamp,
            provider: teeAttestation.provider,
            model: teeAttestation.model,
            chatId: teeAttestation.chatId,
            verified: teeAttestation.isValid,
            verificationMethod: teeAttestation.verificationMethod,
          })
        : ethers.ZeroHash;

    // Contract ABI (minimal for minting)
    const inftAbi = [
      "function mintStrategy(address to, string encryptedUri, bytes32 contentHash, uint256 apy, bytes32 attestationHash) external returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "function oracle() view returns (address)",
      "function setOracle(address newOracle) external",
      "function getStrategy(uint256 tokenId) external view returns (tuple(string encryptedUri, bytes32 contentHash, uint256 apy, uint256 timestamp, address creator, bool verified))",
    ];
    const oracleAbi = [
      "function verifyAttestation(bytes32 attestationHash) external view returns (bool)",
      "function recordAttestation(bytes32 attestationHash) external",
    ];

    return await withMintSignerQueue(`${networkKey}:${wallet.address.toLowerCase()}`, async () => {
      const inftContract = new ethers.Contract(inftAddress, inftAbi, wallet);
      let nextNonce = await provider.getTransactionCount(wallet.address, "pending");

      if (attestationHash !== ethers.ZeroHash && teeAttestation?.isValid && oracleAddress) {
        const currentOracle = await inftContract.oracle();
        if (currentOracle.toLowerCase() !== oracleAddress.toLowerCase()) {
          const setOracleTx = await inftContract.setOracle(
            oracleAddress,
            await buildTxOverrides(provider, nextNonce++),
          );
          await setOracleTx.wait();
        }

        const oracleContract = new ethers.Contract(oracleAddress, oracleAbi, wallet);
        const alreadyVerified = await oracleContract.verifyAttestation(attestationHash);

        if (!alreadyVerified) {
          const recordAttestationTx = await oracleContract.recordAttestation(
            attestationHash,
            await buildTxOverrides(provider, nextNonce++),
          );
          await recordAttestationTx.wait();
        }
      }

      const mintTx = await inftContract.mintStrategy(
        targetWalletAddress,
        tokenUri,
        contentHash,
        apyBps,
        attestationHash,
        await buildTxOverrides(provider, nextNonce++),
      );

      const receipt = await mintTx.wait();

      const totalSupply = await inftContract.totalSupply();
      const tokenId = totalSupply;
      const strategy = await inftContract.getStrategy(tokenId);
      const explorerUrl = `${networkConfig.explorerBase.replace(/\/$/, "")}/tx/${receipt.hash}`;
      await recordAgentNftMetadata({
        ...metadataRecord,
        tokenId: tokenId.toString(),
        name: `YieldBoost Strategy Agent #${tokenId.toString()}`,
        externalUrl: `${publicAppBaseUrl}/agents`,
        proof: {
          ...metadataRecord.proof,
          mintTxHash: receipt.hash,
          mintExplorerUrl: explorerUrl,
        },
      });

      return NextResponse.json({
        success: true,
        tokenId: tokenId.toString(),
        txHash: receipt.hash,
        walletAddress: targetWalletAddress,
        blockNumber: receipt.blockNumber,
        encryptedUri: tokenUri,
        tokenUri,
        encryptedStrategy,
        contentHash,
        apy: decision.optimized_apy,
        attestationOracleAddress: oracleAddress,
        verifiedOnChain: Boolean(strategy?.verified),
        integrityAudit: mintIntegrityAudit,
        explorerUrl,
      });
    });
  } catch (error) {
    console.error("Mint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: normalizeMintError(error),
      },
      { status: 500 }
    );
  }
}
