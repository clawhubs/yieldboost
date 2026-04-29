"use client";

import {
  useCallback,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
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
  DEFAULT_WALLET_ADDRESS,
  type WalletChangeDetail,
  JUDGE_MODE_COOKIE_KEY,
  type WalletNetworkKey,
  JUDGE_MODE_STORAGE_KEY,
  PROOF_STORED_EVENT,
  PROOF_STORED_STORAGE_KEY,
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
  judgeMode: boolean;
  enterJudgeMode: () => void;
  exitJudgeMode: () => void;
  refreshPortfolio: (
    walletAddress?: string,
    networkKey?: WalletNetworkKey,
  ) => Promise<PortfolioResponse | null>;
}

const YieldOptimizerContext = createContext<YieldOptimizerContextValue | null>(
  null,
);
const PortfolioContext = createContext<PortfolioContextValue | null>(null);
const LATEST_RESULT_STORAGE_KEY = "yb_latest_result";

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

function getClientActiveWalletAddress(fallback?: string): string | undefined {
  if (typeof window === "undefined") {
    return isWalletAddress(fallback) ? fallback : undefined;
  }

  const storedWallet = window.localStorage.getItem(WALLET_OVERRIDE_STORAGE_KEY);
  if (isWalletAddress(storedWallet)) {
    return storedWallet ?? undefined;
  }

  return isWalletAddress(fallback) ? fallback : undefined;
}

function buildWalletScopeKey(
  walletAddress?: string,
  networkKey: WalletNetworkKey = "testnet",
) {
  return walletAddress ? `${walletAddress.toLowerCase()}::${networkKey}` : `disconnected::${networkKey}`;
}

function getLatestResultStorageKey(scopeKey: string) {
  return `${LATEST_RESULT_STORAGE_KEY}:${scopeKey}`;
}

function parseResultTimestamp(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickNewerResult(
  left: OptimizationResult | null | undefined,
  right: OptimizationResult | null | undefined,
) {
  if (!left) return right ?? null;
  if (!right) return left;

  return parseResultTimestamp(left.timestamp) >= parseResultTimestamp(right.timestamp)
    ? left
    : right;
}

function readStoredLatestResult(scopeKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getLatestResultStorageKey(scopeKey));
    if (!raw) return null;
    return JSON.parse(raw) as OptimizationResult;
  } catch {
    return null;
  }
}

function persistLatestResult(scopeKey: string, result: OptimizationResult) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getLatestResultStorageKey(scopeKey),
      JSON.stringify(result),
    );
  } catch {
    // Ignore client storage write failures.
  }
}

function applyStorageProofEvent(
  networkKey: WalletNetworkKey,
  walletAddress: string | undefined,
  cid: string,
  timestamp?: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  const recordedAt = timestamp ?? new Date().toISOString();
  window.localStorage.setItem(PROOF_STORED_STORAGE_KEY, recordedAt);
  window.dispatchEvent(
    new CustomEvent(PROOF_STORED_EVENT, {
      detail: {
        walletAddress,
        networkKey,
        recordedAt,
        cid,
      },
    }),
  );
}

