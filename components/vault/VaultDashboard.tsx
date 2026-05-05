"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Download,
  EyeOff,
  FileArchive,
  Fingerprint,
  Globe,
  Lock,
  Server,
  Shield,
  Terminal,
  Trash2,
  Upload,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain, parseEther, type Address } from "viem";

const zeroGTestnetChainId = Number(
  process.env.NEXT_PUBLIC_0G_TESTNET_CHAIN_ID ?? "16602",
);
const zeroGTestnetRpc =
  process.env.NEXT_PUBLIC_0G_TESTNET_RPC ??
  process.env.NEXT_PUBLIC_ZG_RPC ??
  "https://evmrpc-testnet.0g.ai";
const zeroGTestnetExplorer =
  process.env.NEXT_PUBLIC_0G_TESTNET_EXPLORER_BASE_URL ??
  process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
  "https://chainscan-galileo.0g.ai";

const zeroGTestnet = defineChain({
  id: zeroGTestnetChainId,
  name: process.env.NEXT_PUBLIC_0G_TESTNET_CHAIN_NAME ?? "0G Galileo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "0G",
    symbol: "0G",
  },
  rpcUrls: {
    default: {
      http: [zeroGTestnetRpc],
    },
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan",
      url: zeroGTestnetExplorer,
    },
  },
});

const wagmiConfig = createConfig({
  chains: [zeroGTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [zeroGTestnet.id]: http(zeroGTestnetRpc),
  },
});

const queryClient = new QueryClient();

const layers = [
  {
    id: 1,
    key: "L1",
    name: "Hallucination Blacklist",
    icon: EyeOff,
    desc: "Noise and prompt-pattern filter.",
  },
  {
    id: 2,
    key: "L2",
    name: "Integrity Auditor",
    icon: Terminal,
    desc: "Deterministic payload and ownership checks.",
  },
  {
    id: 3,
    key: "L3",
    name: "TEE Secure Room",
    icon: Shield,
    desc: "TEE sandbox encryption inside a Firecracker VM.",
  },
  {
    id: 4,
    key: "L4",
    name: "Sovereign Memory",
    icon: Cpu,
    desc: "Verifiable context ledger.",
  },
  {
    id: 5,
    key: "L5",
    name: "0G Storage Blob",
    icon: Database,
    desc: "Encrypted payload storage anchor.",
  },
  {
    id: 6,
    key: "L6",
    name: "ZK Reasoning",
    icon: Zap,
    desc: "Integrity envelope and hash proof.",
  },
  {
    id: 7,
    key: "L7",
    name: "ProofRegistry Anchor",
    icon: Lock,
    desc: "On-chain proof commitment.",
  },
  {
    id: 8,
    key: "L8",
    name: "Governance Throttle",
    icon: Activity,
    desc: "Rate and safety enforcement.",
  },
  {
    id: 9,
    key: "L9",
    name: "Neural Handshake",
    icon: Fingerprint,
    desc: "Final audit and handshake log.",
  },
] as const;

interface ChallengeResponse {
  challenge_id: string;
  message: string;
  issued_at: string;
  expires_at: string;
}

interface SealResponse {
  storage_id: string;
  storage_root_hash?: string | null;
  storage_tx_hash?: string | null;
  storage_explorer_url?: string | null;
  integrity_hash: string;
  anchor_tx_hash?: string | null;
  anchor_explorer_url?: string | null;
  layer_statuses: Record<string, string>;
}

