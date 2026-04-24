import { ShieldCheck, TrendingUp, Clock, User } from "lucide-react";

interface AgentCardProps {
  tokenId: number;
  apy: number;
  creator: string;
  verified: boolean;
  timestamp: string;
  owner: string;
  onClick?: () => void;
}

export default function AgentCard({
  tokenId,
  apy,
  creator,
  verified,
  timestamp,
  owner,
  onClick,
}: AgentCardProps) {
  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-inset group relative flex w-full flex-col gap-4 rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-5 transition hover:border-[rgba(0,201,177,0.3)] hover:bg-[rgba(0,201,177,0.05)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="glass-accent flex h-12 w-12 items-center justify-center rounded-[14px] text-[#22ddd0]">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="text-left">
            <div className="text-[16px] font-semibold text-white">
              Strategy #{tokenId}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#a4b0bc]">
              <Clock className="h-3 w-3" />
              {new Date(timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
        {verified && (
          <div className="flex items-center gap-1.5 rounded-full border border-[rgba(47,224,109,0.3)] bg-[rgba(47,224,109,0.1)] px-2.5 py-1 text-[10px] font-medium text-[#2fe06d]">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </div>
        )}
      </div>

      {/* APY Display */}
      <div className="rounded-[16px] border border-white/8 bg-[rgba(255,255,255,0.02)] px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Optimized APY
        </div>
        <div className="mt-1 text-[32px] font-semibold text-[#68ff7a]">
          {apy.toFixed(2)}%
        </div>
      </div>

      {/* Owner Info */}
      <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
        <User className="h-4 w-4" />
        <span>Owner: {shortAddress(owner)}</span>
      </div>

      {/* Creator */}
      <div className="flex items-center justify-between border-t border-white/8 pt-3">
        <span className="text-[11px] text-[var(--text-muted)]">Creator</span>
        <span className="text-[12px] font-medium text-white">
          {shortAddress(creator)}
        </span>
      </div>
    </button>
  );
}
