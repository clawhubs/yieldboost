import "server-only";

import {
  DEFAULT_WALLET_ADDRESS,
  getAvailableWalletNetworks,
  getServer0GNetworkConfig,
  getServerDefaultNetworkKey,
} from "@/lib/wallet";
import { getDocsRuntimeStatus } from "@/lib/docs/content";
import type { StoredProofRecord } from "@/lib/backend-data";
import { getStoredProofs } from "@/lib/server/runtime-store";

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
  runtimeLabel: string;
  statusCards: JudgeStatusCard[];
  latestProof: StoredProofRecord | null;
  latestProofCards: JudgeStatusCard[];
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

function toHealthStatus(value: boolean): HealthStatus {
  return value ? "configured" : "pending";
}

function readEnv(name: string) {
  return process.env[name];
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
      detail: "Required for `/api/0g/store` on the default testnet submission path.",
    },
    {
      name: "ZG_PRIVATE_KEY",
      requiredFor: "Testnet proof upload signer",
      status: hasValue(readEnv("ZG_PRIVATE_KEY")) ? "set" : "missing",
      detail: "Used by the 0G Storage write path for proof commits.",
    },
    {
      name: "ZG_PROOF_REGISTRY_ADDRESS",
      requiredFor: "Optional testnet on-chain proof anchoring",
      status: hasValue(readEnv("ZG_PROOF_REGISTRY_ADDRESS")) ? "set" : "optional",
      detail: "Without it, proofs still land in 0G Storage but Registry writes stay unavailable.",
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
      detail: "Without KV, the app falls back to the local `.artifacts/runtime-store.json` file.",
    },
    {
      name: "KV_REST_API_TOKEN",
      requiredFor: "Persistent runtime proof store",
      status: hasValue(readEnv("KV_REST_API_TOKEN")) ? "set" : "optional",
      detail: "Pair with `KV_REST_API_URL` for cross-deployment persistence on Vercel.",
    },
    {
      name: "ZG_COMPUTE_PROVIDER_ADDRESS",
      requiredFor: "0G Compute / TEE mode",
      status: hasValue(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS")) ? "set" : "optional",
      detail: "If missing, optimization explanations fall back to the deterministic local narrative.",
    },
    {
      name: "ZG_LEDGER_PRIVATE_KEY",
      requiredFor: "0G Compute / agent contract signer",
      status: hasValue(readEnv("ZG_LEDGER_PRIVATE_KEY")) ? "set" : "optional",
      detail: "Also used by the agent NFT contract routes when available.",
    },
    {
      name: "YIELD_STRATEGY_INFT_ADDRESS",
      requiredFor: "Agent NFT contract mode",
      status: hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS")) ? "set" : "optional",
      detail: "Without it, `/agents` falls back to proof-backed history instead of contract reads.",
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
  const hasInft = hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS"));

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
      status: usingMainnet ? "configured" : "partial",
      detail: usingMainnet
        ? "Server-side compute and contract helpers follow `ZG_NETWORK_KEY=mainnet`."
        : "Server-side helpers are now network-aware, but the current environment is still pointed at testnet.",
    },
    {
      label: "Agent NFT contract path",
      status: hasInft ? "partial" : "pending",
      detail: hasInft
        ? "Agent routes can use a deployed INFT address, but production cutover still needs the final mainnet contract value in Vercel."
        : "Set `YIELD_STRATEGY_INFT_ADDRESS` in the mainnet deployment environment.",
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

export async function getJudgePageData(): Promise<JudgePageData> {
  const runtimeStatus = getDocsRuntimeStatus();
  const proofs = await getStoredProofs();
  const latestProof = proofs[0] ?? null;
  const preferredNetwork = getServerDefaultNetworkKey();
  const preferredConfig = getServer0GNetworkConfig(preferredNetwork);
  const networks = getAvailableWalletNetworks();
  const testnetConfig = networks.find((network) => network.key === "testnet") ?? preferredConfig;
  const mainnetConfig = networks.find((network) => network.key === "mainnet") ?? preferredConfig;
  const latestExplorer = trimUrl(latestProof?.explorerUrl);
  const latestRegistryExplorer = trimUrl(latestProof?.proofRegistryExplorerUrl);
  const envChecklist = buildEnvChecklist();
  const mainnetChecklist = buildMainnetChecklist({ runtimeStatus, latestProof });

  const statusCards: JudgeStatusCard[] = [
    {
      label: "Proof Store",
      value: runtimeStatus.runtimeStore,
      helper: latestProof
        ? `${proofs.length} recorded proof(s) available for review`
        : "No runtime proof recorded yet",
      tone: latestProof ? "green" : "amber",
    },
    {
      label: "Compute Mode",
      value: runtimeStatus.computeMode,
      helper: runtimeStatus.llmMode,
      tone: hasValue(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS")) ? "teal" : "white",
    },
    {
      label: "Default Server Network",
      value: preferredConfig.label,
      helper: `Controlled by \`ZG_NETWORK_KEY=${preferredNetwork}\` when you prepare mainnet cutover`,
      tone: preferredNetwork === "mainnet" ? "green" : "teal",
    },
    {
      label: "Review Wallet",
      value: DEFAULT_WALLET_ADDRESS,
      helper: "Can be loaded instantly via watch mode without wallet connection",
      tone: "white",
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
          label: "Latest Proof",
          value: shorten(latestProof.cid, 12),
          helper: formatTime(latestProof.timestamp),
          tone: "white",
        },
        {
          label: "Registry",
          value: latestProof.proofRegistryProofId ? `#${latestProof.proofRegistryProofId}` : "Storage only",
          helper: latestProof.proofRegistryAddress
            ? `Contract ${shorten(latestProof.proofRegistryAddress, 8)}`
            : "Awaiting registry configuration",
          tone: latestProof.proofRegistryAddress ? "green" : "amber",
        },
      ]
    : [
        {
          label: "Latest Proof",
          value: "No proof yet",
          helper: "Judge mode is live, but the runtime store does not have a proof to show yet.",
          tone: "amber",
        },
        {
          label: "Review Path",
          value: "Use watch mode",
          helper: "Open the demo wallet to show the product without extension setup.",
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
      status: latestProof ? "live" : toHealthStatus(runtimeStatus.networks.testnet.storageConfigured),
      detail: latestProof
        ? `Latest proof CID ${shorten(latestProof.cid, 12)} is already stored and visible in the runtime ledger.`
        : runtimeStatus.networks.testnet.storageConfigured
          ? "Storage write path is configured, but no proof has been recorded in the current runtime yet."
          : "Storage route exists, but testnet proof upload envs are still incomplete.",
      href: latestExplorer,
      meta: latestProof?.txHash ? `TX ${shorten(latestProof.txHash, 12)}` : testnetConfig.storageUrl,
    },
    {
      title: "0G Compute Network",
      status: hasValue(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS")) && hasValue(readEnv("ZG_LEDGER_PRIVATE_KEY")) ? "configured" : "partial",
      detail: hasValue(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS")) && hasValue(readEnv("ZG_LEDGER_PRIVATE_KEY"))
        ? "TEE-ready provider credentials are present. If the provider is unavailable at runtime, the app still falls back honestly."
        : "The app will keep working with deterministic narrative fallback until compute provider envs are completed.",
      meta: hasValue(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS"))
        ? shorten(readEnv("ZG_COMPUTE_PROVIDER_ADDRESS"), 8)
        : "Provider address not set",
    },
    {
      title: "ProofRegistry",
      status: latestProof?.proofRegistryAddress
        ? "live"
        : preferredConfig.proofRegistryAddress
          ? "configured"
          : "pending",
      detail: latestProof?.proofRegistryProofId
        ? `Latest proof is anchored on-chain as Proof #${latestProof.proofRegistryProofId}.`
        : preferredConfig.proofRegistryAddress
          ? "Registry contract is configured, but the latest proof has not produced a live proof id in this runtime snapshot."
          : "No registry contract is configured for the active server network yet.",
      href: latestRegistryExplorer,
      address: latestProof?.proofRegistryAddress ?? preferredConfig.proofRegistryAddress,
      meta: latestProof?.proofRegistryTxHash
        ? `Registry tx ${shorten(latestProof.proofRegistryTxHash, 10)}`
        : "Contract verification placeholder is shown until deployment is confirmed",
    },
    {
      title: "Yield Strategy INFT",
      status: hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS")) ? "configured" : "partial",
      detail: hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS"))
        ? "Agent routes can read a deployed contract address when the environment is set."
        : "The `/agents` page stays demo-safe by falling back to proof-backed strategies when contract envs are missing.",
      address: readEnv("YIELD_STRATEGY_INFT_ADDRESS"),
      meta: hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS"))
        ? "Contract mode available"
        : "Proof-backed fallback active",
    },
    {
      title: "Explorer Links",
      status: latestProof ? "live" : "configured",
      detail: latestProof
        ? "Judge mode exposes the latest tx, proof registry tx, and public wallet path directly."
        : "Explorer bases are configured per network, but judge mode will only link out after a real proof tx exists.",
      href: latestExplorer,
      meta: latestProof
        ? `${testnetConfig.label}: latest tx ready`
        : `${testnetConfig.label} explorer base configured`,
    },
    {
      title: "Mainnet Path",
      status: runtimeStatus.networks.mainnet.enabled ? "partial" : "pending",
      detail: runtimeStatus.networks.mainnet.enabled
        ? "Wallet switching and server helpers are mainnet-aware, but final cutover still depends on storage, signer, and registry envs."
        : "Mainnet is intentionally not presented as ready until its public chain metadata is configured.",
      href: mainnetConfig.explorerBase,
      meta: `${mainnetConfig.label} explorer`,
    },
  ];

  const blockers: string[] = [];
  if (!latestProof) {
    blockers.push("No latest runtime proof is available yet, so judge mode can only show readiness and empty-state guidance.");
  }
  if (!hasValue(readEnv("ZG_MAINNET_STORAGE_URL")) || !hasValue(readEnv("ZG_MAINNET_PRIVATE_KEY"))) {
    blockers.push("Mainnet proof upload is not submission-ready until `ZG_MAINNET_STORAGE_URL` and `ZG_MAINNET_PRIVATE_KEY` are set.");
  }
  if (!hasValue(readEnv("ZG_MAINNET_PROOF_REGISTRY_ADDRESS"))) {
    blockers.push("Mainnet ProofRegistry address is still missing, so on-chain verification is not fully cut over.");
  }
  if (!hasValue(readEnv("YIELD_STRATEGY_INFT_ADDRESS"))) {
    blockers.push("Agent NFT contract env is not set, so `/agents` relies on proof-backed fallback instead of live contract reads.");
  }
  if (!hasValue(readEnv("KV_REST_API_URL")) || !hasValue(readEnv("KV_REST_API_TOKEN"))) {
    blockers.push("Runtime persistence is currently not backed by Vercel KV, so proof history depends on local file fallback in this environment.");
  }

  return {
    runtimeLabel: runtimeStatus.currentStatusLine,
    statusCards,
    latestProof,
    latestProofCards,
    components,
    mainnetChecklist,
    envChecklist,
    demoFlow: [
      "Open `/judge` for the no-wallet review path.",
      "Use the `Use demo watch wallet` action in the sidebar to load the public review wallet instantly.",
      "Visit `/` for the 1-click dashboard flow, `/agent` for the streamed execution panel, `/history` for the proof ledger, and `/agents` for proof-backed strategies.",
      "If a browser wallet is available, connect it from the sidebar to switch from review mode into normal user flow.",
    ],
    blockers,
    proofCount: proofs.length,
  };
}