interface VaultItem {
  storage_id: string;
  network: "testnet" | "mainnet";
  wallet_address: string;
  integrity_hash: string;
  payload_sha256: string;
  mime_type: string;
  file_name?: string | null;
  storage_root_hash?: string | null;
  storage_tx_hash?: string | null;
  storage_explorer_url?: string | null;
  anchor_tx_hash?: string | null;
  anchor_explorer_url?: string | null;
  created_at: string;
  last_unsealed_at?: string | null;
  layer_statuses?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface VaultListResponse {
  items: VaultItem[];
  total: number;
}

interface UnsealResponse {
  storage_id: string;
  plaintext?: string | null;
  file_name?: string | null;
  file_content_base64?: string | null;
  mime_type: string;
  layer_statuses: Record<string, string>;
}

interface DeleteResponse {
  storage_id: string;
  deleted: boolean;
  storage_mode?: string | null;
  anchor_mode?: string | null;
  layer_statuses: Record<string, string>;
}

interface AdminStatsResponse {
  total_deflected_attacks: number;
  failed_unseal_attempts: {
    wallet_address: string;
    blocked_unseal_attempts: number;
    last_seen_at?: string | null;
  }[];
  recent_logs: {
    wallet_address: string;
    action_type: "Seal" | "Unseal" | "Delete";
    status: "Success" | "Blocked";
    layer_failed?: string | null;
    payload_metadata: Record<string, unknown>;
    timestamp: string;
  }[];
}

interface PublicChallengeConfig {
  title: string;
  fileName: string;
  storageId: string | null;
  announcement: string;
}

const PUBLIC_INTEGRITY_API_BASE = "https://api.yieldboostai.xyz";
const DEFAULT_CHALLENGE_ANNOUNCEMENT =
  "Founder upload is pending. The public target will appear here after the live recording, and every wallet will be able to attempt an unseal against the same vault.";

function isPublicProductionHost(hostname: string) {
  return hostname === "yieldboostai.xyz" || hostname.endsWith(".yieldboostai.xyz");
}

function isUnsafePublicApiBase(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol !== "https:" ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname) ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
  } catch {
    return true;
  }
}

function getApiBase() {
  const configured = process.env.NEXT_PUBLIC_INTEGRITY_API_BASE_URL?.trim();
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    if (isPublicProductionHost(hostname)) {
      if (configured && !isUnsafePublicApiBase(configured)) {
        return configured.replace(/\/$/, "");
      }
      return PUBLIC_INTEGRITY_API_BASE;
    }
  }
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8010";
}

function getApiHeaders(extra?: HeadersInit) {
  const apiKey = process.env.NEXT_PUBLIC_INTEGRITY_API_KEY?.trim();
  const base: Record<string, string> = {};
  if (apiKey) {
    base["X-API-Key"] = apiKey;
  }
  return {
    ...base,
    ...(extra as Record<string, string> | undefined),
  };
}

