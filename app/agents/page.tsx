import { Metadata } from "next";
import AgentGallery from "@/components/agent/AgentGallery";

export const metadata: Metadata = {
  title: "Agents - YieldBoost AI",
  description: "Browse and manage your yield optimization agents",
};

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#0a0d11]">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold text-white sm:text-[40px]">
            Agent Gallery
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-muted)] sm:text-[16px]">
            Your minted yield optimization strategies as tradable Agent NFTs
          </p>
        </div>

        {/* Agent Gallery */}
        <AgentGallery />

        {/* Info Card */}
        <div className="mt-8 rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-6">
          <h2 className="text-[18px] font-semibold text-white">About Agent NFTs</h2>
          <p className="mt-3 text-[14px] leading-7 text-[var(--text-muted)]">
            Each Agent NFT represents a verified yield optimization strategy. You can:
          </p>
          <ul className="mt-3 space-y-2 text-[14px] text-[var(--text-muted)]">
            <li className="flex items-start gap-2">
              <span className="text-[#22ddd0]">•</span>
              <span>View the strategy details and APY performance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#22ddd0]">•</span>
              <span>Trade agents on NFT marketplaces (coming soon)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#22ddd0]">•</span>
              <span>Authorize other wallets to use your strategies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#22ddd0]">•</span>
              <span>Verify TEE attestation for trusted inference</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
