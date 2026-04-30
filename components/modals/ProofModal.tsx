"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, ExternalLink, X, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isWalletAddress, type WalletNetworkKey, WALLET_OVERRIDE_STORAGE_KEY } from "@/lib/wallet";

interface ProofModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cid?: string;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  timestamp?: string;
  walletAddress?: string;
  proofRegistryAddress?: string;
  proofRegistryTxHash?: string;
  proofRegistryProofId?: string;
  proofRegistryExplorerUrl?: string;
  decision?: {
    current_apy: number;
    optimized_apy: number;
    recommended: string;
    reasoning?: string;
  };
  mintPortfolio?: Record<string, number>;
  networkKey?: WalletNetworkKey;
  showMintAction?: boolean;
}

interface ProofPayload {
  cid?: string;
  txHash?: string;
  block?: number;
  timestamp?: string;
  explorerUrl?: string;
  walletAddress?: string;
  proofRegistryAddress?: string;
  proofRegistryTxHash?: string;
  proofRegistryProofId?: string;
  proofRegistryExplorerUrl?: string;
  // TEE / 0G Compute metadata
  teeProvider?: string;
  teeModel?: string;
  teeChatId?: string;
  teeVerified?: boolean;
  teeVerificationMethod?: string;
  teeSignedTextMatches?: boolean;
  llmProvider?: string;
}