function shortAddress(value?: string | null) {
  if (!value) return "Not connected";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function sameAddress(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function toAddress(value: string | undefined, fallback: Address): Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "") ? (value as Address) : fallback;
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      ...getApiHeaders(init?.headers),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with ${response.status}`);
  }
  return data as T;
}

function buildVaultActionTypedData(input: {
  challenge: ChallengeResponse;
  wallet: Address;
  storageId: string;
  operation: "unseal" | "delete";
  primaryType: "VaultUnseal" | "VaultDelete";
}) {
  const message = {
    challengeId: input.challenge.challenge_id,
    challenge: input.challenge.message,
    operation: input.operation,
    network: "testnet",
    wallet: input.wallet,
    storageId: input.storageId,
  };
  const sharedFields = [
      { name: "challengeId", type: "string" },
      { name: "challenge", type: "string" },
      { name: "operation", type: "string" },
      { name: "network", type: "string" },
      { name: "wallet", type: "address" },
      { name: "storageId", type: "string" },
  ] as const;
  const types =
    input.primaryType === "VaultDelete"
      ? ({ VaultDelete: sharedFields } as const)
      : ({ VaultUnseal: sharedFields } as const);

  return {
    domain: {
      name: "YieldBoost Integrity API",
      version: "1",
      chainId: zeroGTestnet.id,
    },
    types,
    primaryType: input.primaryType,
    message,
  } as const;
}

function downloadUnsealedFile(data: UnsealResponse) {
  const fileName =
    data.file_name ??
    (data.mime_type.startsWith("text/") ? `${data.storage_id}.txt` : `${data.storage_id}.bin`);
  const bytes =
    data.file_content_base64 ??
    btoa(unescape(encodeURIComponent(data.plaintext ?? "")));
  const raw = Uint8Array.from(atob(bytes), (char) => char.charCodeAt(0));
  const blob = new Blob([raw], { type: data.mime_type || "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export default function VaultDashboard() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <VaultDashboardInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function VaultDashboardInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const [plaintext, setPlaintext] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsResponse | null>(null);
  const [deflectedAttacks, setDeflectedAttacks] = useState(0);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [layerStatuses, setLayerStatuses] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<"seal" | "unseal" | "delete" | null>(null);
  const [statusText, setStatusText] = useState("Vault ready");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [lastSeal, setLastSeal] = useState<SealResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const pipelineTimer = useRef<number | null>(null);

  const founderWallet = process.env.NEXT_PUBLIC_FOUNDER_WALLET_ADDRESS;
  const publicChallenge = useMemo<PublicChallengeConfig>(() => {
    const storageId = process.env.NEXT_PUBLIC_VAULT_CHALLENGE_STORAGE_ID?.trim() || null;
    return {
      title:
        process.env.NEXT_PUBLIC_VAULT_CHALLENGE_TITLE?.trim() || "Live Challenge Vault",
      fileName:
        process.env.NEXT_PUBLIC_VAULT_CHALLENGE_FILE_NAME?.trim() || "challenge-vault.enc",
      storageId,
      announcement:
        process.env.NEXT_PUBLIC_VAULT_CHALLENGE_ANNOUNCEMENT?.trim() ||
        DEFAULT_CHALLENGE_ANNOUNCEMENT,
    };
  }, []);
  const isFounder = sameAddress(address, founderWallet);
  const canSeal = Boolean(isConnected && address && (plaintext.trim() || selectedFile));
  const challengeItem = useMemo<VaultItem | null>(() => {
    if (!publicChallenge.storageId) {
      return null;
    }
    return {
      storage_id: publicChallenge.storageId,
      network: "testnet",
      wallet_address: founderWallet ?? "0x0000000000000000000000000000000000000000",
      integrity_hash: "challenge-pending",
      payload_sha256: "challenge-pending",
      mime_type: "application/octet-stream",
      file_name: publicChallenge.fileName,
      created_at: "1970-01-01T00:00:00.000Z",
      metadata: {
        challenge_mode: true,
        source: "public-vault-challenge",
      },
    };
  }, [founderWallet, publicChallenge]);

  const stopPipeline = useCallback(() => {
    if (pipelineTimer.current) {
      window.clearInterval(pipelineTimer.current);
      pipelineTimer.current = null;
    }
  }, []);

  const startPipeline = useCallback((label: string) => {
    stopPipeline();
    setStatusText(label);
    setLayerStatuses({});
    setCurrentLayer(1);
    pipelineTimer.current = window.setInterval(() => {
      setCurrentLayer((value) => (value >= 9 ? 9 : value + 1));
    }, 520);
  }, [stopPipeline]);

  const finishPipeline = useCallback((statuses: Record<string, string>, label: string) => {
    stopPipeline();
    setCurrentLayer(9);
    setLayerStatuses(statuses);
    setStatusText(label);
  }, [stopPipeline]);

  const connectWallet = useCallback(async () => {
    setErrorText(null);
    const connector = connectors[0];
    if (!connector) {
      setErrorText("Browser wallet tidak ditemukan.");
      return;
    }
    try {
      await connectAsync({ connector, chainId: zeroGTestnet.id });
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Gagal connect wallet.");
    }
  }, [connectAsync, connectors]);

  const ensureTestnet = useCallback(async () => {
    if (chainId !== zeroGTestnet.id) {
      await switchChainAsync({ chainId: zeroGTestnet.id });
    }
  }, [chainId, switchChainAsync]);

  const refreshVaults = useCallback(async () => {
    if (!address) {
      setVaultItems([]);
      return;
    }
    const data = await fetchJson<VaultListResponse>(
      `/v1/integrity/records?wallet_address=${address}&network=testnet`,
    );
    setVaultItems(data.items);
  }, [address]);

  const refreshCounters = useCallback(async () => {
    const publicStats = await fetchJson<{ total_deflected_attacks: number }>(
      "/v1/admin/public-stats",
    );
    setDeflectedAttacks(publicStats.total_deflected_attacks);
    if (address && isFounder) {
      const stats = await fetchJson<AdminStatsResponse>("/v1/admin/stats", {
        headers: {
          "x-wallet-address": address,
        },
      });
      setAdminStats(stats);
      setDeflectedAttacks(stats.total_deflected_attacks);
    } else {
      setAdminStats(null);
    }
  }, [address, isFounder]);

  useEffect(() => {
    void refreshVaults().catch(() => undefined);
  }, [refreshVaults]);

  useEffect(() => {
    void refreshCounters().catch(() => undefined);
    const timer = window.setInterval(() => {
      void refreshCounters().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [refreshCounters]);

  useEffect(() => stopPipeline, [stopPipeline]);

  const sealPayload = useCallback(async () => {
    if (!address || !canSeal) return;
    setErrorText(null);
    setProcessing("seal");
    startPipeline("Triggering 0G testnet gas payment");
    try {
      await ensureTestnet();
      const receiver = toAddress(
        process.env.NEXT_PUBLIC_VAULT_FEE_RECEIVER,
        address,
      );
      const feeValue = parseEther(process.env.NEXT_PUBLIC_VAULT_SEAL_FEE_OG ?? "0");
      const txHash = await sendTransactionAsync({
        to: receiver,
        value: feeValue,
      });

      setStatusText("Signing seal challenge");
      const challenge = await fetchJson<ChallengeResponse>("/v1/auth/challenge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          operation: "seal",
          network: "testnet",
          wallet_address: address,
        }),
      });
      const signature = await signMessageAsync({
        message: challenge.message,
      });

      setStatusText("Running 9-layer seal pipeline");
      const form = new FormData();
      form.append("network", "testnet");
      form.append("challenge_id", challenge.challenge_id);
      form.append("wallet_address", address);
      form.append("signature_kind", "eip191");
      form.append("message", challenge.message);
      form.append("signature", signature);
      form.append("transaction_hash", txHash);
      form.append(
        "metadata",
        JSON.stringify({
          client: "vault-dashboard",
          input_kind: selectedFile ? "file" : "text",
          source: "yieldboost-vault",
        }),
      );

      if (selectedFile) {
        form.append("file", selectedFile);
      } else {
        form.append("plaintext", plaintext);
        form.append("mime_type", "text/plain");
        form.append("file_name", "sealed-note.txt");
      }

      const result = await fetchJson<SealResponse>("/v1/integrity/seal", {
        method: "POST",
        body: form,
      });
      setLastSeal(result);
      finishPipeline(result.layer_statuses, "Sealed and anchored");
      setPlaintext("");
      setSelectedFile(null);
      await refreshVaults();
      await refreshCounters();
    } catch (error) {
      stopPipeline();
      setStatusText("Seal blocked");
      setErrorText(error instanceof Error ? error.message : "Seal failed.");
    } finally {
      setProcessing(null);
    }
  }, [
    address,
    canSeal,
    ensureTestnet,
    finishPipeline,
    plaintext,
    refreshCounters,
    refreshVaults,
    selectedFile,
    sendTransactionAsync,
    signMessageAsync,
    startPipeline,
    stopPipeline,
  ]);

  const unsealItem = useCallback(async (item: VaultItem) => {
    if (!address) return;
    setErrorText(null);
    setProcessing("unseal");
    startPipeline("Signing EIP-712 unseal proof");
    try {
      await ensureTestnet();
      const challenge = await fetchJson<ChallengeResponse>("/v1/auth/challenge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          operation: "unseal",
          network: item.network,
          wallet_address: address,
          storage_id: item.storage_id,
        }),
      });
      const typedData = buildVaultActionTypedData({
        challenge,
        wallet: address,
        storageId: item.storage_id,
        operation: "unseal",
        primaryType: "VaultUnseal",
      });
      const signature = await signTypedDataAsync(typedData);

      setStatusText("TEE sandbox decrypting sealed blob");
      const data = await fetchJson<UnsealResponse>("/v1/integrity/unseal", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          network: item.network,
          challenge_id: challenge.challenge_id,
          wallet_address: address,
          signature_kind: "eip712",
          signature,
          message: challenge.message,
          typed_data: typedData,
          storage_id: item.storage_id,
        }),
      });
      downloadUnsealedFile(data);
      finishPipeline(data.layer_statuses, "Unsealed and downloaded");
      await refreshVaults();
      await refreshCounters();
    } catch (error) {
      stopPipeline();
      setStatusText("Unseal blocked");
      setErrorText(error instanceof Error ? error.message : "Unseal failed.");
      await refreshCounters().catch(() => undefined);
    } finally {
      setProcessing(null);
    }
  }, [
    address,
    ensureTestnet,
    finishPipeline,
    refreshCounters,
    refreshVaults,
    signTypedDataAsync,
    startPipeline,
    stopPipeline,
  ]);

  const deleteItem = useCallback(async (item: VaultItem) => {
    if (!address) return;
    setErrorText(null);
    setProcessing("delete");
    startPipeline("Signing EIP-712 delete proof");
    try {
      await ensureTestnet();
      const challenge = await fetchJson<ChallengeResponse>("/v1/auth/challenge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          operation: "delete",
          network: item.network,
          wallet_address: address,
          storage_id: item.storage_id,
        }),
      });
      const typedData = buildVaultActionTypedData({
        challenge,
        wallet: address,
        storageId: item.storage_id,
        operation: "delete",
        primaryType: "VaultDelete",
      });
      const signature = await signTypedDataAsync(typedData);

      setStatusText("Removing sealed blob from active vault index");
      const data = await fetchJson<DeleteResponse>("/v1/integrity/delete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          network: item.network,
          challenge_id: challenge.challenge_id,
          wallet_address: address,
          signature_kind: "eip712",
          signature,
          message: challenge.message,
          typed_data: typedData,
          storage_id: item.storage_id,
        }),
      });
      finishPipeline(data.layer_statuses, "Deleted from active vault");
      if (lastSeal?.storage_id === item.storage_id) {
        setLastSeal(null);
      }
      await refreshVaults();
      await refreshCounters();
    } catch (error) {
      stopPipeline();
      setStatusText("Delete blocked");
      setErrorText(error instanceof Error ? error.message : "Delete failed.");
      await refreshCounters().catch(() => undefined);
    } finally {
      setProcessing(null);
    }
  }, [
    address,
    ensureTestnet,
    finishPipeline,
    lastSeal,
    refreshCounters,
    refreshVaults,
    signTypedDataAsync,
    startPipeline,
    stopPipeline,
  ]);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const activeStatus = useMemo(() => {
    if (processing === "seal") return "Sealing";
    if (processing === "unseal") return "Unsealing";
    if (processing === "delete") return "Deleting";
    return statusText;
  }, [processing, statusText]);

  return (
    <div className="min-h-screen bg-[#050a05] text-[#fffff0]">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-72"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(5,10,5,0.64) 0%, rgba(5,10,5,0.28) 46%, rgba(5,10,5,0.7) 100%), linear-gradient(180deg, rgba(5,10,5,0.12) 0%, rgba(5,10,5,0.82) 100%), url('/vault/vault-hacker-bg.png')",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-25 mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,10,5,0.04)_0%,rgba(5,10,5,0.54)_62%,#050a05_100%)]" />
      <header className="relative z-10 border-b border-emerald-400/15 bg-black/55 px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 text-black shadow-[0_0_28px_rgba(16,185,129,0.32)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-2xl font-black tracking-normal text-[#fffff0]">
                YIELDBOOST <span className="font-semibold text-emerald-400">VAULT</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300/65">
                9-Layer Integrity Protocol
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/5 px-3 py-2 font-mono text-[11px] text-emerald-200">
              {activeStatus}
            </div>
            {isConnected ? (
              <>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  {shortAddress(address)} / 0G Testnet
                </div>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-black transition hover:bg-emerald-300 disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" />
                {connecting ? "Connecting" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-7">
          <div className="relative overflow-hidden rounded-lg border border-emerald-400/25 bg-black/42 p-5 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl md:p-6">
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="md:max-w-[70%]">
                <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  <Award className="h-4 w-4" />
                  Main Stage Challenge
                </div>
                <h1 className="max-w-2xl text-3xl font-black tracking-normal text-[#fffff0] md:text-[2.55rem] md:leading-[1.06]">
                  CRACK THE SHIELD: 6-Month Dedicated VPS Prize
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/65">
                  Winner takes the dedicated 8 vCPU / 16 GB RAM node by proving a real bypass against the live vault.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-100">
                    Prize Value: $168 x 6 months
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-50/70">
                    Hacker Challenge Live
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-300/20 bg-[#07140d]/78 p-4 text-left backdrop-blur md:min-w-52">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/65">
                  Total Deflected Attacks
                </div>
                <div className="mt-2 text-4xl font-black text-emerald-400">
                  {formatCount(deflectedAttacks)}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-300/70">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  security_logs live
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-emerald-400" />
                <h2 className="text-xl font-black text-white">The Forge</h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/50">
                Multipart / 0G Gas
              </span>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-lg border p-4 transition ${
                dragActive
                  ? "border-emerald-300 bg-emerald-400/10"
                  : "border-white/10 bg-black/35"
              }`}
            >
              <textarea
                value={plaintext}
                onChange={(event) => setPlaintext(event.target.value)}
                disabled={Boolean(selectedFile)}
                placeholder="Secret message"
                className="h-36 w-full resize-none rounded-lg border border-white/10 bg-black/55 p-4 text-sm text-white outline-none transition placeholder:text-emerald-100/25 focus:border-emerald-400/70 disabled:opacity-45"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                  <FileArchive className="h-4 w-4 text-emerald-300" />
                  {selectedFile ? selectedFile.name : "Choose File"}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                {selectedFile ? (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/15"
                  >
                    <X className="h-4 w-4" />
                    Clear File
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-emerald-50/55">
                0G testnet payment is requested before the seal pipeline starts.
              </div>
              <button
                type="button"
                onClick={sealPayload}
                disabled={!canSeal || Boolean(processing)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_0_30px_rgba(16,185,129,0.24)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                <Lock className="h-4 w-4" />
                Seal
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100">
                <Check className="h-4 w-4 text-emerald-300" />
                Verified by YieldBoost
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-emerald-50/75">
                <Shield className="h-4 w-4 text-emerald-300" />
                Military-Grade 9-Layer Protection
              </div>
            </div>
            <AnimatePresence>
              {errorText ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 flex items-start gap-2 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorText}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/35 p-5 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                <Activity className="h-4 w-4" />
                Integrity Pipeline
              </h2>
              <span className="font-mono text-[10px] text-emerald-50/45">
                {currentLayer}/9
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {layers.map((layer) => {
                const Icon = layer.icon;
                const active = currentLayer >= layer.id || Boolean(layerStatuses[layer.key]);
                const current = currentLayer === layer.id && Boolean(processing);
                return (
                  <motion.div
                    key={layer.key}
                    layout
                    className={`rounded-lg border p-4 transition ${
                      active
                        ? "border-emerald-300/35 bg-emerald-400/8"
                        : "border-white/10 bg-white/[0.025] opacity-55"
                    } ${current ? "shadow-[0_0_24px_rgba(16,185,129,0.18)]" : ""}`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          active ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-white/35"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-black text-white">
                          {layer.key}: {layer.name}
                        </div>
                        <div className="truncate text-[11px] text-emerald-50/45">
                          {layerStatuses[layer.key] ?? layer.desc}
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/60">
                      <motion.div
                        className="h-full rounded-full bg-emerald-400"
                        initial={false}
                        animate={{ width: active ? "100%" : "0%" }}
                        transition={{ duration: 0.45 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-300/20 bg-black/40 p-5 backdrop-blur-xl md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  <Shield className="h-4 w-4" />
                  Public Challenge
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {publicChallenge.title}
                </h2>
              </div>
              <div
                className={`rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] ${
                  publicChallenge.storageId
                    ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                    : "border border-amber-300/20 bg-amber-300/10 text-amber-100"
                }`}
              >
                {publicChallenge.storageId ? "Target Live" : "Founder Upload Pending"}
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-emerald-50/70">
              {publicChallenge.announcement}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/35 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-50/45">
                  Challenge Target
                </div>
                <div className="mt-2 text-sm font-black text-white">
                  {publicChallenge.fileName}
                </div>
                <div className="mt-1 break-all font-mono text-[11px] text-emerald-50/50">
                  {publicChallenge.storageId ?? "Storage ID will be revealed after founder upload."}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/35 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-50/45">
                  Public Rules
                </div>
                <div className="mt-2 space-y-1 text-sm text-emerald-50/70">
                  <div>Every wallet sees the same target once the founder publishes it.</div>
                  <div>All failed unseal attempts are logged to the live counter.</div>
                  <div>The announcement stays visible even before the target file exists.</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-emerald-50/55">
                {publicChallenge.storageId
                  ? "Connect a wallet and sign an unseal proof to attempt the public challenge."
                  : "No founder blob has been published yet, so the challenge cannot be attempted."}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (challengeItem) {
                    void unsealItem(challengeItem);
                  }
                }}
                disabled={!challengeItem || !isConnected || Boolean(processing)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
              >
                <Download className="h-4 w-4" />
                {publicChallenge.storageId
                  ? "Attempt Unseal Challenge Vault"
                  : "Founder Upload Pending"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-emerald-400" />
                <h2 className="text-xl font-black text-white">The Vault</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isFounder ? (
                  <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                    Founder
                  </span>
                ) : null}
                <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                  {vaultItems.length} blobs
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {vaultItems.map((item) => (
                <div
                  key={item.storage_id}
                  className="rounded-lg border border-white/10 bg-black/45 p-4 transition hover:border-emerald-300/30"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">
                        {item.file_name ?? "Sealed Vault Blob"}
                      </div>
                      <div className="truncate font-mono text-[11px] text-emerald-50/45">
                        {item.storage_id}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-[11px] text-emerald-50/45">
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    {item.storage_tx_hash ? "0G anchored" : "Local fallback"}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void unsealItem(item)}
                      disabled={Boolean(processing)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      Unseal
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteItem(item)}
                      disabled={Boolean(processing)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/15 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!vaultItems.length ? (
                <div className="rounded-lg border border-white/10 bg-black/35 p-6 text-sm text-emerald-50/55">
                  No sealed blobs for {shortAddress(address)}.
                </div>
              ) : null}
            </div>
          </div>

          {isFounder ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl md:p-6">
              <button
                type="button"
                onClick={() => setAuditTrailOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h2 className="text-xl font-black text-white">Global Security Audit Trail</h2>
                    <div className="mt-1 text-xs text-emerald-50/45">
                      Founder-only logs for blocked and successful vault actions.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                    {adminStats?.recent_logs?.length ?? 0} logs
                  </span>
                  <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/35 text-emerald-200">
                    {auditTrailOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {auditTrailOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3">
                      {(adminStats?.recent_logs ?? []).slice(0, 8).map((log, index) => (
                        <div
                          key={`${log.timestamp}-${index}`}
                          className="rounded-lg border border-white/10 bg-black/45 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-mono text-xs text-emerald-300">
                                {shortAddress(log.wallet_address)}
                              </div>
                              <div className="mt-1 text-[11px] text-emerald-50/45">
                                {log.action_type} / {log.status}
                                {log.layer_failed ? ` / ${log.layer_failed}` : ""}
                              </div>
                            </div>
                            <div
                              className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${
                                log.status === "Blocked"
                                  ? "bg-red-400/10 text-red-200"
                                  : "bg-emerald-400/10 text-emerald-200"
                              }`}
                            >
                              {log.status}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!adminStats?.recent_logs?.length ? (
                        <div className="rounded-lg border border-white/10 bg-black/35 p-6 text-sm text-emerald-50/55">
                          Audit trail is empty.
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative grid h-12 w-12 place-items-center rounded-lg border border-emerald-300/20 bg-black/35">
                <Server className="h-6 w-6 text-emerald-300" />
                <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-emerald-300" />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-50/45">
                  Execution Infrastructure
                </div>
                <div className="text-sm font-black text-emerald-200">
                  TEE Sandbox / Firecracker VM
                </div>
                <div className="text-xs text-emerald-50/45">
                  One request, one isolated VM / VPS prize: $168 x 6 months
                </div>
              </div>
            </div>
          </div>

          {lastSeal ? (
            <div className="rounded-lg border border-white/10 bg-black/35 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-white">
                <Globe className="h-4 w-4 text-emerald-300" />
                Latest Anchor
              </div>
              <div className="break-all font-mono text-[11px] text-emerald-50/55">
                {lastSeal.storage_id}
              </div>
              {lastSeal.storage_explorer_url ? (
                <a
                  href={lastSeal.storage_explorer_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-lg border border-emerald-300/25 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10"
                >
                  Open 0G Storage Tx
                </a>
              ) : null}
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
