import "server-only";

import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroHash,
  type LogDescription,
} from "ethers";
import {
  getServer0GNetworkConfig,
  type WalletNetworkKey,
} from "@/lib/wallet";

const proofRegistryAbi = [
  "event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)",
  "function recordProof(string cid, bytes32 rootHash, bytes32 storageTxHash, uint256 currentApyBps, uint256 optimizedApyBps) external returns (uint256 proofId)",
] as const;

const globalBackendSignerState = globalThis as typeof globalThis & {
  __yieldboostBackendSignerQueues?: Map<string, BackendSignerQueueState>;
};

type BackendSignerQueuePriority = "high" | "normal";

interface BackendSignerQueueTask {
  id: number;
  priority: BackendSignerQueuePriority;
  run: (input: {
    config: ReturnType<typeof getServer0GNetworkConfig>;
    provider: JsonRpcProvider;
    signer: Wallet;
  }) => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface BackendSignerQueueState {
  running: boolean;
  sequence: number;
  tasks: BackendSignerQueueTask[];
}

function getBackendSignerQueues() {
  if (!globalBackendSignerState.__yieldboostBackendSignerQueues) {
    globalBackendSignerState.__yieldboostBackendSignerQueues = new Map();
  }

  return globalBackendSignerState.__yieldboostBackendSignerQueues;
}

function getBackendSignerQueueKey(networkKey: WalletNetworkKey, privateKey: string) {
  return `${networkKey}:${privateKey.toLowerCase()}`;
}

export async function withBackendSignerQueue<T>(
  networkKey: WalletNetworkKey,
  task: (input: {
    config: ReturnType<typeof getServer0GNetworkConfig>;
    provider: JsonRpcProvider;
    signer: Wallet;
  }) => Promise<T>,
  options?: {
    priority?: BackendSignerQueuePriority;
  },
) {
  const config = getServer0GNetworkConfig(networkKey);

  if (!config.rpcUrl || !config.privateKey) {
    throw new Error(
      "0G backend signer is not configured. Set the RPC URL and private key for this network.",
    );
  }

  const queues = getBackendSignerQueues();
  const queueKey = getBackendSignerQueueKey(networkKey, config.privateKey);
  const state =
    queues.get(queueKey) ??
    (() => {
      const nextState: BackendSignerQueueState = {
        running: false,
        sequence: 0,
        tasks: [],
      };
      queues.set(queueKey, nextState);
      return nextState;
    })();

  const priority = options?.priority ?? "normal";

  return await new Promise<T>((resolve, reject) => {
    const nextTask: BackendSignerQueueTask = {
      id: ++state.sequence,
      priority,
      run: task as BackendSignerQueueTask["run"],
      resolve: (value) => resolve(value as T),
      reject: (reason) => reject(reason),
    };

    state.tasks.push(nextTask);
    state.tasks.sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority === "high" ? -1 : 1;
      }
      return left.id - right.id;
    });

    if (!state.running) {
      state.running = true;
      void drainBackendSignerQueue(queueKey, state, config);
    }
  });
}

async function drainBackendSignerQueue(
  queueKey: string,
  state: BackendSignerQueueState,
  config: ReturnType<typeof getServer0GNetworkConfig>,
) {
  const queues = getBackendSignerQueues();

  while (state.tasks.length > 0) {
    const nextTask = state.tasks.shift();
    if (!nextTask) {
      continue;
    }

    try {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const signer = new Wallet(config.privateKey!, provider);
      const result = await nextTask.run({ config, provider, signer });
      nextTask.resolve(result);
    } catch (error) {
      nextTask.reject(error);
    }
  }

  state.running = false;
  if (state.tasks.length === 0) {
    queues.delete(queueKey);
  }
}

export async function waitForTransactionReceipt(
  provider: JsonRpcProvider,
  txHash: string | undefined,
  timeoutMs = 45_000,
) {
  if (!txHash) {
    return null;
  }

  try {
    return await provider.waitForTransaction(txHash, 1, timeoutMs);
  } catch {
    try {
      return await provider.getTransactionReceipt(txHash);
    } catch {
      return null;
    }
  }
}

function asBytes32(value: string | undefined) {
  return value && /^0x[a-fA-F0-9]{64}$/.test(value) ? value : undefined;
}

export async function recordProofRegistryAnchor(input: {
  networkKey: WalletNetworkKey;
  cid: string;
  rootHash?: string;
  storageTxHash?: string;
  currentApyBps?: number;
  optimizedApyBps?: number;
  priority?: BackendSignerQueuePriority;
}) {
  return withBackendSignerQueue(input.networkKey, async ({ config, signer }) => {
    if (!config.proofRegistryAddress) {
      return { note: "proof_registry_not_configured" };
    }

    try {
      const proofRegistry = new Contract(
        config.proofRegistryAddress,
        proofRegistryAbi,
        signer,
      );
      const tx = await proofRegistry.recordProof(
        input.cid,
        asBytes32(input.rootHash) ?? ZeroHash,
        asBytes32(input.storageTxHash) ?? ZeroHash,
        input.currentApyBps ?? 0,
        input.optimizedApyBps ?? 0,
      );
      const receipt = await tx.wait(1).catch(() => null);
      const parsedLogs: Array<LogDescription | null> = (receipt?.logs ?? []).map(
        (log: unknown) => {
          try {
            return proofRegistry.interface.parseLog(
              log as { topics: string[]; data: string },
            );
          } catch {
            return null;
          }
        },
      );
      const proofRecorded = parsedLogs.find(
        (log): log is LogDescription => log?.name === "ProofRecorded",
      );

      return {
        proofRegistryAddress: config.proofRegistryAddress,
        proofRegistryTxHash: tx.hash as string,
        proofRegistryProofId: proofRecorded?.args?.[0]?.toString(),
        proofRegistryExplorerUrl: `${config.explorerBase.replace(/\/$/, "")}/tx/${tx.hash}`,
        note: receipt ? undefined : "pending_registry_receipt",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "proof_registry_failed";
      return {
        note: `proof_registry_failed:${message.slice(0, 160)}`,
      };
    }
  }, { priority: input.priority });
}