function shorten(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function buildExplorerHref(url?: string, txHash?: string) {
  if (!url || !txHash) return null;
  const normalized = url.trim();
  if (!normalized) return null;
  if (normalized.includes(txHash)) return normalized;
  return `${normalized.replace(/\/$/, "")}/tx/${txHash}`;
}

export default function ProofModal({
  open,
  onOpenChange,
  cid,
  txHash,
  blockNumber,
  explorerUrl,
  timestamp,
  walletAddress,
  proofRegistryAddress,
  proofRegistryTxHash,
  proofRegistryProofId,
  proofRegistryExplorerUrl,
  decision,
  mintPortfolio,
  networkKey,
  showMintAction = true,
}: ProofModalProps) {
  const [copied, setCopied] = useState<"tx" | "cid" | "registryTx" | "registryAddress" | null>(null);
  const [proof, setProof] = useState<ProofPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadProof() {
      if (!cid) {
        setProof(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const endpoint = `/api/0g/proof?cid=${encodeURIComponent(cid)}`;
        const response = await fetch(endpoint, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load proof");
        }

        const data = (await response.json()) as { data?: ProofPayload };
        if (!cancelled && data.data) {
          setProof(data.data);
        }
      } catch {
        if (!cancelled) {
          setProof(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProof();

    return () => {
      cancelled = true;
    };
  }, [cid, open]);

  async function copy(
    value: string,
    target: "tx" | "cid" | "registryTx" | "registryAddress",
  ) {
    await navigator.clipboard.writeText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1400);
  }

  const seededProof = useMemo<ProofPayload | null>(() => {
    const hasAnySeed =
      Boolean(cid) ||
      Boolean(txHash) ||
      Boolean(blockNumber) ||
      Boolean(explorerUrl) ||
      Boolean(walletAddress) ||
      Boolean(proofRegistryAddress) ||
      Boolean(proofRegistryTxHash) ||
      Boolean(proofRegistryProofId) ||
      Boolean(proofRegistryExplorerUrl) ||
      Boolean(timestamp);

    if (!hasAnySeed) {
      return null;
    }

    return {
      cid,
      txHash,
      block: blockNumber,
      timestamp,
      explorerUrl,
      walletAddress,
      proofRegistryAddress,
      proofRegistryTxHash,
      proofRegistryProofId,
      proofRegistryExplorerUrl,
    };
  }, [
    cid,
    blockNumber,
    explorerUrl,
    proofRegistryAddress,
    proofRegistryExplorerUrl,
    proofRegistryProofId,
    proofRegistryTxHash,
    timestamp,
    txHash,
    walletAddress,
  ]);

  const activeProof = proof ?? seededProof;
  const explorerHref = buildExplorerHref(activeProof?.explorerUrl, activeProof?.txHash);
  const proofRegistryHref = buildExplorerHref(
    activeProof?.proofRegistryExplorerUrl,
    activeProof?.proofRegistryTxHash,
  );
  const hasLiveVerificationHandle = Boolean(activeProof?.txHash || activeProof?.cid);
  const statusMessage = loading
    ? "Loading proof details from 0G..."
    : proof
      ? "Fetched from the live proof endpoint."
      : hasLiveVerificationHandle
        ? "Showing the latest proof data already captured in the app."
        : "No live proof is available yet.";

  const targetWalletAddress = useMemo(() => {
    if (typeof window !== "undefined") {
      const connectedWallet = window.localStorage.getItem(WALLET_OVERRIDE_STORAGE_KEY);
      if (isWalletAddress(connectedWallet)) {
        return connectedWallet;
      }
    }

    return isWalletAddress(walletAddress) ? walletAddress : undefined;
  }, [walletAddress]);

  const canMintAgent =
    showMintAction &&
    Boolean(decision) &&
    Boolean(targetWalletAddress) &&
    Boolean(mintPortfolio && Object.keys(mintPortfolio).length > 0);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-testid="proof-modal"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-md sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="surface-panel teal-ring relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] p-4 sm:max-h-[calc(100vh-2rem)] sm:rounded-[28px] sm:p-5 md:p-6"
          >
            <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-white/8 bg-[rgba(3,6,9,0.92)] px-4 py-4 backdrop-blur-md sm:-mx-5 sm:-mt-5 sm:px-5 md:-mx-6 md:-mt-6 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--accent-teal)] sm:text-xs">
                    0G proof package
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-white sm:text-[32px]">
                    Verifiable optimization receipt
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {statusMessage}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="proof-modal-close"
                  onClick={() => onOpenChange(false)}
                  className="shrink-0 rounded-full border border-white/10 p-2 text-[var(--text-muted)] transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pt-4 sm:pt-5">
              <div className="space-y-4">
                <div className="rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4 sm:rounded-[24px]">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  TX Hash
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="font-medium text-white">
                    {activeProof?.txHash ? shorten(activeProof.txHash) : "Unavailable"}
                  </p>
                  <button
                    type="button"
                    data-testid="copy-tx-hash"
                    onClick={() => activeProof?.txHash && copy(activeProof.txHash, "tx")}
                    disabled={!activeProof?.txHash}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "tx" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

                <div className="rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4 sm:rounded-[24px]">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  0G Storage CID
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="font-medium text-white">
                    {activeProof?.cid ? shorten(activeProof.cid) : "Unavailable"}
                  </p>
                  <button
                    type="button"
                    data-testid="copy-storage-cid"
                    onClick={() => activeProof?.cid && copy(activeProof.cid, "cid")}
                    disabled={!activeProof?.cid}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "cid" ? "Copied" : "Copy"}
                  </button>
                </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="surface-inset rounded-[20px] p-4 sm:rounded-[22px]">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Block Number
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {typeof activeProof?.block === "number" && activeProof.block > 0
                        ? activeProof.block
                        : "Pending receipt"}
                    </p>
                  </div>
                  <div className="surface-inset rounded-[20px] p-4 sm:rounded-[22px]">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Timestamp
                    </p>
                    <p className="mt-2 break-words text-lg font-semibold text-white sm:text-xl">
                      {activeProof?.timestamp
                        ? new Date(activeProof.timestamp).toLocaleString()
                        : "Unavailable"}
                    </p>
                  </div>
                </div>

                {!loading && !explorerHref ? (
                  <div className="rounded-[20px] border border-[rgba(246,193,102,0.22)] bg-[rgba(246,193,102,0.06)] p-4 sm:rounded-[24px]">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#f6c166]">
                      Explorer receipt unavailable
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#f3db9f]">
                      This run does not have a real 0G tx hash yet, so the app will not send you to a fallback explorer page.
                    </p>
                  </div>
                ) : null}

                {activeProof?.walletAddress ? (
                  <div className="rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4 sm:rounded-[24px]">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Signer Wallet
                    </p>
                    <p className="mt-2 break-all font-medium text-white">
                      {shorten(activeProof.walletAddress)}
                    </p>
                  </div>
                ) : null}

                {activeProof?.teeVerified ? (
                  <div className="rounded-[20px] border border-[rgba(47,224,109,0.3)] bg-[rgba(47,224,109,0.05)] p-4 sm:rounded-[24px]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#2fe06d]" />
                        <p className="text-xs uppercase tracking-[0.18em] text-[#2fe06d]">
                          TEE Verified Inference
                        </p>
                      </div>
                      {activeProof.llmProvider && (
                        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white">
                          {activeProof.llmProvider}
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                      Recommendation verified inside TEE enclave on 0G Compute Network
                    </p>
                    {activeProof.teeModel && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="surface-inset rounded-[16px] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            Model
                          </p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {activeProof.teeModel}
                          </p>
                        </div>
                        {activeProof.teeChatId && (
                          <div className="surface-inset rounded-[16px] p-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              Chat ID
                            </p>
                            <p className="mt-1 break-all text-sm font-medium text-white">
                              {shorten(activeProof.teeChatId)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {activeProof?.proofRegistryAddress ? (
                  <div className="rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4 sm:rounded-[24px]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-teal)]">
                          ProofRegistry
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          On-chain proof anchor recorded on 0G.
                        </p>
                      </div>
                      {activeProof.proofRegistryProofId ? (
                        <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Proof #{activeProof.proofRegistryProofId}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="surface-inset rounded-[20px] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Registry Address
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <p className="break-all font-medium text-white">
                            {shorten(activeProof.proofRegistryAddress)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              copy(activeProof.proofRegistryAddress!, "registryAddress")
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copied === "registryAddress" ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="surface-inset rounded-[20px] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Registry TX
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <p className="break-all font-medium text-white">
                            {activeProof.proofRegistryTxHash
                              ? shorten(activeProof.proofRegistryTxHash)
                              : "Unavailable"}
                          </p>
                          {activeProof.proofRegistryTxHash ? (
                            <button
                              type="button"
                              onClick={() =>
                                copy(activeProof.proofRegistryTxHash!, "registryTx")
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-white"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copied === "registryTx" ? "Copied" : "Copy"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {proofRegistryHref ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={proofRegistryHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--border-strong)] hover:text-[var(--accent-teal)]"
                        >
                          View ProofRegistry TX
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a
                          href="/abi/ProofRegistry.json"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--border-strong)] hover:text-[var(--accent-teal)]"
                        >
                          Open Contract ABI
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-4 border-t border-white/8 bg-[rgba(3,6,9,0.92)] px-4 py-4 backdrop-blur-md sm:-mx-5 sm:-mb-5 sm:px-5 md:-mx-6 md:-mb-6 md:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {explorerHref ? (
                  <a
                    href={explorerHref}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="open-0g-explorer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#00c9b1,#13d4ff)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 sm:w-auto"
                  >
                    View on 0G Explorer
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                {showMintAction ? (
                  <button
                    type="button"
                    disabled={!canMintAgent || minting}
                    onClick={async () => {
                      if (!targetWalletAddress) {
                        alert("Connect a wallet first to mint this Agent NFT.");
                        return;
                      }

                      if (!decision || !mintPortfolio || Object.keys(mintPortfolio).length === 0) {
                        alert("A live wallet portfolio is required before this proof can be minted as an Agent NFT.");
                        return;
                      }

                      setMinting(true);

                      try {
                        const response = await fetch(
                          `/api/agent/mint${networkKey ? `?network=${networkKey}` : ""}`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              portfolio: mintPortfolio,
                              walletAddress: targetWalletAddress,
                              decision,
                              storageCid: activeProof?.cid,
                              txHash: activeProof?.txHash,
                              teeAttestation:
                                activeProof?.teeChatId &&
                                activeProof?.teeProvider &&
                                activeProof?.teeModel &&
                                typeof activeProof?.teeVerified === "boolean"
                                  ? {
                                      chatId: activeProof.teeChatId,
                                      provider: activeProof.teeProvider,
                                      model: activeProof.teeModel,
                                      timestamp:
                                        activeProof.timestamp ??
                                        new Date().toISOString(),
                                      isValid: activeProof.teeVerified,
                                      verificationMethod:
                                        activeProof.teeVerificationMethod,
                                    }
                                  : undefined,
                            }),
                          },
                        );
                        const data = await response.json();
                        if (data.success) {
                          alert(`Agent minted to ${targetWalletAddress}! Token ID: ${data.tokenId}`);
                        } else {
                          alert(`Mint failed: ${data.error}`);
                        }
                      } catch (error) {
                        alert(`Mint error: ${error}`);
                      } finally {
                        setMinting(false);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full border border-[rgba(0,201,177,0.3)] bg-[rgba(0,201,177,0.1)] px-5 py-3 text-sm font-semibold text-[#22ddd0] transition hover:border-[rgba(0,201,177,0.5)] hover:bg-[rgba(0,201,177,0.2)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-[rgba(255,255,255,0.04)] disabled:text-[#7c8a96] sm:w-auto"
                  >
                    {minting ? "Minting Agent..." : "Mint as Agent"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--border-strong)] hover:text-[var(--accent-teal)] sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
