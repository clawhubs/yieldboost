"use client";

import { Check, CheckCheck, Copy, ExternalLink, Zap } from "lucide-react";
import type { OptimizationResult } from "@/lib/optimizations";

const EXPLORER_BASE = "https://chainscan-galileo.0g.ai";

const defaultProofs = [
  { hash: "0x3f8...b291", chain: "0G Newton", age: "2 sec ago" },
  { hash: "0xa7c...dbe2", chain: "0G Newton", age: "8 sec ago" },
  { hash: "0x9b2...dd49", chain: "0G Newton", age: "15 sec ago" },
] as const;

const executionSteps = [
  "Swapping 1,250 USDC to SAUCE",
  "Adding liquidity to SaucerSwap LP",
  "Staking 512.5 0G",
  "Rebalancing BONZO position",
  "Finalizing & updating stats",
] as const;

interface Props {
  latestResult: OptimizationResult | null;
  copiedField: string | null;
  copyToClipboard: (value: string, field: string) => Promise<void>;
}

export default function DashboardProofRow({ latestResult, copiedField, copyToClipboard }: Props) {
  return (
    <div className="grid gap-[10px] xl:grid-cols-[276px_278px_minmax(0,1fr)]">
      {/* Transaction Proof */}
      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="text-[12px] font-medium text-white">TRANSACTION PROOF (LATEST)</div>
        {latestResult?.txHash ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[12px] text-[#dce4eb]">
                  <span className="truncate">{latestResult.txHash.slice(0, 10)}...{latestResult.txHash.slice(-6)}</span>
                  <button type="button" onClick={() => copyToClipboard(latestResult.txHash!, "dashTx")} className="text-[#9faab6] hover:text-white">
                    <Copy className="h-3 w-3" />
                    {copiedField === "dashTx" ? <span className="ml-1 text-[9px]">Copied</span> : null}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-[#9faab6]">0G Galileo</div>
              </div>
              <div className="glass-accent rounded-full px-2 py-1 text-[9px] text-[#25d6c6]">Verified on 0G</div>
            </div>
            {latestResult.storageProof ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12px] text-[#dce4eb]">
                    <span className="truncate">CID: {latestResult.storageProof.slice(0, 12)}...{latestResult.storageProof.slice(-4)}</span>
                    <button type="button" onClick={() => copyToClipboard(latestResult.storageProof!, "dashCid")} className="text-[#9faab6] hover:text-white">
                      <Copy className="h-3 w-3" />
                      {copiedField === "dashCid" ? <span className="ml-1 text-[9px]">Copied</span> : null}
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-[#9faab6]">0G Storage</div>
                </div>
                <div className="glass-accent rounded-full px-2 py-1 text-[9px] text-[#25d6c6]">Anchored</div>
              </div>
            ) : null}
            {latestResult.proofRegistryTxHash ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12px] text-[#dce4eb]">
                    <span className="truncate">Registry: {latestResult.proofRegistryTxHash.slice(0, 10)}...{latestResult.proofRegistryTxHash.slice(-6)}</span>
                    <button type="button" onClick={() => copyToClipboard(latestResult.proofRegistryTxHash!, "dashRegTx")} className="text-[#9faab6] hover:text-white">
                      <Copy className="h-3 w-3" />
                      {copiedField === "dashRegTx" ? <span className="ml-1 text-[9px]">Copied</span> : null}
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-[#9faab6]">
                    ProofRegistry {latestResult.proofRegistryProofId ? `#${latestResult.proofRegistryProofId}` : ""}
                  </div>
                </div>
                <div className="glass-accent rounded-full px-2 py-1 text-[9px] text-[#25d6c6]">On-chain</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {defaultProofs.map((item) => (
              <div key={item.hash} className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] text-[#dce4eb]">{item.hash}</div>
                  <div className="mt-1 text-[11px] text-[#9faab6]">{item.chain} <span className="ml-2">{item.age}</span></div>
                </div>
                <div className="glass-accent rounded-full px-2 py-1 text-[9px] text-[#25d6c6]">Verified on 0G</div>
              </div>
            ))}
          </div>
        )}
        <a
          href={latestResult?.proofUrl ?? EXPLORER_BASE}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-[12px] text-[#25d6c6] hover:underline"
        >
          View on 0G Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Optimization Progress */}
      <div data-testid="optimization-progress" className="yb-card rounded-[14px] px-4 py-4">
        <div className="text-[12px] font-medium text-white">OPTIMIZATION PROGRESS</div>
        <div className="mt-5 flex items-center justify-between">
          {[
            { label: "Analyzing", done: true },
            { label: "Optimizing", done: true },
            { label: "Executing", active: true, step: "3" },
            { label: "Done", step: "4" },
          ].map((step, index) => (
            <div key={step.label} className="relative flex flex-1 flex-col items-center">
              {index < 3 ? (
                <div className="absolute left-1/2 top-[18px] h-[2px] w-full bg-[rgba(255,255,255,0.07)]" />
              ) : null}
              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-[13px] ${
                  step.done
                    ? "border-[#2ed86a] bg-[rgba(46,216,106,0.12)] text-[#2ed86a]"
                    : step.active
                      ? "yb-glow-border border-[#25d6c6] bg-[rgba(37,214,198,0.12)] text-[#25d6c6]"
                      : "glass-inset text-[#d7dfe7]"
                }`}
              >
                {step.done ? <CheckCheck className="h-4 w-4" /> : step.step}
              </div>
              <div className="mt-3 text-[12px] text-[#d8e1e8]">{step.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-[#d6dee6]">
          <Zap className="h-4 w-4 text-[#f7b24c]" />
          Executed in 8.42 seconds
        </div>
      </div>

      {/* Executing Strategy */}
      <div className="yb-card rounded-[14px] px-4 py-4">
        <div className="text-[12px] font-medium text-white">EXECUTING STRATEGY...</div>
        <div className="mt-4 space-y-2">
          {executionSteps.map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px] text-[#dce4eb]">
              <Check className="h-4 w-4 text-[#2fe06d]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
