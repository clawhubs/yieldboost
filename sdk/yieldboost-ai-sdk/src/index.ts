export type YieldBoostNetwork = "testnet" | "mainnet";
export type YieldBoostSignatureKind = "eip191" | "eip712";
export type YieldBoostOperation = "seal" | "unseal";

export interface YieldBoostClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface YieldBoostChallengeRequest {
  operation: YieldBoostOperation;
  walletAddress: string;
  network?: YieldBoostNetwork;
  storageId?: string;
}

export interface YieldBoostChallengeResponse {
  success: boolean;
  request_id: string;
  challenge_id: string;
  operation: YieldBoostOperation;
  network: YieldBoostNetwork;
  wallet_address: string;
  storage_id: string | null;
  message: string;
  issued_at: string;
  expires_at: string;
}

export interface YieldBoostSealRequest {
  walletAddress: string;
  signature: string;
  message: string;
  plaintext?: string;
  fileName?: string;
  fileContentBase64?: string;
  mimeType?: string;
  network?: YieldBoostNetwork;
  challengeId?: string;
  signatureKind?: YieldBoostSignatureKind;
  transactionHash?: string;
  metadata?: Record<string, unknown>;
  typedData?: Record<string, unknown>;
}

export interface YieldBoostSealResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostNetwork;
  storage_id: string;
  storage_root_hash: string | null;
  storage_tx_hash: string | null;
  storage_explorer_url: string | null;
  integrity_hash: string;
  judge_url: string;
  anchor_tx_hash: string | null;
  anchor_explorer_url: string | null;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostUnsealRequest {
  walletAddress: string;
  storageId: string;
  signature: string;
  message: string;
  network?: YieldBoostNetwork;
  challengeId?: string;
  signatureKind?: YieldBoostSignatureKind;
  typedData?: Record<string, unknown>;
}

export interface YieldBoostUnsealResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostNetwork;
  storage_id: string;
  integrity_hash: string;
  plaintext: string | null;
  file_name: string | null;
  file_content_base64: string | null;
  mime_type: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostVaultMetadataResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostNetwork;
  storage_id: string;
  storage_root_hash: string | null;
  storage_tx_hash: string | null;
  storage_explorer_url: string | null;
  wallet_address: string;
  integrity_hash: string;
  payload_sha256: string;
  mime_type: string;
  file_name: string | null;
  storage_uri: string | null;
  storage_mode: string | null;
  anchor_tx_hash: string | null;
  anchor_explorer_url: string | null;
  anchor_mode: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  last_unsealed_at: string | null;
}

export interface YieldBoostVaultListItem {
  storage_id: string;
  network: YieldBoostNetwork;
  wallet_address: string;
  integrity_hash: string;
  payload_sha256: string;
  mime_type: string;
  file_name: string | null;
  storage_root_hash: string | null;
  storage_tx_hash: string | null;
  storage_explorer_url: string | null;
  anchor_tx_hash: string | null;
  anchor_explorer_url: string | null;
  created_at: string;
  last_unsealed_at: string | null;
  layer_statuses: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface YieldBoostVaultListResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostNetwork | null;
  wallet_address: string;
  items: YieldBoostVaultListItem[];
  total: number;
}

export interface YieldBoostHealthResponse {
  [key: string]: unknown;
}

