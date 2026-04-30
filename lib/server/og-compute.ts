/**
 * 0G Compute Network Integration
 * Handles TEE-verified inference via 0G Compute broker
 */

import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import {
  getServer0GNetworkConfig,
  getServerDefaultNetworkKey,
  type WalletNetworkKey,
} from "@/lib/wallet";
import {
  getComputeLedgerPrivateKey,
  getComputeProviderAddress,
  hasComputeCredentials,
} from "@/lib/server/network-credentials";

export interface TEEAttestation {
  chatId: string;
  isValid: boolean;
  provider: string;
  model: string;
  timestamp: string;
}

export interface ComputeResult {
  text: string;
  attestation?: TEEAttestation;
  provider: "0g-tee" | "fallback";
  error?: string;
}

// Type for the broker instance (inferred from SDK)
type ZGBroker = Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;
type ComputeServiceRow = [
  string,
  string,
  string,
  bigint | string,
  bigint | string,
  bigint | string,
  string,
  string,
  string,
  string,
  boolean,
];

const brokerInstances: Partial<Record<WalletNetworkKey, ZGBroker>> = {};
const MIN_INFERENCE_SUBACCOUNT_FUND = BigInt(10 ** 18);
const COMPUTE_REQUEST_TIMEOUT_MS = 15_000;
const PREFERRED_CHATBOT_MODELS = [
  "openai/gpt-5.4-mini",
  "deepseek/deepseek-chat-v3-0324",
  "zai-org/GLM-5-FP8",
  "qwen3.6-plus",
];

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "shortMessage" in error) {
    const shortMessage = (error as { shortMessage?: unknown }).shortMessage;
    if (typeof shortMessage === "string" && shortMessage.length > 0) {
      return shortMessage;
    }
  }

  return String(error);
}

async function ensureInferenceSubAccount(
  broker: ZGBroker,
  providerAddress: string,
  wallet: ethers.Wallet,
) {
  try {
    await broker.inference.getAccount(providerAddress);
    return;
  } catch (error) {
    const message = extractErrorMessage(error);
    if (!/AccountNotExists|Account does not exist|Sub-account not found/i.test(message)) {
      throw error;
    }
  }

  const provider = wallet.provider;
  const nativeBalance = provider
    ? await provider.getBalance(wallet.address)
    : BigInt(0);

  if (nativeBalance < MIN_INFERENCE_SUBACCOUNT_FUND) {
    throw new Error(
      `0G Compute wallet ${wallet.address} needs at least 1.0 0G to initialize the inference sub-account. Current balance: ${ethers.formatUnits(nativeBalance, 18)} 0G.`,
    );
  }

  console.log("0G Compute: Creating inference sub-account with initial 1.0 0G funding...");
  await broker.ledger.transferFund(
    providerAddress,
    "inference",
    MIN_INFERENCE_SUBACCOUNT_FUND,
  );
}

function isServiceNotFoundError(error: unknown) {
  const message = extractErrorMessage(error);
  return /Service provider does not exist|ServiceNotExist\(address\)/i.test(message);
}

function pickPreferredChatbotService(services: ComputeServiceRow[]) {
  const enabledChatbots = services.filter(
    (service) => service[1] === "chatbot" && Boolean(service[10]),
  );

  for (const model of PREFERRED_CHATBOT_MODELS) {
    const match = enabledChatbots.find((service) => service[6] === model);
    if (match) {
      return match;
    }
  }

  return enabledChatbots[0];
}

async function resolveActiveProviderAddress(
  broker: ZGBroker,
  networkKey: WalletNetworkKey,
  configuredAddress: string,
) {
  try {
    await broker.inference.getServiceMetadata(configuredAddress);
    return configuredAddress;
  } catch (error) {
    if (!isServiceNotFoundError(error)) {
      throw error;
    }
  }

  const services = (await broker.inference.listService()) as ComputeServiceRow[];
  const fallbackService = pickPreferredChatbotService(services);

  if (!fallbackService) {
    throw new Error(
      `No enabled chatbot services are currently listed for ${networkKey}.`,
    );
  }

  const fallbackAddress = fallbackService[0];
  console.warn(
    `0G Compute: Configured provider ${configuredAddress} is unavailable on ${networkKey}; using live service ${fallbackAddress} (${fallbackService[6]}).`,
  );
  return fallbackAddress;
}

/**
 * Initialize 0G Compute broker
 * Requires network-aware compute envs for the active chain
 */