function scheduleFollowUpProofRefresh(
  scopeKey: string,
  walletAddress: string,
  networkKey: WalletNetworkKey,
  activeScopeRef: { current: string },
  refreshPortfolio: (
    walletAddress?: string,
    networkKey?: WalletNetworkKey,
  ) => Promise<PortfolioResponse | null>,
  hydrateLatest: (walletAddress: string, nextNetwork: WalletNetworkKey) => Promise<void>,
) {
  if (typeof window === "undefined") {
    return;
  }

  for (const delayMs of [1500, 4500, 9000]) {
    window.setTimeout(() => {
      if (activeScopeRef.current !== scopeKey) {
        return;
      }

      void refreshPortfolio(walletAddress, networkKey);
      void hydrateLatest(walletAddress, networkKey);
    }, delayMs);
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkKey, setNetworkKey] = useState<WalletNetworkKey>("testnet");
  const [judgeMode, setJudgeMode] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationResult[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [progress, setProgress] = useState<OptimizationState>("analyzing");
  const [latestResult, setLatestResult] = useState<OptimizationResult | null>(null);
  const activeScopeRef = useRef(buildWalletScopeKey(undefined, "testnet"));
  const portfolioRequestIdRef = useRef(0);
  const latestRequestIdRef = useRef(0);
  const latestResultRef = useRef<OptimizationResult | null>(null);

  useEffect(() => {
    latestResultRef.current = latestResult;
  }, [latestResult]);

  async function syncProofRecord({
    activeWalletAddress,
    fallbackResult,
    fullText,
    llmProvider,
    networkKey,
    optimizationData,
    portfolio,
    scopeKey,
    teeAttestation,
  }: {
    activeWalletAddress: string | undefined;
    fallbackResult: OptimizationResult;
    fullText: string;
    llmProvider?: string;
    networkKey: WalletNetworkKey;
    optimizationData: Partial<OptimizationResult>;
    portfolio: PortfolioResponse | null;
    scopeKey: string;
    teeAttestation?: {
      chatId: string;
      isValid: boolean;
      provider: string;
      model: string;
      timestamp: string;
    };
  }) {
    let storageErrorMessage: string | undefined;
    let storageData:
      | {
          cid: string;
          txHash: string;
          blockNumber?: number;
          explorerUrl?: string;
          timestamp?: string;
          walletAddress?: string;
          proofRegistryAddress?: string;
          proofRegistryTxHash?: string;
          proofRegistryProofId?: string;
          proofRegistryExplorerUrl?: string;
          note?: string;
        }
      | null = null;

    try {
      const storageResponse = await fetch("/api/0g/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkKey,
          walletAddress: activeWalletAddress,
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
          portfolioSnapshot: portfolio
            ? {
                tokens: portfolio.tokens.map((token) => ({
                  symbol: token.symbol,
                  amount: token.amount,
                  valueUSD: token.valueUSD,
                })),
                totalUSD: portfolio.totalUSD,
                currentAPY: portfolio.currentAPY,
                displayTotal: portfolio.displayTotal,
                displayUnit: portfolio.displayUnit,
                displayLabel: portfolio.displayLabel,
              }
            : undefined,
          teeProvider: teeAttestation?.provider,
          teeModel: teeAttestation?.model,
          teeChatId: teeAttestation?.chatId,
          teeVerified: teeAttestation?.isValid,
          llmProvider,
        }),
      });

      if (!storageResponse.ok) {
        let message = `Storage failed with status ${storageResponse.status}`;
        try {
          const payload = (await storageResponse.json()) as { error?: string };
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Keep the HTTP status-based message when parsing fails.
        }
        storageErrorMessage = message;
      } else {
        storageData = (await storageResponse.json()) as {
          cid: string;
          txHash: string;
          blockNumber?: number;
          explorerUrl?: string;
          timestamp?: string;
          walletAddress?: string;
          proofRegistryAddress?: string;
          proofRegistryTxHash?: string;
          proofRegistryProofId?: string;
          proofRegistryExplorerUrl?: string;
          note?: string;
        };

        if (storageData.cid) {
          applyStorageProofEvent(
            networkKey,
            storageData.walletAddress ?? activeWalletAddress,
            storageData.cid,
            storageData.timestamp,
          );
        }
      }
    } catch (error) {
      storageErrorMessage =
        error instanceof Error ? error.message : "0G storage request failed";
    }

    const resolvedWalletAddress = storageData?.walletAddress ?? activeWalletAddress;
    const resolvedScopeKey = buildWalletScopeKey(resolvedWalletAddress, networkKey);
    const nextResult: OptimizationResult = {
      ...fallbackResult,
      ...optimizationData,
      reasoning: fullText || optimizationData.reasoning || fallbackResult.reasoning,
      storageProof: storageData?.cid,
      txHash: storageData?.txHash,
      blockNumber: storageData?.blockNumber,
      proofUrl: storageData?.explorerUrl,
      timestamp: storageData?.timestamp ?? new Date().toISOString(),
      walletAddress: resolvedWalletAddress,
      proofRegistryAddress: storageData?.proofRegistryAddress,
      proofRegistryTxHash: storageData?.proofRegistryTxHash,
      proofRegistryProofId: storageData?.proofRegistryProofId,
      proofRegistryExplorerUrl: storageData?.proofRegistryExplorerUrl,
      proofStatus: storageData?.cid ? "stored" : storageErrorMessage ? "error" : "pending",
      proofStatusDetail:
        storageErrorMessage ??
        storageData?.note,
    };

    if (activeScopeRef.current === scopeKey || activeScopeRef.current === resolvedScopeKey) {
      startTransition(() => {
        setLatestResult(nextResult);
        setOptimizations((previous) => [nextResult, ...previous.filter((item) => item.timestamp !== nextResult.timestamp)].slice(0, 10));
      });
    }
    persistLatestResult(resolvedScopeKey, nextResult);

    if (storageData?.cid && resolvedWalletAddress) {
      activeScopeRef.current = resolvedScopeKey;
      void refreshPortfolio(resolvedWalletAddress, networkKey);
      void hydrateLatest(resolvedWalletAddress, networkKey);
      scheduleFollowUpProofRefresh(
        resolvedScopeKey,
        resolvedWalletAddress,
        networkKey,
        activeScopeRef,
        refreshPortfolio,
        hydrateLatest,
      );
    }

    return nextResult;
  }

  const enterJudgeMode = useCallback(() => {
    setJudgeMode(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(JUDGE_MODE_STORAGE_KEY, "true");
      document.cookie = `${JUDGE_MODE_COOKIE_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const exitJudgeMode = useCallback(() => {
    setJudgeMode(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(JUDGE_MODE_STORAGE_KEY);
      document.cookie = `${JUDGE_MODE_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  }, []);

  const refreshPortfolio = useCallback(async (
    walletAddress?: string,
    networkKeyInput: WalletNetworkKey = networkKey,
  ) => {
    const scopeKey = buildWalletScopeKey(walletAddress, networkKeyInput);
    const requestId = ++portfolioRequestIdRef.current;

    if (!walletAddress) {
      const emptyPortfolio = buildEmptyPortfolio();
      if (
        activeScopeRef.current === scopeKey &&
        portfolioRequestIdRef.current === requestId
      ) {
        setPortfolio(emptyPortfolio);
        setLoading(false);
      }
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
      if (
        activeScopeRef.current === scopeKey &&
        portfolioRequestIdRef.current === requestId
      ) {
        setPortfolio(nextPortfolio);
      }
      return nextPortfolio;
    } catch {
      const emptyPortfolio: PortfolioResponse = {
        ...buildEmptyPortfolio(walletAddress),
        source: `wallet_unavailable_${networkKeyInput}`,
      };
      if (
        activeScopeRef.current === scopeKey &&
        portfolioRequestIdRef.current === requestId
      ) {
        setPortfolio(emptyPortfolio);
      }
      return emptyPortfolio;
    } finally {
      if (
        activeScopeRef.current === scopeKey &&
        portfolioRequestIdRef.current === requestId
      ) {
        setLoading(false);
      }
    }
  }, [networkKey]);

  const hydrateLatest = useCallback(async (
    walletAddress: string,
    nextNetwork: WalletNetworkKey,
  ) => {
    const scopeKey = buildWalletScopeKey(walletAddress, nextNetwork);
    const requestId = ++latestRequestIdRef.current;

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
      if (
        activeScopeRef.current !== scopeKey ||
        latestRequestIdRef.current !== requestId
      ) {
        return;
      }
      const cachedResult = readStoredLatestResult(scopeKey);
      const preferredResult = pickNewerResult(
        pickNewerResult(data.data ?? null, cachedResult),
        latestResultRef.current?.walletAddress &&
          buildWalletScopeKey(latestResultRef.current.walletAddress, nextNetwork) === scopeKey
          ? latestResultRef.current
          : null,
      );
      if (preferredResult) {
        setLatestResult(preferredResult);
        setOptimizations([preferredResult]);
      } else {
        setLatestResult(null);
        setOptimizations([]);
      }
    } catch {
      // Leave the dashboard in its empty-live state until a real run exists.
    }
  }, []);

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
    const initialJudgeMode =
      typeof window !== "undefined" &&
      window.localStorage.getItem(JUDGE_MODE_STORAGE_KEY) === "true";
    const initialWallet = initialJudgeMode
      ? DEFAULT_WALLET_ADDRESS
      : isWalletAddress(savedWallet)
        ? savedWallet
        : undefined;
    activeScopeRef.current = buildWalletScopeKey(initialWallet, initialNetwork);

    setNetworkKey(initialNetwork);
    setJudgeMode(Boolean(initialJudgeMode));
    const cachedInitialResult = readStoredLatestResult(activeScopeRef.current);
    if (initialWallet) {
      void refreshPortfolio(initialWallet, initialNetwork);
    } else {
      setPortfolio(buildEmptyPortfolio());
      setLoading(false);
      setLatestResult(cachedInitialResult);
      setOptimizations(cachedInitialResult ? [cachedInitialResult] : []);
    }

    if (initialWallet) {
      if (cachedInitialResult) {
        setLatestResult(cachedInitialResult);
        setOptimizations([cachedInitialResult]);
      }
      void hydrateLatest(initialWallet, initialNetwork);
    }

    function handleWalletChange(event: Event) {
      const detail = (
        event as CustomEvent<WalletChangeDetail>
      ).detail;
      const judgeModeActive =
        typeof window !== "undefined" &&
        window.localStorage.getItem(JUDGE_MODE_STORAGE_KEY) === "true";
      const nextNetwork = resolveWalletNetworkKey(detail?.networkKey);
      const nextWalletAddress = judgeModeActive
        ? DEFAULT_WALLET_ADDRESS
        : detail?.walletAddress;
      activeScopeRef.current = buildWalletScopeKey(nextWalletAddress, nextNetwork);
      setNetworkKey(nextNetwork);
      if (nextWalletAddress) {
        if (detail.connected && !judgeModeActive) {
          exitJudgeMode();
        }
        const cachedResult = readStoredLatestResult(activeScopeRef.current);
        // Force portfolio refresh on wallet change
        setPortfolio(buildEmptyPortfolio());
        setLatestResult(cachedResult);
        setOptimizations(cachedResult ? [cachedResult] : []);
        void refreshPortfolio(nextWalletAddress, nextNetwork);
        void hydrateLatest(nextWalletAddress, nextNetwork);
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
  }, [exitJudgeMode, hydrateLatest, refreshPortfolio]);

  async function optimize(
    portfolioInput: Record<string, number>,
    prompt = "Optimize my portfolio for best yield with low risk",
  ) {
    setIsOptimizing(true);
    setStreamingText("");
    setProgress("analyzing");
    latestRequestIdRef.current += 1;
    portfolioRequestIdRef.current += 1;

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

      const activeWalletAddress = getClientActiveWalletAddress(portfolio?.walletAddress);
      const optimisticScopeKey = buildWalletScopeKey(activeWalletAddress, networkKey);

      const nextResult: OptimizationResult = {
        ...fallbackResult,
        ...optimizationData,
        reasoning: fullText || optimizationData.reasoning || fallbackResult.reasoning,
        timestamp: new Date().toISOString(),
        walletAddress: activeWalletAddress,
        proofStatus: "pending",
        proofStatusDetail: "Proof sync is running in the background.",
      };

      startTransition(() => {
        setLatestResult(nextResult);
        setOptimizations((previous) => [nextResult, ...previous].slice(0, 10));
      });
      persistLatestResult(optimisticScopeKey, nextResult);

      setProgress("done");
      window.setTimeout(() => setProgress("analyzing"), 1200);
      setIsOptimizing(false);

      void syncProofRecord({
        activeWalletAddress,
        fallbackResult,
        fullText,
        llmProvider,
        networkKey,
        optimizationData,
        portfolio,
        scopeKey: optimisticScopeKey,
        teeAttestation,
      });

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
      value={{
        portfolio,
        loading,
        networkKey,
        judgeMode,
        enterJudgeMode,
        exitJudgeMode,
        refreshPortfolio,
      }}
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