export interface YieldBoostBlacklistResponse {
  success: boolean;
  request_id: string;
  allowed: boolean;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostAuditResponse {
  success: boolean;
  request_id: string;
  payload_sha256: string;
  payload_size_bytes: number;
  mime_type: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostProofResponse {
  success: boolean;
  request_id: string;
  integrity_hash: string;
  verified: boolean;
  proof_type: string;
  envelope: Record<string, unknown>;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostGovernanceResponse {
  success: boolean;
  request_id: string;
  allowed: boolean;
  risk_score: number;
  status: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostHandshakeResponse {
  success: boolean;
  request_id: string;
  subject_id: string;
  operation: string;
  status: string;
  timestamp: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostLayerStatusResponse {
  success: boolean;
  request_id: string;
  active_network: YieldBoostNetwork;
  infrastructure: Record<string, unknown>;
  layers: Record<string, unknown>;
}

export interface Eip1193Provider {
  request(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }): Promise<unknown>;
}

export interface MessageSigner {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
}

const DEFAULT_BASE_URL = "https://api.yieldboostai.xyz";

export class YieldBoostApiError extends Error {
  status: number;
  requestId?: string;
  detail?: unknown;

  constructor(message: string, options: { status: number; requestId?: string; detail?: unknown }) {
    super(message);
    this.name = "YieldBoostApiError";
    this.status = options.status;
    this.requestId = options.requestId;
    this.detail = options.detail;
  }
}

export class YieldBoostClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: YieldBoostClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new Error("apiKey is required.");
    }

    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = options.fetch || fetch;
  }

  async createChallenge(input: YieldBoostChallengeRequest): Promise<YieldBoostChallengeResponse> {
    return this.request<YieldBoostChallengeResponse>("/v1/auth/challenge", {
      method: "POST",
      body: JSON.stringify({
        operation: input.operation,
        network: input.network,
        wallet_address: input.walletAddress,
        storage_id: input.storageId,
      }),
    });
  }

  async seal(input: YieldBoostSealRequest): Promise<YieldBoostSealResponse> {
    return this.request<YieldBoostSealResponse>("/v1/integrity/seal", {
      method: "POST",
      body: JSON.stringify({
        network: input.network,
        challenge_id: input.challengeId,
        wallet_address: input.walletAddress,
        signature: input.signature,
        signature_kind: input.signatureKind || "eip191",
        message: input.message,
        typed_data: input.typedData,
        plaintext: input.plaintext,
        file_name: input.fileName,
        file_content_base64: input.fileContentBase64,
        mime_type: input.mimeType || "text/plain",
        transaction_hash: input.transactionHash,
        metadata: input.metadata || {},
      }),
    });
  }

  async unseal(input: YieldBoostUnsealRequest): Promise<YieldBoostUnsealResponse> {
    return this.request<YieldBoostUnsealResponse>("/v1/integrity/unseal", {
      method: "POST",
      body: JSON.stringify({
        network: input.network,
        challenge_id: input.challengeId,
        wallet_address: input.walletAddress,
        signature: input.signature,
        signature_kind: input.signatureKind || "eip191",
        message: input.message,
        typed_data: input.typedData,
        storage_id: input.storageId,
      }),
    });
  }

  async getMetadata(storageId: string): Promise<YieldBoostVaultMetadataResponse> {
    return this.request<YieldBoostVaultMetadataResponse>(
      `/v1/integrity/${encodeURIComponent(storageId)}/metadata`,
      { method: "GET" },
    );
  }

  async listVaults(input: {
    walletAddress: string;
    network?: YieldBoostNetwork;
  }): Promise<YieldBoostVaultListResponse> {
    const search = new URLSearchParams({
      wallet_address: input.walletAddress,
    });
    if (input.network) {
      search.set("network", input.network);
    }

    return this.request<YieldBoostVaultListResponse>(`/v1/integrity/records?${search.toString()}`, {
      method: "GET",
    });
  }

  async health(): Promise<YieldBoostHealthResponse> {
    return this.request<YieldBoostHealthResponse>("/v1/health", { method: "GET" }, false);
  }

  async blacklistCheck(text: string): Promise<YieldBoostBlacklistResponse> {
    return this.request<YieldBoostBlacklistResponse>("/v1/blacklist/check", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async auditEvaluate(input: {
    plaintext?: string;
    fileContentBase64?: string;
    mimeType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<YieldBoostAuditResponse> {
    return this.request<YieldBoostAuditResponse>("/v1/audit/evaluate", {
      method: "POST",
      body: JSON.stringify({
        plaintext: input.plaintext,
        file_content_base64: input.fileContentBase64,
        mime_type: input.mimeType || "text/plain",
        metadata: input.metadata || {},
      }),
    });
  }

  async proofRun(input: {
    commitment: Record<string, unknown>;
    integrityHash?: string;
  }): Promise<YieldBoostProofResponse> {
    return this.request<YieldBoostProofResponse>("/v1/proof/run", {
      method: "POST",
      body: JSON.stringify({
        commitment: input.commitment,
        integrity_hash: input.integrityHash,
      }),
    });
  }

  async governanceEvaluate(input: {
    walletAddress?: string;
    recentRequestCount?: number;
  }): Promise<YieldBoostGovernanceResponse> {
    return this.request<YieldBoostGovernanceResponse>("/v1/governance/evaluate", {
      method: "POST",
      body: JSON.stringify({
        wallet_address: input.walletAddress,
        recent_request_count: input.recentRequestCount || 0,
      }),
    });
  }

  async handshakeLog(input: {
    subjectId: string;
    operation: string;
    walletAddress?: string;
    metadata?: Record<string, unknown>;
  }): Promise<YieldBoostHandshakeResponse> {
    return this.request<YieldBoostHandshakeResponse>("/v1/handshake/log", {
      method: "POST",
      body: JSON.stringify({
        subject_id: input.subjectId,
        operation: input.operation,
        wallet_address: input.walletAddress,
        metadata: input.metadata || {},
      }),
    });
  }

  async layerStatus(): Promise<YieldBoostLayerStatusResponse> {
    return this.request<YieldBoostLayerStatusResponse>("/v1/status/layers", {
      method: "GET",
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    withApiKey = true,
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(withApiKey ? { "X-API-Key": this.apiKey } : {}),
        ...(init.headers || {}),
      },
    });

    const text = await response.text();
    const payload = text ? safeParseJson(text) : null;

    if (!response.ok) {
      const message =
        isObject(payload) && typeof payload.error === "string"
          ? payload.error
          : `YieldBoost API request failed with status ${response.status}.`;
      throw new YieldBoostApiError(message, {
        status: response.status,
        requestId:
          isObject(payload) && typeof payload.request_id === "string"
            ? payload.request_id
            : undefined,
        detail: payload,
      });
    }

    return payload as T;
  }
}

export async function requestBrowserWalletAddress(provider: Eip1193Provider): Promise<string> {
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!Array.isArray(accounts) || !accounts[0]) {
    throw new Error("Wallet provider did not return an address.");
  }

  return accounts[0];
}

export async function signPersonalMessage(
  provider: Eip1193Provider,
  walletAddress: string,
  message: string,
): Promise<string> {
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, walletAddress],
  });

