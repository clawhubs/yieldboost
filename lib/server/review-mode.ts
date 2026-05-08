import "server-only";

import { cookies } from "next/headers";
import { ethers } from "ethers";
import {
  DEFAULT_WALLET_ADDRESS,
  getAvailableWalletNetworks,
  getServer0GNetworkConfig,
  getServerDefaultNetworkKey,
  getGlobalBlacklistRegistryAddress,
  getValidationRegistryAddress,
  getYieldStrategyAttestationOracleAddress,
  getYieldStrategyInftAddress,
  getYieldStrategyMarketplaceAddress,
  JUDGE_NETWORK_COOKIE_KEY,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  WALLET_COOKIE_KEY,
  type WalletNetworkKey,
} from "@/lib/wallet";
import { getDocsRuntimeStatus } from "@/lib/docs/content";
import type {
  PortfolioResponse,
  StoredAgentMemoryRecord,
  StoredBlacklistRecord,
  StoredCrossAgentHandshake,
  StoredGovernanceDecision,
  StoredProofRecord,
  StoredStressTestReport,
  StoredZkComplianceProof,
  StoredZkReasoningProof,
} from "@/lib/backend-data";
import { auditOptimizationDecision } from "@/lib/integrity-audit";
import {
  getKnownProofCountFloorForWallet,
  resolveLatestProofForWallet,
  resolveLatestProofForWalletAcrossNetworks,
  resolveProofCountForWallet,
} from "@/lib/server/proof-resolution";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import {
  getComputeLedgerPrivateKey,
  getComputeProviderAddress,
  hasComputeCredentials,
} from "@/lib/server/network-credentials";
import {
  getBlacklistEntries,
  getLatestCrossAgentHandshake,
  getLatestAgentMemory,
  getLatestGovernanceDecision,
  getLatestStressTestReport,
  getLatestZkComplianceProof,
  getLatestZkReasoningProof,
} from "@/lib/server/runtime-store";

type BadgeTone = "teal" | "green" | "amber" | "white";
type HealthStatus = "live" | "configured" | "partial" | "pending";

export interface JudgeStatusCard {
  label: string;
  value: string;
  helper: string;
  tone?: BadgeTone;
}

export interface JudgeComponentStatus {
  title: string;
  status: HealthStatus;
  detail: string;
  href?: string;
  address?: string;
  meta?: string;
}

export interface JudgeDeploymentArtifact {
  label: string;
  value: string;
  helper: string;
  status: HealthStatus;
  href?: string;
  meta?: string;
}

export interface JudgeChecklistItem {
  label: string;
  status: HealthStatus;
  detail: string;
}

export interface JudgeEnvItem {
  name: string;
  requiredFor: string;
  status: "set" | "missing" | "optional";
  detail: string;
}

export interface JudgePageData {
  reviewNetwork: WalletNetworkKey;
  reviewNetworkLabel: string;
  runtimeLabel: string;
  statusCards: JudgeStatusCard[];
  latestProof: StoredProofRecord | null;
  sovereignMemory: StoredAgentMemoryRecord | null;
  latestBlacklistEntry: StoredBlacklistRecord | null;
  latestStressReport: StoredStressTestReport | null;
  latestZkComplianceProof: StoredZkComplianceProof | null;
  latestZkReasoningProof: StoredZkReasoningProof | null;
  latestGovernanceDecision: StoredGovernanceDecision | null;
  latestCrossAgentHandshake: StoredCrossAgentHandshake | null;
  latestProofCards: JudgeStatusCard[];
  integrityStackCards: JudgeStatusCard[];
  efficiencyCards: JudgeStatusCard[];
  deploymentArtifacts: JudgeDeploymentArtifact[];
  components: JudgeComponentStatus[];
  mainnetChecklist: JudgeChecklistItem[];
  envChecklist: JudgeEnvItem[];
  demoFlow: string[];
  blockers: string[];
  proofCount: number;
}

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function trimUrl(value: string | undefined) {
  return value ? value.replace(/\/$/, "") : undefined;
}

function shorten(value: string | undefined, size = 10) {
  if (!value) return "Pending verification";
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}...${value.slice(-Math.max(4, size - 2))}`;
}

function formatPercent(value: number | undefined) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "Pending";
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== "number") return "Pending";
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value > 0 && value < 1 ? 4 : 2,
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 2,
  })}`;
}

