import { Database, ShieldCheck } from "lucide-react";

interface Props {
  onOpenProof: () => void;
}

export default function DashboardProofBanner({ onOpenProof }: Props) {
  return (
    <div data-testid="proof-banner" className="yb-card rounded-[16px] px-4 py-3">
      <div className="grid items-center gap-4 xl:grid-cols-[292px_minmax(0,1fr)_182px]">
        <div className="flex items-center gap-3">
          <div className="glass-accent flex h-12 w-12 items-center justify-center rounded-[12px] text-[#26ddd0]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#21d8c8]">0G STORAGE STATUS</div>
            <div className="text-[13px] text-white">Your portfolio data is securely synced to 0G Storage</div>
            <div className="mt-1 text-[11px] text-[#a8b4bf]">Last synced: 2s ago to 0G Storage</div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between text-[13px] text-[#d8e1e9]">
            <span>Synchronizing...</span>
            <span>98.4%</span>
          </div>
          <div className="mt-2 h-[12px] rounded-full bg-[rgba(255,255,255,0.06)] p-[2px]">
            <div className="h-full w-[98.4%] rounded-full bg-[linear-gradient(90deg,#22ddd0_0%,#18aeb8_100%)] shadow-[0_0_12px_rgba(34,221,208,0.4)]" />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenProof}
          data-testid="view-proof-banner"
          className="glass-accent flex items-center gap-3 rounded-[14px] px-4 py-3 text-left transition hover:border-[rgba(0,201,177,0.35)]"
        >
          <div className="glass-inset flex h-11 w-11 items-center justify-center rounded-[12px] text-[#26ddd0]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">Secured by 0G</div>
            <div className="text-[11px] text-[#cfd9e1]">Decentralized Storage</div>
          </div>
        </button>
      </div>
    </div>
  );
}
