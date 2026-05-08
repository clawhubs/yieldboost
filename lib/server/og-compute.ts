/**
 * 0G Compute Network Integration
 * Handles TEE-verified inference via 0G Compute broker
 */

import { ethers } from "ethers";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createZGComputeNetworkBroker,
  InferenceVerifier,
} from "@0glabs/0g-serving-broker";
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
  verificationMethod: "broker-response-signature" | "service-attestation-report";
  signedTextMatches: boolean;
  serviceAttestationVerified?: boolean;
  serviceSignerMatched?: boolean;
  serviceComposeVerified?: boolean;
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

interface CandidateProvider {
  address: string;
}

const brokerInstances: Partial<Record<WalletNetworkKey, ZGBroker>> = {};
const serviceAttestationCache = new Map<
  string,
  {
    checkedAt: number;
    result: {
      success: boolean;
      signerMatched: boolean;
      composeVerified: boolean;
    };
  }
>();
const DEFAULT_INFERENCE_SUBACCOUNT_FUND = ethers.parseEther("1.0");
const COMPUTE_REQUEST_TIMEOUT_MS = 15_000;
const TEE_SIGNATURE_RETRY_COUNT = 8;
const TEE_SIGNATURE_RETRY_DELAY_MS = 2_000;
const SERVICE_ATTESTATION_CACHE_TTL_MS = 10 * 60_000;
const PREFERRED_CHATBOT_MODELS = [
  "openai/gpt-5.4-mini",
  "deepseek/deepseek-chat-v3-0324",
  "zai-org/GLM-5-FP8",
  "qwen3.6-plus",
];

