"use client";

import {
  useCallback,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type PortfolioResponse,
} from "@/lib/backend-data";
import {
  type OptimizationResult,
  type OptimizationState,
  buildOptimizationSnapshot,
} from "@/lib/optimizations";
import {
  type WalletNetworkKey,
  WALLET_CHANGE_EVENT,
  WALLET_NETWORK_STORAGE_KEY,
  WALLET_OVERRIDE_STORAGE_KEY,
  isWalletAddress,
  resolveWalletNetworkKey,
} from "@/lib/wallet";

interface YieldOptimizerContextValue {
  isOptimizing: boolean;
  latestResult: OptimizationResult | null;
  optimizations: OptimizationResult[];
  progress: OptimizationState;
  streamingText: string;
  optimize: (
    portfolio: Record<string, number>,
    prompt?: string,
  ) => Promise<OptimizationResult>;
}

interface PortfolioContextValue {
  portfolio: PortfolioResponse | null;
  loading: boolean;
  networkKey: WalletNetworkKey;
  refreshPortfolio: (
    walletAddress?: string,
    networkKey?: WalletNetworkKey,
  ) => Promise<PortfolioResponse | null>;
}

const YieldOptimizerContext = createContext<YieldOptimizerContextValue | null>(
  null,
);
const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function buildEmptyPortfolio(walletAddress?: string): PortfolioResponse {
  return {
    walletAddress,
    tokens: [],
    totalUSD: 0,
    currentAPY: 0,
    source: walletAddress ? "wallet_unavailable" : "wallet_disconnected",
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseStreamingChunk(
  chunk: string,
  onText: (text: string) => void,
) {
  for (const line of chunk.split("\n")) {
    if (!line) continue;

    if (line.startsWith("0:")) {
      try {
        onText(JSON.parse(line.slice(2)) as string);
      } catch {
        // Ignore malformed frame and keep reading the stream.
      }
      continue;
    }

    onText(line);
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkKey, setNetworkKey] = useState<WalletNetworkKey>("testnet");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationResult[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [progress, setProgress] = useState<OptimizationState>("analyzing");
  const [latestResult, setLatestResult] = useState<OptimizationResult | null>(null);

  const refreshPortfolio = useCallback(async (
    walletAddress?: string,
    networkKeyInput: WalletNetworkKey = networkKey,
  ) => {
    if (!walletAddress) {
      const emptyPortfolio = buildEmptyPortfolio();
      setPortfolio(emptyPortfolio);
      setLoading(false);
      return emptyPortfolio;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (walletAddress) {
        params.set("wallet", walletAddress);
      }
      params.set("network", networkKeyInput);

      const url =
        params.size > 0 ? `/api/portfolio?${params.toString()}` : "/api/portfolio";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio");
      }

      const nextPortfolio = (await response.json()) as PortfolioResponse;
      setPortfolio(nextPortfolio);
      return nextPortfolio;
    } catch {
      const emptyPortfolio: PortfolioResponse = {
        ...buildEmptyPortfolio(walletAddress),
        source: `wallet_unavailable_${networkKeyInput}`,
      };
      setPortfolio(emptyPortfolio);
      return emptyPortfolio;
    } finally {
      setLoading(false);
    }
  }, [networkKey]);

  useEffect(() => {
    const savedWallet =
      typeof window !== "undefined"
        ? window.localStorage.getItem(WALLET_OVERRIDE_STORAGE_KEY) ?? undefined
        : undefined;
    const savedNetwork =
      typeof window !== "undefined"
        ? resolveWalletNetworkKey(
            window.localStorage.getItem(WALLET_NETWORK_STORAGE_KEY) ?? undefined,
          )
        : undefined;

    const initialNetwork = savedNetwork ?? "testnet";
    const initialWallet = isWalletAddress(savedWallet) ? savedWallet : undefined;
    setNetworkKey(initialNetwork);
    if (initialWallet) {
      void refreshPortfolio(initialWallet, initialNetwork);
    } else {
      setPortfolio(buildEmptyPortfolio());
      setLoading(false);
      setLatestResult(null);
      setOptimizations([]);
    }

    async function hydrateLatest(walletAddress: string, nextNetwork: WalletNetworkKey) {
      try {
        const params = new URLSearchParams({
          network: nextNetwork,
          wallet: walletAddress,
        });
        const response = await fetch(`/api/agent/latest?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { data?: OptimizationResult | null };
        if (data.data) {
          setLatestResult(data.data);
          setOptimizations([data.data]);
        } else {
          setLatestResult(null);
          setOptimizations([]);
        }
      } catch {
        // Leave the dashboard in its empty-live state until a real run exists.
      }
    }

    if (initialWallet) {
      void hydrateLatest(initialWallet, initialNetwork);
    }

    function handleWalletChange(event: Event) {
      const detail = (
        event as CustomEvent<{ walletAddress?: string; networkKey?: WalletNetworkKey }>
      ).detail;
      const nextNetwork = resolveWalletNetworkKey(detail?.networkKey);
      setNetworkKey(nextNetwork);
      if (detail?.walletAddress) {
        // Force portfolio refresh on wallet change
        setPortfolio(buildEmptyPortfolio());
        void refreshPortfolio(detail.walletAddress, nextNetwork);
        void hydrateLatest(detail.walletAddress, nextNetwork);
        return;
      }

      setPortfolio(buildEmptyPortfolio());
      setLoading(false);
      setLatestResult(null);
      setOptimizations([]);
    }

    window.addEventListener(WALLET_CHANGE_EVENT, handleWalletChange as EventListener);

    return () => {
      window.removeEventListener(WALLET_CHANGE_EVENT, handleWalletChange as EventListener);
    };
  }, [refreshPortfolio]);

  async function optimize(
    portfolioInput: Record<string, number>,
    prompt = "Optimize my portfolio for best yield with low risk",
  ) {
    setIsOptimizing(true);
    setStreamingText("");
    setProgress("analyzing");

    const fallbackResult = buildOptimizationSnapshot(portfolioInput, prompt);

    try {
      const response = await fetch("/api/agent/optimize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Wallet-Extension-Bypass": "true",
        },
        credentials: "omit",
        body: JSON.stringify({ portfolio: portfolioInput, prompt }),
      });

      if (!response.ok) {
        throw new Error(`Optimization failed with status ${response.status}`);
      }

      const rawHeader = response.headers.get("X-Optimization-Result");
      const optimizationData = rawHeader
        ? (JSON.parse(rawHeader) as Partial<OptimizationResult>)
        : fallbackResult;

      // Extract TEE attestation from headers
      const llmProvider = response.headers.get("X-LLM-Provider") || undefined;
      const teeAttestationHeader = response.headers.get("X-TEE-Attestation");
      const teeAttestation = teeAttestationHeader
        ? (JSON.parse(teeAttestationHeader) as {
            chatId: string;
            isValid: boolean;
            provider: string;
            model: string;
            timestamp: string;
          })
        : undefined;

      await wait(320);
      setProgress("optimizing");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        parseStreamingChunk(decoder.decode(value, { stream: true }), (text) => {
          fullText += text;
          setStreamingText((previous) => previous + text);
        });
      }

      setProgress("executing");
      await wait(280);

      const storageResponse = await fetch("/api/0g/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkKey,
          walletAddress: portfolio?.walletAddress,
          decision: {
            current_apy:
              optimizationData.current_apy ?? fallbackResult.current_apy,
            optimized_apy:
              optimizationData.optimized_apy ?? fallbackResult.optimized_apy,
            yield_increase:
              optimizationData.yield_increase ?? fallbackResult.yield_increase,
            yield_increase_pct:
              optimizationData.yield_increase_pct ??
              fallbackResult.yield_increase_pct,
            recommended:
              optimizationData.recommended ?? fallbackResult.recommended,
            confidence:
              optimizationData.confidence ?? fallbackResult.confidence,
            executionSeconds:
              optimizationData.executionSeconds ??
              fallbackResult.executionSeconds,
            estimatedAnnualGain:
              optimizationData.estimatedAnnualGain ??
              fallbackResult.estimatedAnnualGain,
            totalPortfolio:
              optimizationData.totalPortfolio ?? fallbackResult.totalPortfolio,
            reasoning: fullText || optimizationData.reasoning || fallbackResult.reasoning,
          },
          // TEE / 0G Compute metadata
          teeProvider: teeAttestation?.provider,
          teeModel: teeAttestation?.model,
          teeChatId: teeAttestation?.chatId,
          teeVerified: teeAttestation?.isValid,
          llmProvider,
        }),
      });

      if (!storageResponse.ok) {
        throw new Error(`Storage failed with status ${storageResponse.status}`);
      }

      const storageData = (await storageResponse.json()) as {
        cid: string;
        txHash: string;
        explorerUrl?: string;
        timestamp?: string;
        walletAddress?: string;
        proofRegistryAddress?: string;
        proofRegistryTxHash?: string;
        proofRegistryProofId?: string;
        proofRegistryExplorerUrl?: string;
      };

      const nextResult: OptimizationResult = {
        ...fallbackResult,
        ...optimizationData,
        reasoning: fullText || optimizationData.reasoning || fallbackResult.reasoning,
        storageProof: storageData.cid,
        txHash: storageData.txHash,
        proofUrl: storageData.explorerUrl,
        timestamp: storageData.timestamp ?? new Date().toISOString(),
        walletAddress: storageData.walletAddress,
        proofRegistryAddress: storageData.proofRegistryAddress,
        proofRegistryTxHash: storageData.proofRegistryTxHash,
        proofRegistryProofId: storageData.proofRegistryProofId,
        proofRegistryExplorerUrl: storageData.proofRegistryExplorerUrl,
      };

      startTransition(() => {
        setLatestResult(nextResult);
        setOptimizations((previous) => [nextResult, ...previous].slice(0, 10));
      });

      setProgress("done");
      window.setTimeout(() => setProgress("analyzing"), 2800);

      return nextResult;
    } catch (error) {
      setProgress("analyzing");
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <PortfolioContext.Provider
      value={{ portfolio, loading, networkKey, refreshPortfolio }}
    >
      <YieldOptimizerContext.Provider
        value={{
          isOptimizing,
          latestResult,
          optimizations,
          progress,
          streamingText,
          optimize,
        }}
      >
        {children}
      </YieldOptimizerContext.Provider>
    </PortfolioContext.Provider>
  );
}

export function useYieldOptimizerContext() {
  const context = useContext(YieldOptimizerContext);
  if (!context) {
    throw new Error("useYieldOptimizer must be used within AppDataProvider");
  }

  return context;
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within AppDataProvider");
  }

  return context;
}
