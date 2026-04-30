import type { OptimizationResult } from "@/lib/optimizations";

const fallbackStrategyPlan = [
  "Read the active wallet snapshot and detect supported balances.",
  "Rank the safest yield routes before suggesting any move.",
  "Surface the lead protocol together with lower-risk fallback options.",
  "Anchor the optimization output to 0G Storage for auditability.",
  "Publish the proof receipt and refresh the latest wallet snapshot.",
] as const;

export function buildStrategyPlan(
  latestResult: OptimizationResult | null | undefined,
) {
  if (!latestResult) {
    return [...fallbackStrategyPlan];
  }

  const primaryRoute = latestResult.recommended || "the lead route";
  const secondaryRoute = latestResult.top_protocols[1]?.name;
  const tertiaryRoute = latestResult.top_protocols[2]?.name;

  return [
    `Score the active wallet and prioritize ${primaryRoute} as the lead route.`,
    secondaryRoute
      ? `Keep ${secondaryRoute} ready as the next fallback if conditions change.`
      : "Keep a secondary fallback route ready if market conditions change.",
    tertiaryRoute
      ? `Track ${tertiaryRoute} as a lower-priority alternative, not an executed trade.`
      : "Limit the output to a proof-backed recommendation rather than an automatic trade.",
    `Apply ${latestResult.riskProfile.toLowerCase()}-risk guardrails before any manual execution.`,
    latestResult.proofRegistryProofId
      ? `Anchor the recommendation to 0G Storage and ProofRegistry entry #${latestResult.proofRegistryProofId}.`
      : "Anchor the recommendation to 0G Storage and refresh the proof receipt when available.",
  ];
}