function normalizeSignedText(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function usesOpenAIChatCompletionRules(model: string) {
  return /^openai\/gpt-/i.test(model);
}

function buildChatCompletionPayload(model: string, prompt: string) {
  const messages = [
    {
      role: "system",
      content:
        "You are YieldBoost AI. Reply in under 60 words. Be concise. Mention 0G Compute Network and 0G Storage. Do not include chain-of-thought.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  if (usesOpenAIChatCompletionRules(model)) {
    return {
      model,
      messages,
      max_completion_tokens: 512,
    };
  }

  return {
    model,
    messages,
    max_tokens: 512,
    temperature: 0.2,
  };
}

function getBrokerBaseUrl(endpoint: string) {
  return endpoint.replace(/\/v1\/proxy\/?$/, "");
}

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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getInferenceSubAccountFund() {
  const configuredAmount = process.env.YB_COMPUTE_SUBACCOUNT_FUND_OG?.trim();
  if (!configuredAmount) {
    return DEFAULT_INFERENCE_SUBACCOUNT_FUND;
  }

  try {
    const amount = ethers.parseEther(configuredAmount);
    return amount > BigInt(0) ? amount : DEFAULT_INFERENCE_SUBACCOUNT_FUND;
  } catch {
    console.warn(
      `0G Compute: Invalid YB_COMPUTE_SUBACCOUNT_FUND_OG=${configuredAmount}; using 1.0 0G.`,
    );
    return DEFAULT_INFERENCE_SUBACCOUNT_FUND;
  }
}

function canAutoFundInferenceSubAccount(networkKey: WalletNetworkKey) {
  return (
    networkKey !== "mainnet" ||
    process.env.YB_ALLOW_MAINNET_COMPUTE_FUNDING === "true"
  );
}

async function verifyServiceAttestation(
  broker: ZGBroker,
  providerAddress: string,
) {
  const cached = serviceAttestationCache.get(providerAddress.toLowerCase());
  if (
    cached &&
    Date.now() - cached.checkedAt < SERVICE_ATTESTATION_CACHE_TTL_MS
  ) {
    return cached.result;
  }

  const outputDir = path.join(
    os.tmpdir(),
    `yieldboost-tee-${providerAddress.slice(2, 10)}-${Date.now()}`,
  );

  try {
    await fs.mkdir(outputDir, { recursive: true });
    const result = await broker.inference.verifyService(providerAddress, outputDir);
    if (!result) {
      throw new Error("TEE service verifier returned an empty result.");
    }
    const signerMatched = Boolean(result.signerVerification?.allMatch);
    const composeVerified = Boolean(result.composeVerification?.passed);
    const verification = {
      success: Boolean(result.success && signerMatched && composeVerified),
      signerMatched,
      composeVerified,
    };
    serviceAttestationCache.set(providerAddress.toLowerCase(), {
      checkedAt: Date.now(),
      result: verification,
    });
    return verification;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.warn("0G Compute: service attestation verification failed", message);
    return {
      success: false,
      signerMatched: false,
      composeVerified: false,
    };
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function ensureInferenceSubAccount(
  broker: ZGBroker,
  providerAddress: string,
  wallet: ethers.Wallet,
  networkKey: WalletNetworkKey,
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

  if (!canAutoFundInferenceSubAccount(networkKey)) {
    throw new Error(
      `0G Compute mainnet sub-account is missing for provider ${providerAddress}. ` +
        "Auto-funding is disabled. Set YB_ALLOW_MAINNET_COMPUTE_FUNDING=true and " +
        "YB_COMPUTE_SUBACCOUNT_FUND_OG to an explicit small amount if you want to fund it.",
    );
  }

  const provider = wallet.provider;
  const subAccountFund = getInferenceSubAccountFund();
  const nativeBalance = provider
    ? await provider.getBalance(wallet.address)
    : BigInt(0);

  if (nativeBalance < subAccountFund) {
    throw new Error(
      `0G Compute wallet ${wallet.address} needs at least ${ethers.formatEther(subAccountFund)} 0G to initialize the inference sub-account. Current balance: ${ethers.formatUnits(nativeBalance, 18)} 0G.`,
    );
  }

  console.log(
    `0G Compute: Creating inference sub-account with initial ${ethers.formatEther(subAccountFund)} 0G funding...`,
  );
  await broker.ledger.transferFund(
    providerAddress,
    "inference",
    subAccountFund,
  );
}

async function prepareInferenceProvider(
  broker: ZGBroker,
  providerAddress: string,
  wallet: ethers.Wallet,
  networkKey: WalletNetworkKey,
) {
  await ensureInferenceSubAccount(broker, providerAddress, wallet, networkKey);
  await broker.inference.acknowledgeProviderSigner(providerAddress);
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

function getOrderedCandidateProviders(
  services: ComputeServiceRow[],
  preferredAddress?: string,
) {
  const enabledChatbots = services.filter(
    (service) => service[1] === "chatbot" && Boolean(service[10]),
  );
  const ordered: CandidateProvider[] = [];
  const seen = new Set<string>();

  function push(service: ComputeServiceRow | undefined) {
    if (!service) return;
    const address = service[0];
    if (seen.has(address)) return;
    seen.add(address);
    ordered.push({
      address,
    });
  }

  if (preferredAddress) {
    push(enabledChatbots.find((service) => service[0] === preferredAddress));
  }

  for (const model of PREFERRED_CHATBOT_MODELS) {
    push(enabledChatbots.find((service) => service[6] === model));
  }

  for (const service of enabledChatbots) {
    push(service);
  }

  return ordered.slice(0, 4);
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

async function resolveCandidateProviders(
  broker: ZGBroker,
  networkKey: WalletNetworkKey,
  configuredAddress: string,
) {
  const services = (await broker.inference.listService()) as ComputeServiceRow[];
  const preferredAddress = await resolveActiveProviderAddress(
    broker,
    networkKey,
    configuredAddress,
  );

  return getOrderedCandidateProviders(services, preferredAddress);
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
    const candidateProviders = await resolveCandidateProviders(
      broker,
      networkKey,
      configuredProviderAddress,
    );
    let lastInferenceError = "No compute providers were available.";

    for (let index = 0; index < candidateProviders.length; index += 1) {
      const candidateProvider = candidateProviders[index];
      const providerAddress = candidateProvider.address;

      try {
        await prepareInferenceProvider(broker, providerAddress, wallet, networkKey);

        console.log(`0G Compute: Getting service metadata for provider ${providerAddress}`);
        const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
        console.log(`0G Compute: Service endpoint ${endpoint}, model ${model}`);

        const requestBody = JSON.stringify(
          buildChatCompletionPayload(model, prompt),
        );

        const headers = await broker.inference.getRequestHeaders(
          providerAddress,
          requestBody,
        );

        console.log(`0G Compute: Making inference request via ${providerAddress}`);
        const response = await fetch(`${endpoint}/chat/completions`, {
          method: "POST",
          signal: AbortSignal.timeout(COMPUTE_REQUEST_TIMEOUT_MS),
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: requestBody,
        });

        if (!response.ok) {
          const responseBody = await response.text();
          lastInferenceError = `Inference HTTP ${response.status}: ${responseBody.slice(0, 240)}`;
          console.error(
            `0G Compute: Inference request failed for provider ${providerAddress} with status ${response.status}`,
            responseBody,
          );
          continue;
        }

        const data = await response.json();
        const completionId = typeof data.id === "string" ? data.id : "";
        const responseKey = response.headers.get("ZG-Res-Key") ?? "";
        const chatId = responseKey || completionId;
        const text = data.choices?.[0]?.message?.content || "";

        if (!text) {
          lastInferenceError = `Provider ${providerAddress} returned an empty response body.`;
          continue;
        }

        console.log(`0G Compute: Inference completed successfully`);

        let attestation: TEEAttestation | undefined;
        if (chatId) {
          let signatureVerified = false;
          let signedTextMatches = false;
          const usageContent = data.usage
            ? JSON.stringify({
                input_tokens:
                  data.usage.prompt_tokens ?? data.usage.input_tokens ?? 0,
                output_tokens:
                  data.usage.completion_tokens ?? data.usage.output_tokens ?? 0,
              })
            : undefined;

          for (let attempt = 1; attempt <= TEE_SIGNATURE_RETRY_COUNT; attempt += 1) {
            try {
              const verificationResult = await broker.inference.processResponse(
                providerAddress,
                chatId,
                usageContent,
              );
              signatureVerified = verificationResult === true;
            } catch (verificationError) {
              if (attempt === TEE_SIGNATURE_RETRY_COUNT) {
                console.warn("0G Compute: broker response verification failed", verificationError);
              }
            }

            try {
              const responseSignature = await InferenceVerifier.fetchSignatureByChatID(
                getBrokerBaseUrl(endpoint),
                chatId,
                model,
              );
              signedTextMatches =
                normalizeSignedText(responseSignature.text) ===
                  normalizeSignedText(text) ||
                responseSignature.text.includes(sha256Hex(requestBody)) ||
                signatureVerified;
            } catch (signatureLookupError) {
              if (attempt === TEE_SIGNATURE_RETRY_COUNT) {
                console.warn("0G Compute: signature lookup failed", signatureLookupError);
              }
            }

            if (signatureVerified && signedTextMatches) {
              break;
            }

            if (attempt < TEE_SIGNATURE_RETRY_COUNT) {
              await wait(TEE_SIGNATURE_RETRY_DELAY_MS);
            }
          }

          const responseSignatureVerified = signatureVerified && signedTextMatches;
          const serviceAttestation = responseSignatureVerified
            ? {
                success: false,
                signerMatched: false,
                composeVerified: false,
              }
            : await verifyServiceAttestation(broker, providerAddress);

          attestation = {
            chatId,
            isValid: responseSignatureVerified || serviceAttestation.success,
            provider: providerAddress,
            model,
            timestamp: new Date().toISOString(),
            verificationMethod: responseSignatureVerified
              ? "broker-response-signature"
              : "service-attestation-report",
            signedTextMatches,
            serviceAttestationVerified: serviceAttestation.success,
            serviceSignerMatched: serviceAttestation.signerMatched,
            serviceComposeVerified: serviceAttestation.composeVerified,
          };
        }

        return {
          text,
          attestation,
          provider: "0g-tee",
        };
      } catch (candidateError) {
        lastInferenceError = extractErrorMessage(candidateError);
        console.warn(
          `0G Compute: candidate provider ${providerAddress} failed`,
          candidateError,
        );
      }
    }

    return {
      text: "",
      provider: "fallback",
      error: lastInferenceError,
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