  if (typeof signature !== "string" || !signature) {
    throw new Error("Wallet provider did not return a signature.");
  }

  return signature;
}

export async function sealWithBrowserWallet(
  client: YieldBoostClient,
  input: {
    provider: Eip1193Provider;
    network?: YieldBoostNetwork;
    walletAddress?: string;
    plaintext?: string;
    fileName?: string;
    fileContentBase64?: string;
    mimeType?: string;
    transactionHash?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<YieldBoostSealResponse> {
  const walletAddress = input.walletAddress || (await requestBrowserWalletAddress(input.provider));
  const challenge = await client.createChallenge({
    operation: "seal",
    walletAddress,
    network: input.network,
  });
  const signature = await signPersonalMessage(input.provider, walletAddress, challenge.message);

  return client.seal({
    walletAddress,
    challengeId: challenge.challenge_id,
    message: challenge.message,
    signature,
    signatureKind: "eip191",
    network: challenge.network,
    plaintext: input.plaintext,
    fileName: input.fileName,
    fileContentBase64: input.fileContentBase64,
    mimeType: input.mimeType,
    transactionHash: input.transactionHash,
    metadata: input.metadata,
  });
}

export async function unsealWithBrowserWallet(
  client: YieldBoostClient,
  input: {
    provider: Eip1193Provider;
    storageId: string;
    network?: YieldBoostNetwork;
    walletAddress?: string;
  },
): Promise<YieldBoostUnsealResponse> {
  const walletAddress = input.walletAddress || (await requestBrowserWalletAddress(input.provider));
  const challenge = await client.createChallenge({
    operation: "unseal",
    walletAddress,
    network: input.network,
    storageId: input.storageId,
  });
  const signature = await signPersonalMessage(input.provider, walletAddress, challenge.message);

  return client.unseal({
    walletAddress,
    storageId: input.storageId,
    challengeId: challenge.challenge_id,
    message: challenge.message,
    signature,
    signatureKind: "eip191",
    network: challenge.network,
  });
}

export async function sealWithSigner(
  client: YieldBoostClient,
  signer: MessageSigner,
  input: {
    network?: YieldBoostNetwork;
    plaintext?: string;
    fileName?: string;
    fileContentBase64?: string;
    mimeType?: string;
    transactionHash?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<YieldBoostSealResponse> {
  const walletAddress = await signer.getAddress();
  const challenge = await client.createChallenge({
    operation: "seal",
    walletAddress,
    network: input.network,
  });
  const signature = await signer.signMessage(challenge.message);

  return client.seal({
    walletAddress,
    challengeId: challenge.challenge_id,
    message: challenge.message,
    signature,
    signatureKind: "eip191",
    network: challenge.network,
    plaintext: input.plaintext,
    fileName: input.fileName,
    fileContentBase64: input.fileContentBase64,
    mimeType: input.mimeType,
    transactionHash: input.transactionHash,
    metadata: input.metadata,
  });
}

export async function unsealWithSigner(
  client: YieldBoostClient,
  signer: MessageSigner,
  input: {
    storageId: string;
    network?: YieldBoostNetwork;
  },
): Promise<YieldBoostUnsealResponse> {
  const walletAddress = await signer.getAddress();
  const challenge = await client.createChallenge({
    operation: "unseal",
    walletAddress,
    network: input.network,
    storageId: input.storageId,
  });
  const signature = await signer.signMessage(challenge.message);

  return client.unseal({
    walletAddress,
    storageId: input.storageId,
    challengeId: challenge.challenge_id,
    message: challenge.message,
    signature,
    signatureKind: "eip191",
    network: challenge.network,
  });
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
