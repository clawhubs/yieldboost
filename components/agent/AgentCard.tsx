import {
  ArrowUpRight,
  Clock3,
  Database,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

interface AgentCardProps {
  tokenId: number;
  apy: number;
  currentApy?: number | null;
  yieldIncreasePct?: number | null;
  estimatedAnnualGain?: number | null;
  confidence?: number | null;
  recommended?: string | null;
  proofRegistryProofId?: string | null;
  sourceLabel?: string | null;
  latest?: boolean;
  creator: string;
  verified: boolean;
  timestamp: string;
  owner: string;
  onClick?: () => void;
}

export default function AgentCard({
  tokenId,
  apy,
  currentApy,
  yieldIncreasePct,
  estimatedAnnualGain,
  confidence,
  recommended,
  proofRegistryProofId,
  sourceLabel,
  latest = false,
  creator,
  verified,
  timestamp,
  owner,
  onClick,
}: AgentCardProps) {
  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const hasLiveOptimizationFields = typeof currentApy === "number" && typeof estimatedAnnualGain === "number";
  const apyLift = typeof currentApy === "number" ? apy - currentApy : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-[24px] border border-[#17242f] bg-[radial-gradient(circle_at_top_right,rgba(31,227,190,0.14),transparent_34%),linear-gradient(180deg,#081017_0%,#060c12_100%)] p-5 text-left transition hover:border-[rgba(34,221,208,0.4)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,221,208,0.55),transparent)] opacity-70" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[rgba(34,221,208,0.24)] bg-[rgba(5,22,24,0.9)] text-[#22ddd0] shadow-[inset_0_0_24px_rgba(34,221,208,0.08)]">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="text-left">
            <div className="text-[17px] font-semibold text-white">
              {recommended ?? `Strategy #${tokenId}`}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#96a7b6]">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" />
                {new Date(timestamp).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Fingerprint className="h-3 w-3" />
                #{tokenId}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {latest ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,197,77,0.28)] bg-[rgba(255,197,77,0.08)] px-2.5 py-1 text-[10px] font-medium text-[#ffd773]">
              <Sparkles className="h-3 w-3" />
              Latest
            </div>
          ) : null}
          {verified ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(47,224,109,0.3)] bg-[rgba(47,224,109,0.1)] px-2.5 py-1 text-[10px] font-medium text-[#2fe06d]">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full border border-[#1a313d] bg-[#0a141b] px-3 py-1 text-[#cfe1ee]">
          {sourceLabel ?? "Agent strategy"}
        </span>
        {proofRegistryProofId ? (
          <span className="rounded-full border border-[rgba(34,221,208,0.18)] bg-[rgba(34,221,208,0.08)] px-3 py-1 text-[#8de8e1]">
            Proof #{proofRegistryProofId}
          </span>
        ) : null}
        {confidence ? (
          <span className="rounded-full border border-[#263746] bg-[#0a141b] px-3 py-1 text-[#a6bac9]">
            Confidence {confidence}%
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-[20px] border border-[#1b2a35] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8ea2b0]">
              Optimized APY
            </div>
            <div className="mt-2 text-[38px] font-semibold leading-none text-[#68ff7a]">
              {apy.toFixed(2)}%
            </div>
          </div>
          {apyLift !== null ? (
            <div className="rounded-[14px] border border-[rgba(47,224,109,0.24)] bg-[rgba(47,224,109,0.08)] px-3 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#a8dcb3]">
                APY Lift
              </div>
              <div className="mt-1 text-[18px] font-semibold text-[#7cff90]">
                +{apyLift.toFixed(2)}%
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-[14px] border border-[#15232d] bg-[#081017] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7f94a2]">
              Current
            </div>
            <div className="mt-1 text-[17px] font-semibold text-white">
              {typeof currentApy === "number" ? `${currentApy.toFixed(2)}%` : "NFT"}
            </div>
          </div>
          <div className="rounded-[14px] border border-[#15232d] bg-[#081017] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7f94a2]">
              Gain / Year
            </div>
            <div className="mt-1 text-[17px] font-semibold text-white">
              {typeof estimatedAnnualGain === "number"
                ? `$${estimatedAnnualGain.toLocaleString()}`
                : "N/A"}
            </div>
          </div>
          <div className="rounded-[14px] border border-[#15232d] bg-[#081017] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7f94a2]">
              Lift %
            </div>
            <div className="mt-1 text-[17px] font-semibold text-white">
              {typeof yieldIncreasePct === "number"
                ? `+${yieldIncreasePct.toFixed(2)}%`
                : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {hasLiveOptimizationFields ? (
        <div className="mt-4 rounded-[18px] border border-[#17252f] bg-[rgba(6,14,19,0.85)] px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#7fa0ae]">
            <Database className="h-3.5 w-3.5" />
            Real optimization context
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#d4e0e7]">
            This strategy card is backed by a stored optimization proof, so APY, gain, and proof identifiers come from persisted execution history for the active review wallet.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2 text-[12px] text-[#a8b8c6]">
        <User className="h-4 w-4" />
        <span>Owner: {shortAddress(owner)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#16232d] pt-4">
        <div>
          <div className="text-[11px] text-[#7f94a2]">Creator</div>
          <div className="mt-1 text-[13px] font-medium text-white">
            {shortAddress(creator)}
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.2)] bg-[rgba(34,221,208,0.08)] px-3 py-2 text-[12px] font-medium text-[#92ece3] transition group-hover:border-[rgba(34,221,208,0.34)] group-hover:text-white">
          View details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}
