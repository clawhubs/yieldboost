import {
  Activity,
  Check,
  CheckCheck,
  CircleDashed,
  Clock3,
  Bot,
  Disc3,
  Expand,
  Grid2X2,
  MessageCircleMore,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { LiveData } from "./types";

const agentChecklist = [
  "Scanning wallet & balances",
  "Detecting idle assets",
  "Finding best yield opportunities",
  "Simulating strategies",
  "Checking risk & slippage",
] as const;

const executionSteps = [
  "Swapping 1,250 USDC to SAUCE",
  "Adding liquidity to SaucerSwap LP",
  "Staking 512.5 0G",
  "Rebalancing BONZO position",
  "Finalizing & updating stats",
] as const;

function AgentRail({ icon: Icon }: { icon: typeof Activity }) {
  return (
    <div className="glass-inset flex h-10 w-10 items-center justify-center rounded-[12px] text-[#cfd9e2]">
      <Icon className="h-4 w-4" />
    </div>
  );
}

interface Props {
  live: LiveData;
  onOpenProof: () => void;
}

export default function DashboardAgentPanel({ live, onOpenProof }: Props) {
  return (
    <aside data-testid="right-agent-panel" className="yb-card rounded-[18px] p-4">
      {/* Agent Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="glass-accent relative flex h-14 w-14 items-center justify-center rounded-[16px] text-[#22ddd0]">
            <Bot className="h-8 w-8" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white">AI Agent</div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#2fe06d]">
              <span className="inline-flex h-2.5 w-2.5 animate-glow-pulse rounded-full bg-[#2fe06d]" />
              Powered by 0G Compute Network
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 rounded-full border border-[rgba(47,224,109,0.3)] bg-[rgba(47,224,109,0.1)] px-2.5 py-1 text-[10px] font-medium text-[#2fe06d]">
              <ShieldCheck className="h-3 w-3" />
              TEE Verified
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="glass-inset flex h-10 w-10 items-center justify-center rounded-[10px] text-[#d8e1e8]">
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button type="button" className="glass-inset flex h-10 w-10 items-center justify-center rounded-[10px] text-[#d8e1e8]">
            <Expand className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* User message */}
      <div className="mt-5 flex items-start gap-3">
        <div className="pt-4"><AgentRail icon={MessageCircleMore} /></div>
        <div className="glass-inset min-w-0 flex-1 rounded-[14px] px-4 py-4">
          <div className="text-[14px] text-[#edf3f8]">
            Optimize my portfolio for the best<br />yield with low risk.
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
            <span>10:30 AM</span>
            <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
          </div>
        </div>
      </div>

      {/* Agent analyzing */}
      <div className="mt-4 flex items-start gap-3">
        <div className="pt-4"><AgentRail icon={Activity} /></div>
        <div className="glass-inset min-w-0 flex-1 rounded-[14px] px-4 py-4">
          <div className="text-[15px] text-white">Analyzing your portfolio...</div>
          <div className="mt-4 space-y-3">
            {agentChecklist.map((item) => (
              <div key={item} className="flex items-center gap-3 text-[13px] text-[#d7e0e8]">
                <Check className="h-4 w-4 text-[#2fe06d]" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 text-right text-[11px] text-[#a4b0bc]">10:30 AM</div>
        </div>
      </div>

      {/* Strategy result */}
      <div className="mt-4 flex items-start gap-3">
        <div className="pt-4"><AgentRail icon={CircleDashed} /></div>
        <div className="glass-inset min-w-0 flex-1 rounded-[14px] px-4 py-4">
          <div className="text-[15px] text-white">Here&apos;s your optimal strategy:</div>
          <div className="mt-3 text-[14px] leading-7 text-[#e6edf3]">
            You can increase your yield by<br />
            <span className="text-[16px] font-semibold text-[#2fe06d]">
              +{live.yieldIncreasePct}% (+${live.estimatedAnnualGain.toLocaleString()}/year)
            </span>
            <br />with low risk.
          </div>
          <button
            type="button"
            data-testid="execute-btn"
            className="yb-teal-button mt-5 flex w-full items-center justify-center gap-3 rounded-[12px] px-4 py-4 text-[16px] font-semibold text-[#071217]"
          >
            <Zap className="h-5 w-5" />
            Execute Optimization
          </button>
          <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
            <span>10:31 AM</span>
            <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
          </div>
        </div>
      </div>

      {/* Executing steps */}
      <div className="mt-4 flex items-start gap-3">
        <div className="pt-4"><AgentRail icon={Clock3} /></div>
        <div className="glass-inset min-w-0 flex-1 rounded-[14px] px-4 py-4">
          <div className="text-[15px] text-white">Executing strategy...</div>
          <div className="mt-4 space-y-3">
            {executionSteps.map((item) => (
              <div key={item} className="flex items-center gap-3 text-[13px] text-[#d7e0e8]">
                <Check className="h-4 w-4 text-[#2fe06d]" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
            <span>10:31 AM</span>
            <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
          </div>
        </div>
      </div>

      {/* Optimization Complete */}
      <div
        data-testid="optimization-result"
        className="mt-4 rounded-[16px] border border-[rgba(57,235,169,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(57,235,169,0.14),transparent_35%),rgba(10,17,23,0.75)] px-4 py-5 backdrop-blur-[20px]"
      >
        <div className="text-[15px] text-[#22ddd0]">Optimization Complete! 🎉</div>
        <div className="mt-3 text-[14px] text-[#ebf2f8]">Your new APY is now</div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="yb-glow-text text-[64px] font-semibold leading-none text-[#68ff7a]">{live.optimizedApy}%</div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#68ff7a] shadow-[0_0_36px_rgba(104,255,122,0.3)]">
            <CheckCheck className="h-10 w-10 text-[#68ff7a]" />
          </div>
        </div>
        <div className="mt-2 text-[13px] text-[#dbe4ec]">You&apos;re now earning more!</div>
        <button
          type="button"
          data-testid="agent-card-proof"
          onClick={onOpenProof}
          className="glass-accent mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#22ddd0] transition hover:border-[rgba(0,201,177,0.4)]"
        >
          View on Explorer →
        </button>
        <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#a4b0bc]">
          <span>10:32 AM</span>
          <CheckCheck className="h-4 w-4 text-[#25d6c6]" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-end justify-between gap-3 px-1">
        <div className="text-[13px] text-[#d5dde6]">Built on 0G. Built for the Future.</div>
        <div className="flex items-center gap-1.5 text-[32px] font-semibold tracking-tight text-[#20d8ca]">
          <Disc3 className="h-5 w-5" />
          0G
        </div>
      </div>
    </aside>
  );
}
