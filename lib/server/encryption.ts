import { ethers } from "ethers";

/**
 * Simple encryption helpers for strategy metadata
 * In production, use proper encryption libraries like tweetnacl or webcrypto
 */

/**
 * Generate a deterministic hash from strategy data
 */
export function hashStrategy(data: {
  portfolio: Record<string, number>;
  decision: {
    current_apy: number;
    optimized_apy: number;
    recommended: string;
    reasoning?: string;
  };
}): string {
  const dataStr = JSON.stringify(data, Object.keys(data).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(dataStr));
}

/**
 * Encrypt strategy data (placeholder - in production use proper encryption)
 * For now, we just encode to base64 to simulate encryption
 */
export function encryptStrategy(data: unknown): string {
  const dataStr = JSON.stringify(data);
  return Buffer.from(dataStr).toString("base64");
}

/**
 * Decrypt strategy data (placeholder)
 */
export function decryptStrategy(encrypted: string): unknown {
  const dataStr = Buffer.from(encrypted, "base64").toString("utf-8");
  return JSON.parse(dataStr);
}

/**
 * Generate attestation hash for TEE verification
 */
export function generateAttestationHash(
  contentHash: string,
  timestamp: number,
  provider: string
): string {
  return ethers.keccak256(
    ethers.solidityPacked(
      ["bytes32", "uint256", "string"],
      [contentHash, timestamp, provider]
    )
  );
}
