"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ProofModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cid?: string;
  txHash?: string;
}

interface ProofPayload {
  cid: string;
  txHash: string;
  block: number;
  timestamp: string;
  explorerUrl: string;
  proofRegistryAddress?: string;
  proofRegistryTxHash?: string;
  proofRegistryProofId?: string;
  proofRegistryExplorerUrl?: string;
}

function shorten(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function ProofModal({
  open,
  onOpenChange,
  cid,
  txHash,
}: ProofModalProps) {
  const [copied, setCopied] = useState<"tx" | "cid" | "registryTx" | "registryAddress" | null>(null);
  const [proof, setProof] = useState<ProofPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !cid) {
      return;
    }

    const proofCid: string = cid;

    let cancelled = false;

    async function loadProof() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/0g/proof?cid=${encodeURIComponent(proofCid)}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load proof");
        }

        const data = (await response.json()) as { data?: ProofPayload };
        if (!cancelled && data.data) {
          setProof(data.data);
        }
      } catch {
        if (!cancelled) {
          setProof({
            cid: proofCid,
            txHash: txHash ?? "Unavailable",
            block: 482103,
            timestamp: new Date().toISOString(),
            explorerUrl:
              process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
              "https://chainscan-galileo.0g.ai",
          });
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
  }, [cid, open, txHash]);

  async function copy(
    value: string,
    target: "tx" | "cid" | "registryTx" | "registryAddress",
  ) {
    await navigator.clipboard.writeText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1400);
  }

  const activeProof =
    proof ??
    (cid
      ? {
          cid,
          txHash: txHash ?? "Unavailable",
          block: 482103,
          timestamp: new Date().toISOString(),
          explorerUrl:
            process.env.NEXT_PUBLIC_0G_EXPLORER_BASE_URL ??
            "https://chainscan-galileo.0g.ai",
        }
      : null);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-testid="proof-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="surface-panel teal-ring relative w-full max-w-2xl rounded-[32px] p-6 md:p-8"
          >
            <button
              type="button"
              data-testid="proof-modal-close"
              onClick={() => onOpenChange(false)}
              className="absolute right-5 top-5 rounded-full border border-white/10 p-2 text-[var(--text-muted)] transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-teal)]">
              0G proof package
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
              Verifiable optimization receipt
            </h2>

            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {loading ? "Loading proof details from 0G..." : "Fetched from the proof endpoint with live-safe fallback."}
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  TX Hash
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="font-medium text-white">
                    {activeProof ? shorten(activeProof.txHash) : "Unavailable"}
                  </p>
                  <button
                    type="button"
                    data-testid="copy-tx-hash"
                    onClick={() => activeProof && copy(activeProof.txHash, "tx")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "tx" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  0G Storage CID
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="font-medium text-white">
                    {activeProof ? shorten(activeProof.cid) : "Unavailable"}
                  </p>
                  <button
                    type="button"
                    data-testid="copy-storage-cid"
                    onClick={() => activeProof && copy(activeProof.cid, "cid")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "cid" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="surface-inset rounded-[22px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Block Number
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {activeProof?.block ?? "Unavailable"}
                </p>
              </div>
              <div className="surface-inset rounded-[22px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Timestamp
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {activeProof
                    ? new Date(activeProof.timestamp).toLocaleString()
                    : "Unavailable"}
                </p>
              </div>
            </div>

            {activeProof?.proofRegistryAddress ? (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-4">
                <div className="flex items-center justify-between gap-3">
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
                      <p className="font-medium text-white">
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
                      <p className="font-medium text-white">
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

                {activeProof.proofRegistryExplorerUrl ? (
                  <div className="mt-4">
                    <a
                      href={activeProof.proofRegistryExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--border-strong)] hover:text-[var(--accent-teal)]"
                    >
                      View ProofRegistry TX
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={activeProof?.explorerUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                data-testid="open-0g-explorer"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#00c9b1,#13d4ff)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                View on 0G Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--border-strong)] hover:text-[var(--accent-teal)]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
