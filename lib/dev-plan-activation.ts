import { verifyMessage } from "ethers";

export const DEV_PLAN_ACTIVATION_TTL_MS = 10 * 60 * 1000;

export function buildPlanActivationMessage(input: {
  walletAddress: string;
  planId: string;
  planName: string;
  priceLabel: string;
  expiresAt: number;
}) {
  const normalizedWallet = input.walletAddress.toLowerCase();
  return [
    "YieldBoost Developer Package Activation",
    "",
    "Sign this message to activate a developer API package.",
    `Wallet: ${normalizedWallet}`,
    `Package: ${input.planName} (${input.planId})`,
    `Reference Price: ${input.priceLabel}`,
    `Expires At: ${new Date(input.expiresAt).toISOString()}`,
    "Domain: yieldboostai.xyz/dev",
  ].join("\n");
}

export function verifyPlanActivationSignature(input: {
  walletAddress: string;
  planId: string;
  planName: string;
  priceLabel: string;
  expiresAt: number;
  signature: string;
}) {
  if (!input.expiresAt || Date.now() > input.expiresAt) {
    throw new Error("The package activation signature has expired. Sign again.");
  }
  if (input.expiresAt - Date.now() > DEV_PLAN_ACTIVATION_TTL_MS) {
    throw new Error("The package activation signature window is invalid.");
  }

  const expected = buildPlanActivationMessage({
    walletAddress: input.walletAddress,
    planId: input.planId,
    planName: input.planName,
    priceLabel: input.priceLabel,
    expiresAt: input.expiresAt,
  });

  const recovered = verifyMessage(expected, input.signature);
  if (recovered.toLowerCase() !== input.walletAddress.toLowerCase()) {
    throw new Error("Package activation signature does not match the connected wallet.");
  }
}
