import "server-only";

import { createHash } from "node:crypto";

const DEFAULT_PROMPT = "Optimize my portfolio for best yield with low risk.";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function pickIntentLabel(prompt: string) {
  const lowered = prompt.toLowerCase();

  if (/stable|stability|drawdown|defensive|safe|safer|low risk/.test(lowered)) {
    return "low-risk yield optimization";
  }

  if (/rebalance|rotate|shift|move/.test(lowered)) {
    return "portfolio rebalance for higher yield";
  }

  if (/highest|max|maximize|aggressive|best yield/.test(lowered)) {
    return "maximum yield optimization";
  }

  return "balanced yield optimization";
}

function pickConstraintLabel(prompt: string) {
  const lowered = prompt.toLowerCase();

  if (/low risk|safe|safer|defensive/.test(lowered)) {
    return "preserve downside protection";
  }

  if (/stablecoin|usdc|liquidity/.test(lowered)) {
    return "keep liquidity available";
  }

  if (/mainnet/.test(lowered)) {
    return "use active mainnet route";
  }

  return "prioritize efficient APY lift";
}

function formatHoldingValue(value: number) {
  if (value >= 1000) {
    return value.toFixed(0);
  }

  if (value >= 1) {
    return value.toFixed(2);
  }

  return value.toFixed(4);
}

function buildPortfolioHash(portfolio: Record<string, number>) {
  const normalized = Object.entries(portfolio)
    .filter(([, value]) => value > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

export interface CompressedOptimizationInput {
  normalizedPrompt: string;
  compactPrompt: string;
  promptDigest: string;
  portfolioDigest: string;
  portfolioSummary: string;
  portfolioSignature: string;
  requestDocument: string;
}

export function compressOptimizationInput(
  portfolio: Record<string, number>,
  prompt?: string,
): CompressedOptimizationInput {
  const sanitizedPrompt = normalizeWhitespace(prompt || DEFAULT_PROMPT).slice(0, 240);
  const normalizedPrompt = sanitizedPrompt || DEFAULT_PROMPT;
  const promptDigest = createHash("sha256")
    .update(normalizedPrompt.toLowerCase())
    .digest("hex");

  const sortedHoldings = Object.entries(portfolio)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1]);

  const topHoldings = sortedHoldings
    .slice(0, 5)
    .map(([symbol, value]) => `${symbol}:${formatHoldingValue(value)}`)
    .join(" | ");

  const totalValue = sortedHoldings.reduce((sum, [, value]) => sum + value, 0);
  const portfolioSummary = sortedHoldings.length > 0
    ? `Total ${formatHoldingValue(totalValue)}; Holdings ${topHoldings}`
    : "Total 0; Holdings none";

  const portfolioSignature = sortedHoldings
    .map(([symbol]) => symbol)
    .join("|") || "empty";

  const intent = pickIntentLabel(normalizedPrompt);
  const constraint = pickConstraintLabel(normalizedPrompt);

  const compactPrompt = normalizeWhitespace(
    [
      `Intent: ${intent}.`,
      `Constraint: ${constraint}.`,
      `Portfolio: ${portfolioSummary}.`,
      `User request: ${normalizedPrompt}.`,
    ].join(" "),
  );

  return {
    normalizedPrompt,
    compactPrompt,
    promptDigest,
    portfolioDigest: buildPortfolioHash(portfolio),
    portfolioSummary,
    portfolioSignature,
    requestDocument: `${compactPrompt} Signature: ${portfolioSignature}.`,
  };
}