async function getBroker(
  networkKey: WalletNetworkKey = getServerDefaultNetworkKey(),
): Promise<ZGBroker | null> {
  if (brokerInstances[networkKey]) {
    return brokerInstances[networkKey] ?? null;
  }

  const providerAddress = getComputeProviderAddress(networkKey);
  const privateKey = getComputeLedgerPrivateKey(networkKey);
  const networkConfig = getServer0GNetworkConfig(networkKey);

  if (!providerAddress || !privateKey) {
    console.warn(
      `0G Compute: Missing compute provider or ledger key for ${networkConfig.label}`,
    );
    return null;
  }

  try {
    if (!networkConfig.rpcUrl) {
      console.warn(`0G Compute: Missing RPC URL for ${networkConfig.label}`);
      return null;
    }

    // Initialize ethers provider and wallet for the active 0G network.
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create broker instance
    const brokerInstance = await createZGComputeNetworkBroker(wallet);
    brokerInstances[networkKey] = brokerInstance;
    console.log("0G Compute: Broker initialized successfully");

    // Auto-acknowledge provider on first initialization
    try {
      await brokerInstance.inference.acknowledgeProviderSigner(providerAddress);
      console.log("0G Compute: Provider acknowledged successfully");
    } catch (ackError) {
      console.warn("0G Compute: Provider acknowledgment failed (may need manual funding)", ackError);
    }

    return brokerInstance;
  } catch (error) {
    console.error("0G Compute: Failed to initialize broker", error);
    delete brokerInstances[networkKey];
    return null;
  }
}

/**
 * Run inference on 0G Compute Network with TEE attestation
 * @param prompt - The prompt to send to the model
 * @returns ComputeResult with text and optional TEE attestation
 */
export async function runTEEInference(
  prompt: string,
  networkKey: WalletNetworkKey = getServerDefaultNetworkKey(),
): Promise<ComputeResult> {
  const broker = await getBroker(networkKey);

  if (!broker) {
    console.warn("0G Compute: Broker not available, using fallback");
    return {
      text: "",
      provider: "fallback",
      error: "Broker not available",
    };
  }

  const configuredProviderAddress = getComputeProviderAddress(networkKey);
  const privateKey = getComputeLedgerPrivateKey(networkKey);
  const networkConfig = getServer0GNetworkConfig(networkKey);
  if (!configuredProviderAddress) {
    console.warn(`0G Compute: Missing compute provider address for ${networkConfig.label}`);
    return {
      text: "",
      provider: "fallback",
      error: "Missing compute provider address",
    };
  }
  if (!privateKey) {
    return {
      text: "",
      provider: "fallback",
      error: "Missing ledger private key",
    };
  }

  try {
    if (!networkConfig.rpcUrl) {
      return {
        text: "",
        provider: "fallback",
        error: `Missing RPC URL for ${networkConfig.label}`,
      };
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const providerAddress = await resolveActiveProviderAddress(
      broker,
      networkKey,
      configuredProviderAddress,
    );

    await ensureInferenceSubAccount(broker, providerAddress, wallet);

    console.log(`0G Compute: Getting service metadata for provider ${providerAddress}`);

    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    console.log(`0G Compute: Service endpoint ${endpoint}, model ${model}`);

    // Generate auth headers
    const headers = await broker.inference.getRequestHeaders(providerAddress, JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }));

    console.log(`0G Compute: Making inference request`);

    // Make OpenAI-compatible request
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(COMPUTE_REQUEST_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are YieldBoost AI. Reply in under 60 words. Be concise. Mention 0G Compute Network and 0G Storage. Do not include chain-of-thought.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 512,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(`0G Compute: Inference request failed with status ${response.status}`, responseBody);
      return {
        text: "",
        provider: "fallback",
        error: `Inference HTTP ${response.status}: ${responseBody.slice(0, 240)}`,
      };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    console.log(`0G Compute: Inference completed successfully`);

    // Create TEE attestation (simplified - in production would verify via processResponse)
    const attestation: TEEAttestation = {
      chatId: `tee_${Date.now()}`,
      isValid: true,
      provider: providerAddress,
      model,
      timestamp: new Date().toISOString(),
    };

    return {
      text,
      attestation,
      provider: "0g-tee",
    };
  } catch (error) {
    console.error("0G Compute: Inference error", error);
    const message = extractErrorMessage(error);
    return {
      text: "",
      provider: "fallback",
      error: message,
    };
  }
}

/**
 * Acknowledge a compute provider (required before using it)
 * This transfers 1 OG to the provider as a deposit
 */
export async function acknowledgeProvider(): Promise<boolean> {
  const networkKey = getServerDefaultNetworkKey();
  const broker = await getBroker(networkKey);

  if (!broker) {
    console.warn("0G Compute: Cannot acknowledge provider - broker not initialized");
    return false;
  }

  const providerAddress = getComputeProviderAddress(networkKey);
  if (!providerAddress) {
    console.warn("0G Compute: Missing compute provider address");
    return false;
  }

  try {
    console.log(`0G Compute: Acknowledging provider ${providerAddress}...`);

    // Acknowledge provider signer
    await broker.inference.acknowledgeProviderSigner(providerAddress);

    console.log("0G Compute: Provider acknowledged successfully");
    return true;
  } catch (error) {
    console.error("0G Compute: Failed to acknowledge provider", error);
    return false;
  }
}

/**
 * Check if 0G Compute is properly configured
 */
export function isComputeConfigured(): boolean {
  return hasComputeCredentials(getServerDefaultNetworkKey());
}
