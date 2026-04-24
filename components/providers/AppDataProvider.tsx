"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type PortfolioResponse,
  getMockPortfolio,
  getPortfolioValueMap,
} from "@/lib/backend-data";
import {
  type OptimizationResult,
  type OptimizationState,
  buildOptimizationSnapshot,
} from "@/lib/optimizations";

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
  refreshPortfolio: () => Promise<PortfolioResponse | null>;
}

const YieldOptimizerContext = createContext<YieldOptimizerContextValue | null>(
  null,
);
const PortfolioContext = createContext<PortfolioContextValue | null>(null);

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
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationResult[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [progress, setProgress] = useState<OptimizationState>("analyzing");
  const [latestResult, setLatestResult] = useState<OptimizationResult | null>(null);

  async function refreshPortfolio() {
    setLoading(true);

    try {
      const response = await fetch("/api/portfolio", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio");
      }

      const nextPortfolio = (await response.json()) as PortfolioResponse;
      setPortfolio(nextPortfolio);
      return nextPortfolio;
    } catch {
      const fallback = getMockPortfolio();
      setPortfolio(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshPortfolio();
  }, []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: portfolioInput, prompt }),
      });

      if (!response.ok) {
        throw new Error(`Optimization failed with status ${response.status}`);
      }

      const rawHeader = response.headers.get("X-Optimization-Result");
      const optimizationData = rawHeader
        ? (JSON.parse(rawHeader) as Partial<OptimizationResult>)
        : fallbackResult;

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
      value={{ portfolio, loading, refreshPortfolio }}
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

export function getFallbackPortfolioValueMap() {
  return getPortfolioValueMap(getMockPortfolio());
}