function formatTime(value: string | undefined) {
  if (!value) return "No proof recorded yet";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSnapshotValue(proof: StoredProofRecord | null) {
  if (!proof) return "Pending";

  const displayTotal = proof.portfolioSnapshot?.displayTotal;
  const displayUnit = proof.portfolioSnapshot?.displayUnit;
  if (typeof displayTotal === "number" && displayUnit) {
    const rounded = displayTotal > 0 && displayTotal < 1
      ? displayTotal.toFixed(4)
      : displayTotal.toFixed(2);
    return `${rounded} ${displayUnit}`;
  }

  const fallback = proof.decision.totalPortfolio;
  if (typeof fallback === "number" && fallback > 0) {
    const rounded = fallback > 0 && fallback < 1
      ? fallback.toFixed(4)
      : fallback.toFixed(2);
    return `${rounded} 0G`;
  }

  return "Pending";
}

function formatPortfolioSnapshotValue(value: number | undefined, unit: string | undefined) {
  if (typeof value !== "number" || value <= 0) {
    return null;
  }

  const rounded = value > 0 && value < 1 ? value.toFixed(4) : value.toFixed(2);
  return unit ? `${rounded} ${unit}` : `$${rounded}`;
}

function buildJudgePortfolioFallback(
  walletAddress: string,
  latestProof: StoredProofRecord | null,
): PortfolioResponse {
  const snapshot = latestProof?.portfolioSnapshot;
  const totalUSD = snapshot?.totalUSD ?? latestProof?.decision.totalPortfolio ?? 0;

  return {
    tokens: snapshot?.tokens ?? [],
    totalUSD,
    currentAPY: snapshot?.currentAPY ?? latestProof?.decision.current_apy ?? 0,
    walletAddress,
    source: "judge_runtime_timeout_fallback",
    latestTxHash: latestProof?.txHash,
    displayTotal: snapshot?.displayTotal ?? totalUSD,
    displayUnit: snapshot?.displayUnit,
    displayLabel: snapshot?.displayLabel ?? "Runtime proof snapshot fallback",
  };
}

function toHealthStatus(value: boolean): HealthStatus {
  return value ? "configured" : "pending";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  label: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          console.warn(`[review-mode] ${label} timed out after ${timeoutMs}ms`);
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function formatFeatureStatus(value: string | undefined) {
  if (!value) return "Pending";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRiskLabel(score: number | undefined) {
  if (typeof score !== "number") return "Risk pending";
  if (score >= 85) return `Critical risk (${score}/100)`;
  if (score >= 65) return `High risk (${score}/100)`;
  if (score >= 45) return `Elevated risk (${score}/100)`;
  return `Low risk (${score}/100)`;
}

function toneForRecordedFeature(status: string | undefined): BadgeTone {
  if (!status) return "amber";
  if (["active", "completed", "verified", "testnet-verified"].includes(status)) {
    return "green";
  }
  if (["tee-envelope-recorded", "zk-ready", "warning"].includes(status)) {
    return "teal";
  }
  return "amber";
}

function readEnv(name: string) {
  return process.env[name];
}

function buildExplorerTxHref(networkKey: string, txHash: string | undefined) {
  if (!txHash) return undefined;
  return `${getServer0GNetworkConfig(networkKey).explorerBase.replace(/\/$/, "")}/tx/${txHash}`;
}

function buildExplorerAddressHref(networkKey: string, address: string | undefined) {
  if (!address) return undefined;
  return `${getServer0GNetworkConfig(networkKey).explorerBase.replace(/\/$/, "")}/address/${address}`;
}

async function resolveLatestAgentMintArtifact(
  walletAddress: string,
  networkKey: string,
): Promise<JudgeDeploymentArtifact> {
  const networkConfig = getServer0GNetworkConfig(networkKey);
  const inftAddress = getYieldStrategyInftAddress(networkKey);

  if (!networkConfig.rpcUrl || !inftAddress) {
    return {
      label: "Latest Agent NFT mint tx",
      value: "Pending",
      helper: "INFT contract or RPC is not configured for the active review network.",
      status: "pending",
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const inft = new ethers.Contract(
      inftAddress,
      [
        "function totalSupply() view returns (uint256)",
        "function ownerOf(uint256 tokenId) view returns (address)",
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      provider,
    );
    const totalSupply = Number(await inft.totalSupply());
    const zeroAddress = ethers.ZeroAddress;
    const latestBlock = await provider.getBlockNumber();

    for (let tokenId = totalSupply; tokenId >= 1; tokenId -= 1) {
      try {
        const owner = String(await inft.ownerOf(tokenId));
        if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
          continue;
        }

        const filter = inft.filters.Transfer(zeroAddress, owner, BigInt(tokenId));
        const fromBlock = Math.max(0, latestBlock - 500_000);
        const logs = await inft.queryFilter(filter, fromBlock, latestBlock);
        const latestLog = logs.at(-1);
        const txHash = latestLog?.transactionHash;

        return {
          label: "Latest Agent NFT mint tx",
          value: txHash ? shorten(txHash, 8) : `Agent NFT #${tokenId}`,
          helper: txHash
            ? `Most recent Agent NFT minted to the review wallet: token #${tokenId}.`
            : `Token #${tokenId} exists for the review wallet, but the mint tx was outside the scanned block window.`,
          status: txHash ? "live" : "configured",
          href: buildExplorerTxHref(networkKey, txHash),
          meta: `Token #${tokenId}`,
        };
      } catch {
        // Keep scanning older token IDs if a token read fails.
      }
    }

    return {
      label: "Latest Agent NFT mint tx",
      value: "No judge NFT yet",
      helper: "The INFT contract is live, but no minted Agent NFT was found for the review wallet.",
      status: "partial",
      href: buildExplorerAddressHref(networkKey, inftAddress),
      meta: "INFT contract available",
    };
  } catch {
    return {
      label: "Latest Agent NFT mint tx",
      value: "Lookup pending",
      helper: "Judge mode could not resolve the latest mint transaction from the RPC during this render.",
      status: "partial",
      href: buildExplorerAddressHref(networkKey, inftAddress),
      meta: "Contract lookup fallback",
    };
  }
}

async function buildDeploymentArtifacts({
  reviewWallet,
  reviewNetwork,
}: {
  reviewWallet: string;
  reviewNetwork: WalletNetworkKey;
}): Promise<JudgeDeploymentArtifact[]> {
  const artifactNetwork = reviewNetwork;
  const networkConfig = getServer0GNetworkConfig(artifactNetwork);
  const inftAddress = getYieldStrategyInftAddress(artifactNetwork);
  const marketplaceAddress = getYieldStrategyMarketplaceAddress(artifactNetwork);
  const oracleAddress = getYieldStrategyAttestationOracleAddress(artifactNetwork);
  const blacklistRegistryAddress = getGlobalBlacklistRegistryAddress(artifactNetwork);
  const validationRegistryAddress = getValidationRegistryAddress(artifactNetwork);
  const latestMint = await withTimeout(
    resolveLatestAgentMintArtifact(reviewWallet, artifactNetwork),
    3_500,
    {
      label: "Latest Agent NFT mint tx",
      value: "Lookup timed out",
      helper: "Contract lookup timed out, so Judge Mode is showing the rest of the deployment artifacts from configured env values.",
      status: "partial",
      href: buildExplorerAddressHref(artifactNetwork, inftAddress),
      meta: "Contract lookup fallback",
    },
    "latest agent mint lookup",
  );

  return [
    latestMint,
    {
      label: `${networkConfig.label} strategy marketplace`,
      value: marketplaceAddress ? shorten(marketplaceAddress, 8) : "Not configured",
      helper: marketplaceAddress
        ? "Adoption contract used by the Marketplace tab for listed Strategy Agent NFTs."
        : `Set the marketplace address to expose on-chain listing/adoption from Judge Mode on ${networkConfig.label}.`,
      status: marketplaceAddress ? "live" : "pending",
      href: buildExplorerAddressHref(artifactNetwork, marketplaceAddress),
      meta: networkConfig.label,
    },
    {
      label: `${networkConfig.label} attestation oracle`,
      value: oracleAddress ? shorten(oracleAddress, 8) : "Not configured",
      helper: oracleAddress
        ? "On-chain oracle used by Agent NFT minting to mark broker-backed attestation hashes as verified."
        : `Set the oracle address to show on-chain attestation verification in Judge Mode on ${networkConfig.label}.`,
      status: oracleAddress ? "live" : "pending",
      href: buildExplorerAddressHref(artifactNetwork, oracleAddress),
      meta: networkConfig.label,
    },
    {
      label: `${networkConfig.label} YieldStrategyINFT`,
      value: inftAddress ? shorten(inftAddress, 8) : "Not configured",
      helper: inftAddress
        ? "ERC-721 strategy artifact contract used when optimization results are minted as Agent NFTs."
        : `Set the INFT address to enable contract-backed Agent NFT inventory on ${networkConfig.label}.`,
      status: inftAddress ? "live" : "pending",
      href: buildExplorerAddressHref(artifactNetwork, inftAddress),
      meta: networkConfig.label,
    },
    {
      label: `${networkConfig.label} GlobalBlacklistRegistry`,
      value: blacklistRegistryAddress ? shorten(blacklistRegistryAddress, 8) : "Not configured",
      helper: blacklistRegistryAddress
        ? "Append-only on-chain anchor for hallucination blacklist CIDs captured by the Integrity Auditor."
        : `Set the blacklist registry address to expose on-chain rejection anchors on ${networkConfig.label}.`,
      status: blacklistRegistryAddress ? "live" : "pending",
      href: buildExplorerAddressHref(artifactNetwork, blacklistRegistryAddress),
      meta: "Hallucination Blacklist",
    },
    {
      label: `${networkConfig.label} ValidationRegistry`,
      value: validationRegistryAddress ? shorten(validationRegistryAddress, 8) : "Not configured",
      helper: validationRegistryAddress
        ? "On-chain anchor for Multiverse Stress Test report cards and historical replay verdicts."
        : `Set the validation registry address to expose stress-test report anchors on ${networkConfig.label}.`,
      status: validationRegistryAddress ? "live" : "pending",
      href: buildExplorerAddressHref(artifactNetwork, validationRegistryAddress),
      meta: "Multiverse Stress Test",
    },
  ];
}

function hasAlibabaEmbeddingConfig() {
  return Boolean(
    hasValue(readEnv("ALIBABA_API_KEY")) &&
      hasValue(readEnv("ALIBABA_BASE_URL")) &&
      hasValue(readEnv("ALIBABA_EMBEDDING_MODEL")),
  );
}

function buildEnvChecklist() {
  const items: JudgeEnvItem[] = [
    {
      name: "NEXT_PUBLIC_APP_URL",
      requiredFor: "Docs + server-side route loaders",
      status: hasValue(readEnv("NEXT_PUBLIC_APP_URL")) ? "set" : "missing",
      detail: "Prevents server-side feature pages from guessing the app origin in Vercel and local smoke tests.",
    },
    {
      name: "NEXT_PUBLIC_DEMO_WALLET_ADDRESS",
      requiredFor: "Judge/watch-mode UX",
      status: hasValue(readEnv("NEXT_PUBLIC_DEMO_WALLET_ADDRESS")) ? "set" : "optional",
      detail: "If absent, the app falls back to the built-in public demo wallet.",
    },
    {
      name: "ZG_STORAGE_URL",
      requiredFor: "Testnet proof upload",
      status: hasValue(readEnv("ZG_STORAGE_URL")) ? "set" : "missing",
      detail: "Legacy testnet server storage env. The app now prefers `ZG_TESTNET_STORAGE_URL` or `NEXT_PUBLIC_ZG_STORAGE` before falling back here.",
    },
    {
      name: "ZG_PRIVATE_KEY",
      requiredFor: "Testnet proof upload signer",
      status: hasValue(readEnv("ZG_PRIVATE_KEY")) ? "set" : "missing",
      detail: "Legacy testnet signer env. The app now prefers `ZG_TESTNET_PRIVATE_KEY` before falling back here.",
    },
    {
      name: "ZG_PROOF_REGISTRY_ADDRESS",
      requiredFor: "Optional testnet on-chain proof anchoring",
      status: hasValue(readEnv("ZG_PROOF_REGISTRY_ADDRESS")) ? "set" : "optional",
      detail: "Legacy testnet registry env. The app now prefers `ZG_TESTNET_PROOF_REGISTRY_ADDRESS` before falling back here.",
    },
    {
      name: "ZG_TESTNET_RPC_URL",
      requiredFor: "Explicit testnet server RPC",
      status: hasValue(readEnv("ZG_TESTNET_RPC_URL")) ? "set" : "optional",
      detail: "Recommended when the same environment also has mainnet RPC values, so testnet compute/proof routes cannot drift onto the wrong chain.",
    },
    {
      name: "ZG_TESTNET_STORAGE_URL",
      requiredFor: "Explicit testnet proof upload",
      status: hasValue(readEnv("ZG_TESTNET_STORAGE_URL")) ? "set" : "optional",
      detail: "Recommended companion to `ZG_TESTNET_RPC_URL` for unambiguous testnet proof writes.",
    },
    {
      name: "ZG_TESTNET_PRIVATE_KEY",
      requiredFor: "Explicit testnet proof signer",
      status: hasValue(readEnv("ZG_TESTNET_PRIVATE_KEY")) ? "set" : "optional",
      detail: "Recommended if you want separate signers for testnet and mainnet proof writes.",
    },
    {
      name: "ZG_TESTNET_PROOF_REGISTRY_ADDRESS",
      requiredFor: "Explicit testnet registry anchoring",
      status: hasValue(readEnv("ZG_TESTNET_PROOF_REGISTRY_ADDRESS")) ? "set" : "optional",
      detail: "Lets testnet and mainnet proof registry contracts stay separate without reusing one env name.",
    },
    {
      name: "ZG_MAINNET_RPC_URL",
      requiredFor: "Mainnet cutover",
      status: hasValue(readEnv("ZG_MAINNET_RPC_URL")) ? "set" : "optional",
      detail: "The app can fall back to the public mainnet RPC, but a dedicated RPC is safer for production traffic.",
    },
    {
      name: "ZG_MAINNET_STORAGE_URL",
      requiredFor: "Mainnet proof upload",
      status: hasValue(readEnv("ZG_MAINNET_STORAGE_URL")) ? "set" : "missing",
      detail: "Required before mainnet proof writes can be considered ready.",
    },
    {
      name: "ZG_MAINNET_PRIVATE_KEY",
      requiredFor: "Mainnet proof upload signer",
      status: hasValue(readEnv("ZG_MAINNET_PRIVATE_KEY")) ? "set" : "missing",
      detail: "Needed for the mainnet 0G Storage signer path.",
    },
    {
      name: "ZG_MAINNET_PROOF_REGISTRY_ADDRESS",
      requiredFor: "Mainnet proof anchoring",
      status: hasValue(readEnv("ZG_MAINNET_PROOF_REGISTRY_ADDRESS")) ? "set" : "missing",
      detail: "Keeps the on-chain verification story intact once mainnet is enabled.",
    },
    {
      name: "KV_REST_API_URL",
      requiredFor: "Persistent runtime proof store",
      status: hasValue(readEnv("KV_REST_API_URL")) ? "set" : "optional",
      detail: "Without KV, the app falls back to the local `.artifacts/runtime-store.local.json` file.",
    },
    {
      name: "KV_REST_API_TOKEN",
      requiredFor: "Persistent runtime proof store",
      status: hasValue(readEnv("KV_REST_API_TOKEN")) ? "set" : "optional",
      detail: "Pair with `KV_REST_API_URL` for cross-deployment persistence on Vercel.",
    },
    {
      name: "ZG_COMPUTE_PROVIDER_ADDRESS",
      requiredFor: "Shared compute provider fallback",
      status: hasValue(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS")) ? "set" : "optional",
      detail: "Optional shared fallback when you do not want separate compute provider envs per network.",
    },
    {
      name: "ZG_TESTNET_COMPUTE_PROVIDER_ADDRESS",
      requiredFor: "Explicit testnet 0G Compute provider",
      status: hasValue(readEnv("ZG_TESTNET_COMPUTE_PROVIDER_ADDRESS")) ? "set" : "optional",
      detail: "Recommended if testnet and mainnet will use different provider addresses.",
    },
    {
      name: "ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS",
      requiredFor: "Explicit mainnet 0G Compute provider",
      status: hasValue(readEnv("ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS")) ? "set" : "missing",
      detail: "Recommended for mainnet cutover so compute traffic cannot accidentally reuse a testnet provider.",
    },
    {
      name: "ZG_LEDGER_PRIVATE_KEY",
      requiredFor: "Shared compute / agent signer fallback",
      status: hasValue(readEnv("ZG_LEDGER_PRIVATE_KEY")) ? "set" : "optional",
      detail: "Optional shared fallback when you do not want separate signers per network.",
    },
    {
      name: "ZG_TESTNET_LEDGER_PRIVATE_KEY",
      requiredFor: "Explicit testnet compute / agent signer",
      status: hasValue(readEnv("ZG_TESTNET_LEDGER_PRIVATE_KEY")) ? "set" : "optional",
      detail: "Recommended when testnet and mainnet will use different compute or contract signers.",
    },
    {
      name: "ZG_MAINNET_LEDGER_PRIVATE_KEY",
      requiredFor: "Explicit mainnet compute / agent signer",
      status: hasValue(readEnv("ZG_MAINNET_LEDGER_PRIVATE_KEY")) ? "set" : "missing",
      detail: "Recommended for mainnet compute setup and as the preferred signer for contract-backed mainnet routes.",
    },
    {
      name: "YIELD_STRATEGY_INFT_ADDRESS",
      requiredFor: "Testnet / shared Agent NFT contract mode",
      status: hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS")) ? "set" : "optional",
      detail: "Without it, `/agents` falls back to proof-backed history instead of contract reads.",
    },
    {
      name: "GLOBAL_BLACKLIST_REGISTRY_TESTNET_ADDRESS",
      requiredFor: "Testnet Hallucination Blacklist anchoring",
      status: hasValue(readEnv("GLOBAL_BLACKLIST_REGISTRY_TESTNET_ADDRESS")) ? "set" : "optional",
      detail: "Preferred explicit testnet blacklist registry address instead of relying on the shared fallback env.",
    },
    {
      name: "VALIDATION_REGISTRY_TESTNET_ADDRESS",
      requiredFor: "Testnet Multiverse Stress Test anchoring",
      status: hasValue(readEnv("VALIDATION_REGISTRY_TESTNET_ADDRESS")) ? "set" : "optional",
      detail: "Preferred explicit testnet validation registry address instead of relying on the shared fallback env.",
    },
    {
      name: "YIELD_STRATEGY_INFT_MAINNET_ADDRESS",
      requiredFor: "Mainnet Agent NFT contract mode",
      status: hasValue(readEnv("YIELD_STRATEGY_INFT_MAINNET_ADDRESS")) ? "set" : "optional",
      detail: "Recommended once mainnet cutover is active so testnet and mainnet contract addresses do not share one env.",
    },
    {
      name: "YIELD_STRATEGY_ATTESTATION_ORACLE_MAINNET_ADDRESS",
      requiredFor: "On-chain INFT attestation verification",
      status: hasValue(readEnv("YIELD_STRATEGY_ATTESTATION_ORACLE_MAINNET_ADDRESS")) ? "set" : "optional",
      detail: "Lets Agent NFT minting register broker-verified attestation hashes on-chain before the INFT contract marks the strategy as verified.",
    },
    {
      name: "GLOBAL_BLACKLIST_REGISTRY_MAINNET_ADDRESS",
      requiredFor: "Mainnet Hallucination Blacklist anchoring",
      status: hasValue(readEnv("GLOBAL_BLACKLIST_REGISTRY_MAINNET_ADDRESS")) ? "set" : "missing",
      detail: "Mainnet append-only registry for blacklist CIDs produced by the Integrity Auditor.",
    },
    {
      name: "VALIDATION_REGISTRY_MAINNET_ADDRESS",
      requiredFor: "Mainnet Multiverse Stress Test anchoring",
      status: hasValue(readEnv("VALIDATION_REGISTRY_MAINNET_ADDRESS")) ? "set" : "missing",
      detail: "Mainnet registry for stress-test report cards and historical replay verdict CIDs.",
    },
  ];

  return items;
}

function buildMainnetChecklist({
  runtimeStatus,
  latestProof,
}: {
  runtimeStatus: ReturnType<typeof getDocsRuntimeStatus>;
  latestProof: StoredProofRecord | null;
}) {
  const preferredNetwork = getServerDefaultNetworkKey();
  const mainnet = runtimeStatus.networks.mainnet;
  const usingMainnet = preferredNetwork === "mainnet";
  const hasMainnetSigner = hasValue(readEnv("ZG_MAINNET_PRIVATE_KEY"));
  const hasMainnetStorage = hasValue(readEnv("ZG_MAINNET_STORAGE_URL"));
  const hasMainnetRegistry = hasValue(readEnv("ZG_MAINNET_PROOF_REGISTRY_ADDRESS"));
  const hasMainnetChainId = hasValue(readEnv("NEXT_PUBLIC_0G_MAINNET_CHAIN_ID"));
  const hasMainnetExplorer = hasValue(readEnv("NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL"));
  const hasMainnetCompute = hasComputeCredentials("mainnet");
  const hasInft =
    hasValue(readEnv("YIELD_STRATEGY_INFT_MAINNET_ADDRESS")) ||
    hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS"));
  const hasAttestationOracle =
    hasValue(readEnv("YIELD_STRATEGY_ATTESTATION_ORACLE_MAINNET_ADDRESS")) ||
    hasValue(readEnv("YIELD_STRATEGY_ATTESTATION_ORACLE_ADDRESS"));

  return [
    {
      label: "Wallet switching and explorer labels",
      status: mainnet.enabled && hasMainnetChainId && hasMainnetExplorer ? "configured" : "partial",
      detail: mainnet.enabled
        ? "Mainnet appears in the wallet switcher and the UI now reads explorer/RPC config from the active network."
        : "Set `NEXT_PUBLIC_0G_MAINNET_CHAIN_ID` and `NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL` to fully expose mainnet switching.",
    },
    {
      label: "Mainnet proof upload path",
      status: hasMainnetSigner && hasMainnetStorage ? "configured" : "pending",
      detail: hasMainnetSigner && hasMainnetStorage
        ? "Signer + storage endpoint are present for mainnet proof writes."
        : "Needs `ZG_MAINNET_STORAGE_URL` and `ZG_MAINNET_PRIVATE_KEY` before mainnet proof writes are ready.",
    },
    {
      label: "Mainnet ProofRegistry anchoring",
      status: hasMainnetRegistry ? "configured" : "pending",
      detail: hasMainnetRegistry
        ? "Mainnet registry address is present."
        : "Deploy or confirm the mainnet ProofRegistry contract, then set `ZG_MAINNET_PROOF_REGISTRY_ADDRESS`.",
    },
    {
      label: "0G Compute alignment",
      status: hasMainnetCompute ? (usingMainnet ? "configured" : "partial") : "pending",
      detail: hasMainnetCompute
        ? usingMainnet
          ? "Server-side compute and contract helpers are ready to follow `ZG_NETWORK_KEY=mainnet`."
          : "Mainnet compute credentials are present, and server-side helpers are already network-aware for a later cutover."
        : "Set `ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS` and `ZG_MAINNET_LEDGER_PRIVATE_KEY` (or shared fallbacks) before mainnet sealed inference is considered ready.",
    },
    {
      label: "Agent NFT contract path",
      status: hasInft && hasAttestationOracle ? "configured" : hasInft ? "partial" : "pending",
      detail: hasInft
        ? hasAttestationOracle
          ? "Agent routes can mint into the live INFT contract and register attestation hashes through the on-chain oracle path."
          : "Agent routes can use a deployed INFT address, but on-chain attestation verification still needs the oracle address in production envs."
        : "Set `YIELD_STRATEGY_INFT_MAINNET_ADDRESS` (or fall back to `YIELD_STRATEGY_INFT_ADDRESS`) in the mainnet deployment environment.",
    },
    {
      label: "Proof history for public review",
      status: latestProof ? "live" : "pending",
      detail: latestProof
        ? `Latest public proof is available from ${formatTime(latestProof.timestamp)} and can be reviewed without wallet connection on /judge.`
        : "No runtime proof is recorded yet, so the judge surface can only show readiness and empty-state guidance.",
    },
  ] satisfies JudgeChecklistItem[];
}

function resolveProofIntegrityAudit(proof: StoredProofRecord | null) {
  if (!proof) {
    return null;
  }

  return (
    proof.integrityAudit ??
    auditOptimizationDecision({
      decision: proof.decision,
      portfolioSnapshot: proof.portfolioSnapshot,
      comparisonProof: proof,
    })
  );
}

export async function getJudgePageData(): Promise<JudgePageData> {
  const runtimeStatus = getDocsRuntimeStatus();
  const preferredNetwork = getServerDefaultNetworkKey();
  const cookieStore = await cookies();
  const reviewWallet =
    resolveWalletAddress(cookieStore.get(WALLET_COOKIE_KEY)?.value) ??
    DEFAULT_WALLET_ADDRESS;
  const reviewNetworkCookie = cookieStore.get(JUDGE_NETWORK_COOKIE_KEY)?.value;
  const defaultReviewNetwork: WalletNetworkKey = getServer0GNetworkConfig("mainnet").enabled
    ? "mainnet"
    : preferredNetwork;
  const reviewNetwork = reviewNetworkCookie
    ? resolveWalletNetworkKey(reviewNetworkCookie)
    : defaultReviewNetwork;
  const reviewNetworkConfig = getServer0GNetworkConfig(reviewNetwork);
  const proofCountFloor = getKnownProofCountFloorForWallet(reviewWallet, reviewNetwork);
  const [
    rawLatestProof,
    proofCount,
    scopedMemory,
    fallbackMemory,
    blacklistEntries,
    scopedStressReport,
    fallbackStressReport,
    scopedZkReasoningProof,
    fallbackZkReasoningProof,
    scopedZkComplianceProof,
    fallbackZkComplianceProof,
    scopedGovernanceDecision,
    fallbackGovernanceDecision,
    scopedCrossAgentHandshake,
    fallbackCrossAgentHandshake,
    latestProofAcrossNetworks,
    deploymentArtifacts,
  ] = await Promise.all([
    withTimeout(
      resolveLatestProofForWallet(reviewWallet, reviewNetwork),
      3_000,
      null,
      "latest proof resolution",
    ),
    withTimeout(
      resolveProofCountForWallet(reviewWallet, reviewNetwork),
      3_000,
      proofCountFloor,
      "proof count resolution",
    ),
    getLatestAgentMemory(reviewWallet, reviewNetwork),
    getLatestAgentMemory(reviewWallet),
    getBlacklistEntries(),
    getLatestStressTestReport(reviewWallet, reviewNetwork),
    getLatestStressTestReport(reviewWallet),
    getLatestZkReasoningProof({
      walletAddress: reviewWallet,
      networkKey: reviewNetwork,
    }),
    getLatestZkReasoningProof({ networkKey: reviewNetwork }),
    getLatestZkComplianceProof({
      walletAddress: reviewWallet,
      networkKey: reviewNetwork,
    }),
    getLatestZkComplianceProof({ networkKey: reviewNetwork }),
    getLatestGovernanceDecision({
      walletAddress: reviewWallet,
      networkKey: reviewNetwork,
    }),
    getLatestGovernanceDecision({ networkKey: reviewNetwork }),
    getLatestCrossAgentHandshake({
      walletAddress: reviewWallet,
      networkKey: reviewNetwork,
    }),
    getLatestCrossAgentHandshake({ networkKey: reviewNetwork }),
    withTimeout(
      resolveLatestProofForWalletAcrossNetworks(reviewWallet),
      1_000,
      null,
      "cross-network proof resolution",
    ),
    withTimeout(
      buildDeploymentArtifacts({
        reviewWallet,
        reviewNetwork,
      }),
      2_500,
      [],
      "deployment artifacts resolution",
    ),
  ]);
  const latestIntegrityAudit = resolveProofIntegrityAudit(rawLatestProof);
  const latestProof =
    rawLatestProof && latestIntegrityAudit
      ? { ...rawLatestProof, integrityAudit: latestIntegrityAudit }
      : rawLatestProof;
  const sovereignMemory = scopedMemory ?? fallbackMemory;
  const scopedBlacklistEntries = blacklistEntries.filter(
    (entry) => !entry.networkKey || entry.networkKey === reviewNetwork,
  );
  const activeBlacklistEntries = scopedBlacklistEntries.length
    ? scopedBlacklistEntries
    : blacklistEntries;
  const latestBlacklistEntry = activeBlacklistEntries[0] ?? null;
  const latestStressReport = scopedStressReport ?? fallbackStressReport;
  const latestZkReasoningProof = scopedZkReasoningProof ?? fallbackZkReasoningProof ?? null;
  const latestZkComplianceProof = scopedZkComplianceProof ?? fallbackZkComplianceProof ?? null;
  const latestGovernanceDecision = scopedGovernanceDecision ?? fallbackGovernanceDecision ?? null;
  const latestCrossAgentHandshake = scopedCrossAgentHandshake ?? fallbackCrossAgentHandshake ?? null;
  const effectiveProofCount = Math.max(proofCount, latestProof ? 1 : 0);
  const proofNetwork = latestProof?.networkKey ?? reviewNetwork;
  const judgePortfolio = await withTimeout(
    getLivePortfolioSnapshot(
      reviewWallet,
      proofNetwork,
      { preferProofSnapshot: true, latestProof },
    ),
    3_500,
    buildJudgePortfolioFallback(reviewWallet, latestProof),
    "judge portfolio snapshot",
  );
  const preferredConfig = getServer0GNetworkConfig(preferredNetwork);
  const computeProviderAddress = getComputeProviderAddress(reviewNetwork);
  const computeLedgerPrivateKey = getComputeLedgerPrivateKey(reviewNetwork);
  const computeConfigured = hasComputeCredentials(reviewNetwork);
  const networks = getAvailableWalletNetworks();
  const mainnetConfig = networks.find((network) => network.key === "mainnet") ?? preferredConfig;
  const latestExplorer = trimUrl(latestProof?.explorerUrl);
  const latestRegistryExplorer = trimUrl(latestProof?.proofRegistryExplorerUrl);
  const teeResponseSignatureVerified =
    latestProof?.teeVerified === true &&
    latestProof.teeVerificationMethod === "broker-response-signature";
  const sentinelVerified = latestProof?.sentinelProof?.status === "verified";
  const envChecklist = buildEnvChecklist();
  const mainnetChecklist = buildMainnetChecklist({
    runtimeStatus,
    latestProof: latestProofAcrossNetworks,
  });
  const efficiencyCards: JudgeStatusCard[] = [
    {
      label: "Semantic Cache",
      value: "Active",
      helper: "Scoped by wallet, network, normalized prompt, and portfolio digest before new inference runs.",
      tone: "green",
    },
    {
      label: "Embedding Reuse",
      value: hasAlibabaEmbeddingConfig() ? "Active" : "Pending",
      helper: hasAlibabaEmbeddingConfig()
        ? "Alibaba text-embedding-v4 can reuse similar optimization requests for the same wallet and asset signature."
        : "Enable Alibaba embedding envs to turn similarity-based reuse on.",
      tone: hasAlibabaEmbeddingConfig() ? "teal" : "amber",
    },
    {
      label: "Prompt Compression",
      value: "Enabled",
      helper: "The optimizer rewrites noisy prompts into a compact intent-and-constraint format before compute.",
      tone: "teal",
    },
  ];
  const integrityStackCards: JudgeStatusCard[] = [
    {
      label: "Hallucination Blacklist",
      value: `${activeBlacklistEntries.length} entr${activeBlacklistEntries.length === 1 ? "y" : "ies"}`,
      helper: latestBlacklistEntry
        ? `Latest rejection indexed as ${shorten(latestBlacklistEntry.cid, 10)} before future inference.`
        : "No rejected output has been indexed yet.",
      tone: latestBlacklistEntry ? "green" : "amber",
    },
    {
      label: "Integrity Auditor",
      value: latestProof?.integrityAudit?.status === "APPROVED" ? "Approved" : latestProof?.integrityAudit ? "Rejected" : "Pending",
      helper: latestProof?.integrityAudit
        ? `${latestProof.integrityAudit.source ?? "deterministic-logic-guardrail"} score ${latestProof.integrityAudit.score}/100.`
        : "Deterministic guardrail result appears after the next stored proof.",
      tone: latestProof?.integrityAudit?.status === "APPROVED" ? "green" : latestProof?.integrityAudit ? "amber" : "white",
    },
    {
      label: "Secure Compute / TEE",
      value: teeResponseSignatureVerified ? "Verified" : latestProof?.teeVerified ? "Service verified" : "Pending",
      helper: teeResponseSignatureVerified
        ? `${latestProof?.teeModel ?? "0G Compute"} response signature verified with ZG-Res-Key ${shorten(latestProof?.teeChatId, 10)}.`
        : "0G Compute TEE response verification appears after broker signature verification succeeds.",
      tone: teeResponseSignatureVerified ? "green" : latestProof?.teeVerified ? "teal" : "white",
    },
    {
      label: "Sovereign Memory",
      value: sovereignMemory ? `v${sovereignMemory.memoryVersion}` : "Pending",
      helper: sovereignMemory
        ? `Latest memory CID ${shorten(sovereignMemory.cid, 10)} (${sovereignMemory.storageMode}).`
        : "No agent memory snapshot has been synced yet.",
      tone: sovereignMemory ? "green" : "amber",
    },
    {
      label: "0G Storage Proof Layer",
      value: latestProof?.cid ? "Stored" : "Pending",
      helper: latestProof?.cid
        ? `Latest proof CID ${shorten(latestProof.cid, 10)} is stored on ${getServer0GNetworkConfig(proofNetwork).label}.`
        : "No 0G Storage proof CID has been recorded yet.",
      tone: latestProof?.cid ? "green" : "white",
    },
    {
      label: "Zero-Knowledge Proof Layer",
      value: latestZkReasoningProof
        ? formatFeatureStatus(latestZkReasoningProof.status)
        : "Pending",
      helper: latestZkReasoningProof
        ? `${getServer0GNetworkConfig(latestZkReasoningProof.networkKey).label} reasoning envelope CID ${shorten(latestZkReasoningProof.proofCid, 10)} (${latestZkReasoningProof.storageMode}); ${latestZkReasoningProof.proofType}.`
        : "No TEE/ZK reasoning proof envelope has been recorded yet.",
      tone: toneForRecordedFeature(latestZkReasoningProof?.status),
    },
    {
      label: "ProofRegistry Anchor",
      value: latestProof?.proofRegistryProofId ? `Proof #${latestProof.proofRegistryProofId}` : "Pending",
      helper: latestProof?.proofRegistryTxHash
        ? `Latest anchor tx ${shorten(latestProof.proofRegistryTxHash, 10)}.`
        : "ProofRegistry anchor appears after the proof is recorded on-chain.",
      tone: latestProof?.proofRegistryTxHash ? "green" : "white",
    },
    {
      label: "Programmable Governance",
      value: latestGovernanceDecision
        ? formatFeatureStatus(latestGovernanceDecision.status)
        : "Pending",
      helper: latestGovernanceDecision
        ? `${getServer0GNetworkConfig(latestGovernanceDecision.networkKey).label} ${formatRiskLabel(latestGovernanceDecision.riskScore).toLowerCase()}. ${latestZkComplianceProof ? `ZK policy seal ${latestZkComplianceProof.policyCompliantPct}% matched.` : latestGovernanceDecision.reason}`
        : "No programmable governance decision has been evaluated yet.",
      tone: toneForRecordedFeature(latestGovernanceDecision?.status),
    },
    {
      label: "Cross-Agent Neural Handshake",
      value: latestCrossAgentHandshake
        ? formatFeatureStatus(latestCrossAgentHandshake.status)
        : "Pending",
      helper: latestCrossAgentHandshake
        ? `${getServer0GNetworkConfig(latestCrossAgentHandshake.networkKey).label} handshake CID ${shorten(latestCrossAgentHandshake.artifactCid, 10)} between ${latestCrossAgentHandshake.requestingAgent} and ${latestCrossAgentHandshake.respondingAgent}.`
        : "No cross-agent transcript/proof envelope has been recorded yet.",
      tone: toneForRecordedFeature(latestCrossAgentHandshake?.status),
    },
  ];

  const statusCards: JudgeStatusCard[] = [
    {
      label: "Proof Store",
      value: runtimeStatus.runtimeStore,
      helper: latestProof
        ? `${effectiveProofCount} recorded proof(s) available for this judge wallet`
        : "No runtime proof recorded yet",
      tone: latestProof ? "green" : "amber",
    },
    {
      label: "Compute Mode",
      value: runtimeStatus.computeMode,
      helper: runtimeStatus.llmMode,
      tone: computeConfigured ? "teal" : "white",
    },
    {
      label: "Default Server Network",
      value: preferredConfig.label,
      helper:
        preferredNetwork === "mainnet"
          ? "Production server runtime is currently pointed at mainnet."
          : `Controlled by \`ZG_NETWORK_KEY=${preferredNetwork}\` until you cut over production.`,
      tone: preferredNetwork === "mainnet" ? "green" : "teal",
    },
    {
      label: "Review Wallet",
      value: reviewWallet,
      helper: "Judge mode is hard-locked to the public demo wallet for consistent review.",
      tone: "teal",
    },
    {
      label: "Review Network",
      value: reviewNetworkConfig.label,
      helper:
        reviewNetwork === "mainnet"
          ? "Judge snapshot is currently scoped to mainnet."
          : "Judge snapshot is currently scoped to testnet.",
      tone: reviewNetwork === "mainnet" ? "green" : "teal",
    },
  ];

  const latestProofCards: JudgeStatusCard[] = latestProof
    ? [
        {
          label: "Recommended Route",
          value: latestProof.decision.recommended,
          helper: `Confidence ${latestProof.decision.confidence ?? 0}%`,
          tone: "teal",
        },
        {
          label: "APY Lift",
          value: `${formatPercent(latestProof.decision.current_apy)} -> ${formatPercent(latestProof.decision.optimized_apy)}`,
          helper: `Projected annual gain ${formatCurrency(latestProof.decision.estimatedAnnualGain ?? latestProof.decision.yield_increase)}`,
          tone: "green",
        },
        {
          label: "Snapshot Value",
          value:
            formatPortfolioSnapshotValue(
              judgePortfolio.displayTotal,
              judgePortfolio.displayUnit,
            ) ?? formatSnapshotValue(latestProof),
          helper:
            judgePortfolio.displayLabel ??
            latestProof.portfolioSnapshot?.displayLabel ??
            "Wallet snapshot pinned from the latest recorded proof.",
          tone: "white",
        },
        {
          label: "Proof History",
          value: `${effectiveProofCount} run${effectiveProofCount === 1 ? "" : "s"}`,
          helper: `Latest proof recorded ${formatTime(latestProof.timestamp)}`,
          tone: effectiveProofCount > 0 ? "green" : "amber",
        },
      ]
    : [
        {
          label: "Latest Proof",
          value: "No proof yet",
          helper: "Judge mode is live, but the runtime store does not have a proof for the demo wallet yet.",
          tone: "amber",
        },
        {
          label: "Review Path",
          value: "Judge snapshot",
          helper: "Use the judge route to review the latest recorded proof-backed result without extension setup or rerunning optimize.",
          tone: "teal",
        },
        {
          label: "Storage Status",
          value: runtimeStatus.proofMode,
          helper: "This status is derived from the active environment, not from mocked data.",
          tone: "white",
        },
        {
          label: "Contract Status",
          value: preferredConfig.proofRegistryAddress ? "Configured" : "Placeholder required",
          helper: preferredConfig.proofRegistryAddress
            ? shorten(preferredConfig.proofRegistryAddress, 8)
            : "Set the ProofRegistry env for fully on-chain verification.",
          tone: preferredConfig.proofRegistryAddress ? "green" : "amber",
        },
      ];

  const components: JudgeComponentStatus[] = [
    {
      title: "0G Storage",
      status: latestProof ? "live" : toHealthStatus(runtimeStatus.networks[proofNetwork].storageConfigured),
      detail: latestProof
        ? `Latest proof CID ${shorten(latestProof.cid, 12)} is already stored and visible in the runtime ledger.`
        : runtimeStatus.networks[proofNetwork].storageConfigured
          ? "Storage write path is configured, but no proof has been recorded in the current runtime yet."
          : "Storage route exists, but proof upload envs are still incomplete for the active network.",
      href: latestExplorer,
      meta: latestProof?.txHash ? `TX ${shorten(latestProof.txHash, 12)}` : getServer0GNetworkConfig(proofNetwork).storageUrl,
    },
    {
      title: "0G Compute Network",
      status: teeResponseSignatureVerified ? "live" : computeConfigured ? "configured" : "partial",
      detail: computeConfigured
        ? teeResponseSignatureVerified
          ? `Latest run used ${latestProof?.teeModel ?? "0G Compute"} and verified the broker response signature with the ZG-Res-Key header.`
          : reviewNetwork === "mainnet"
            ? "Mainnet compute is configured for GPT-5.4 Mini. The app uses max_completion_tokens and verifies response signatures with ZG-Res-Key when a fresh proof is recorded."
            : `TEE-ready provider credentials are present for ${reviewNetworkConfig.label}. If the provider is unavailable at runtime, the app still falls back honestly.`
        : `The app will keep working with deterministic narrative fallback until compute provider envs are completed for ${reviewNetworkConfig.label}.`,
      meta: computeProviderAddress
        ? latestProof?.teeChatId && teeResponseSignatureVerified
          ? `ZG-Res-Key ${shorten(latestProof.teeChatId, 8)}`
          : `${shorten(computeProviderAddress, 8)}${reviewNetwork === "mainnet" ? " / GPT-5.4 Mini" : ""}`
        : computeLedgerPrivateKey
          ? "Signer present, provider address missing"
          : "Provider address not set",
    },
    {
      title: "ZK Agent Identity",
      status: sentinelVerified ? "live" : latestProof?.sentinelProof ? "partial" : "configured",
      detail: sentinelVerified
        ? `Latest run verified agent_identity before optimization; session nullifier ${shorten(latestProof?.sentinelProof?.publicSignals.sessionNullifier, 10)}.`
        : latestProof?.sentinelProof
          ? `ZK agent_identity proof was recorded with status ${latestProof.sentinelProof.status}; run local Noir proving for a fully verified proof.`
          : "ZK agent_identity circuit is wired into storage, and the next optimize run will attach its proof metadata.",
      meta: latestProof?.sentinelProof
        ? `Circuit ${latestProof.sentinelProof.circuit}`
        : "military-grade-zk/circuits/agent_identity",
    },
    {
      title: "ProofRegistry",
      status: latestProof?.proofRegistryAddress
        ? "live"
        : reviewNetworkConfig.proofRegistryAddress
          ? "configured"
          : "pending",
      detail: latestProof?.proofRegistryProofId
        ? `Latest proof is anchored on-chain as Proof #${latestProof.proofRegistryProofId}.`
        : reviewNetworkConfig.proofRegistryAddress
          ? "Registry contract is configured, but the latest proof has not produced a live proof id in this runtime snapshot."
          : "No registry contract is configured for the active server network yet.",
      href: latestRegistryExplorer,
      address: latestProof?.proofRegistryAddress ?? reviewNetworkConfig.proofRegistryAddress,
      meta: latestProof?.proofRegistryTxHash
        ? `Registry tx ${shorten(latestProof.proofRegistryTxHash, 10)}`
        : "Contract verification placeholder is shown until deployment is confirmed",
    },
    {
      title: "Sovereign Memory",
      status: sovereignMemory ? "live" : "pending",
      detail: sovereignMemory
        ? `Agent memory v${sovereignMemory.memoryVersion} is persisted with CID ${shorten(sovereignMemory.cid, 12)}.`
        : "Memory sync route is available, and the next approved proof will persist an agent snapshot.",
      href: sovereignMemory?.explorerUrl,
      meta: sovereignMemory
        ? `${sovereignMemory.storageMode} memory snapshot`
        : "Awaiting first memory snapshot",
    },
    {
      title: "Hallucination Blacklist",
      status: latestBlacklistEntry ? "live" : "configured",
      detail: latestBlacklistEntry
        ? `Auditor rejection indexed as CID ${shorten(latestBlacklistEntry.cid, 12)} and checked before new inference.`
        : "Rejected auditor outputs are indexed automatically and checked before 0G Compute is called.",
      href: latestBlacklistEntry?.explorerUrl,
      meta: latestBlacklistEntry
        ? `Score ${latestBlacklistEntry.auditScore}`
        : "Pre-inference defense ready",
    },
    {
      title: "Multiverse Stress Test",
      status: latestStressReport ? "live" : "configured",
      detail: latestStressReport
        ? `Latest historical replay verdict is ${latestStressReport.verdict} with report CID ${shorten(latestStressReport.reportCid, 12)}.`
        : "Stress-test runner can replay historical OHLCV slices and store Integrity Report Cards.",
      href: latestStressReport?.explorerUrl,
      meta: latestStressReport
        ? `Verified APY ${latestStressReport.verifiedApy.toFixed(2)}%`
        : "Report card runner ready",
    },
    {
      title: "Programmable Governance",
      status: latestZkComplianceProof
        ? latestZkComplianceProof.status === "verified"
          ? "live"
          : "partial"
        : "configured",
      detail: latestZkComplianceProof
        ? `Latest ZK policy seal is ${formatFeatureStatus(latestZkComplianceProof.status)} at ${latestZkComplianceProof.policyCompliantPct}% policy match.`
        : "Programmable governance can persist deterministic optimizer policy and ZK seal artifacts to 0G.",
      href:
        latestZkComplianceProof?.proofRegistryExplorerUrl ??
        latestZkComplianceProof?.explorerUrl,
      meta: latestZkComplianceProof
        ? `Risk ${latestZkComplianceProof.riskScore}/100`
        : "Governance verifier ready",
    },
    {
      title: "Zero-Knowledge Proof Layer",
      status: latestZkReasoningProof
        ? latestZkReasoningProof.status === "failed"
          ? "partial"
          : "live"
        : "configured",
      detail: latestZkReasoningProof
        ? `${formatFeatureStatus(latestZkReasoningProof.status)} envelope stored as CID ${shorten(latestZkReasoningProof.proofCid, 12)}.`
        : "ZKR route can record TEE/ZK reasoning envelopes to 0G without overstating the proof surface.",
      href: latestZkReasoningProof?.proofRegistryExplorerUrl ?? latestZkReasoningProof?.explorerUrl,
      meta: latestZkReasoningProof
        ? latestZkReasoningProof.proofType
        : "Zero-knowledge artifact route available",
    },
    {
      title: "Programmable AI Governance",
      status: latestGovernanceDecision
        ? latestGovernanceDecision.status === "active"
          ? "live"
          : "partial"
        : "configured",
      detail: latestGovernanceDecision
        ? `Latest governance decision is ${formatFeatureStatus(latestGovernanceDecision.status)} with ${formatRiskLabel(latestGovernanceDecision.riskScore).toLowerCase()}.`
        : "Governance route evaluates strategy decisions and records deterministic kill-switch decisions before downstream flows rely on them.",
      href: latestGovernanceDecision?.explorerUrl,
      meta: latestGovernanceDecision
        ? latestGovernanceDecision.killSwitchTriggered
          ? "Kill switch triggered"
          : "Guardrail active"
        : "Policy evaluator ready",
    },
    {
      title: "Cross-Agent Neural Handshake",
      status: latestCrossAgentHandshake
        ? latestCrossAgentHandshake.status === "completed"
          ? "live"
          : "partial"
        : "configured",
      detail: latestCrossAgentHandshake
        ? `Latest handshake is ${formatFeatureStatus(latestCrossAgentHandshake.status)} with transcript digest ${shorten(latestCrossAgentHandshake.transcriptDigest, 12)}.`
        : "Handshake route can persist requester/responder scope, transcript digest, and proof envelope to 0G testnet.",
      href: latestCrossAgentHandshake?.explorerUrl,
      meta: latestCrossAgentHandshake
        ? latestCrossAgentHandshake.handshakeType
        : "Agent coordination route ready",
    },
    {
      title: "Yield Strategy INFT",
      status: getYieldStrategyInftAddress(reviewNetwork) ? "configured" : "partial",
      detail: getYieldStrategyInftAddress(reviewNetwork)
        ? `Agent routes can read a deployed contract address for ${reviewNetworkConfig.label}.`
        : `The \`/agents\` page stays demo-safe by falling back to proof-backed strategies when ${reviewNetworkConfig.label} contract envs are missing.`,
      address: getYieldStrategyInftAddress(reviewNetwork),
      meta: getYieldStrategyInftAddress(reviewNetwork)
        ? `${reviewNetworkConfig.label} contract mode available`
        : `${reviewNetworkConfig.label} proof-backed fallback active`,
    },
    {
      title: "Explorer Links",
      status: latestProof ? "live" : "configured",
      detail: latestProof
        ? "Judge mode exposes the latest tx, proof registry tx, and public wallet path directly."
        : "Explorer bases are configured per network, but judge mode will only link out after a real proof tx exists.",
      href: latestExplorer,
      meta: latestProof
        ? `${getServer0GNetworkConfig(proofNetwork).label}: latest tx ready`
        : `${getServer0GNetworkConfig(proofNetwork).label} explorer base configured`,
    },
    {
      title: "Mainnet Path",
      status:
        runtimeStatus.networks.mainnet.enabled && preferredNetwork === "mainnet"
          ? "live"
          : runtimeStatus.networks.mainnet.enabled
            ? "partial"
            : "pending",
      detail: runtimeStatus.networks.mainnet.enabled
        ? preferredNetwork === "mainnet"
          ? "Mainnet is now the active default path for server-side proof and review flows."
          : "Wallet switching and server helpers are mainnet-aware, but final cutover still depends on making mainnet the production default."
        : "Mainnet is intentionally not presented as ready until its public chain metadata is configured.",
      href: mainnetConfig.explorerBase,
      meta: `${mainnetConfig.label} explorer`,
    },
  ];

  const blockers: string[] = [];
  if (!latestProof) {
    blockers.push(
      "No latest runtime proof is available yet for the demo wallet, so judge mode can only show readiness and empty-state guidance.",
    );
  }
  if (!hasValue(readEnv("ZG_MAINNET_STORAGE_URL")) || !hasValue(readEnv("ZG_MAINNET_PRIVATE_KEY"))) {
    blockers.push("Mainnet proof upload is not submission-ready until `ZG_MAINNET_STORAGE_URL` and `ZG_MAINNET_PRIVATE_KEY` are set.");
  }
  if (!hasValue(readEnv("ZG_MAINNET_PROOF_REGISTRY_ADDRESS"))) {
    blockers.push("Mainnet ProofRegistry address is still missing, so on-chain verification is not fully cut over.");
  }
  if (!hasComputeCredentials("mainnet")) {
    blockers.push("Mainnet 0G Compute credentials are still incomplete, so sealed inference is not fully prepared for production cutover.");
  }
  if (!getYieldStrategyInftAddress(preferredNetwork)) {
    blockers.push("Agent NFT contract env is not set, so `/agents` relies on proof-backed fallback instead of live contract reads.");
  }
  if (!hasValue(readEnv("KV_REST_API_URL")) || !hasValue(readEnv("KV_REST_API_TOKEN"))) {
    blockers.push("Runtime persistence is currently not backed by Vercel KV, so proof history depends on local file fallback in this environment.");
  }

  return {
    reviewNetwork,
    reviewNetworkLabel: reviewNetworkConfig.label,
    runtimeLabel: runtimeStatus.currentStatusLine,
    statusCards,
    latestProof,
    sovereignMemory,
    latestBlacklistEntry,
    latestStressReport,
    latestZkComplianceProof,
    latestZkReasoningProof,
    latestGovernanceDecision,
    latestCrossAgentHandshake,
    latestProofCards,
    integrityStackCards,
    efficiencyCards,
    deploymentArtifacts,
    components,
    mainnetChecklist,
    envChecklist,
    demoFlow: [
      "Open `/judge` as the submission entry point.",
      "If there is no active wallet in the browser, judge mode pins the public review wallet automatically.",
      "Open `/`, `/history`, or `/agents` while judge mode is active to inspect the same wallet snapshot and proof history.",
      "Use `Exit judge mode` in the sidebar to return to the normal user wallet flow and run a fresh optimization.",
    ],
    blockers,
    proofCount: effectiveProofCount,
  };
}
