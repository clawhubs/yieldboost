"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  ChartNoAxesCombined,
  Clock3,
  Copy,
  Disc3,
  ShieldCheck,
  GitBranch,
  Globe,
  Grid2X2,
  House,
  Image,
  MessageCircleMore,
  Package2,
  PanelLeft,
  Pencil,
  BriefcaseBusiness,
  Settings2,
  Star,
  Wallet2,
  X,
  Boxes,
  Zap,
  Bot,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import WalletConnectModal from "@/components/modals/WalletConnectModal";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  getAuthorizedAccounts,
  getInjectedWalletById,
  getInjectedWalletOptions,
  inferNetworkKeyFromChainId,
  switchOrAddNetwork,
  type InjectedProvider,
  type WalletOption,
} from "@/lib/browser-wallet";
import {
  DEFAULT_WALLET_ADDRESS,
  getAvailableWalletNetworks,
  isWalletAddress,
  resolveWalletNetworkKey,
  type WalletNetworkKey,
  WALLET_CHANGE_EVENT,
  WALLET_CONNECT_REQUEST_EVENT,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
  WALLET_NETWORK_STORAGE_KEY,
  WALLET_OVERRIDE_STORAGE_KEY,
  WALLET_PROVIDER_STORAGE_KEY,
} from "@/lib/wallet";

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof House;
  badge?: string;
}

const navigation: NavigationItem[] = [
  { href: "/judge", label: "Judge", icon: ShieldCheck, badge: "START" },
  { href: "/", label: "Dashboard", icon: House },
  { href: "/agent", label: "Boost", icon: Zap, badge: "HOT" },
  { href: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/strategies", label: "Strategies", icon: Boxes },
  { href: "/opportunities", label: "Opportunities", icon: Package2 },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/watchlist", label: "Watchlist", icon: Star, badge: "NEW" },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/docs", label: "Docs", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const socialIcons = [Globe, MessageCircleMore, GitBranch, Grid2X2, Image];
const availableNetworks = getAvailableWalletNetworks();

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { judgeMode, enterJudgeMode, exitJudgeMode } = usePortfolio();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [walletAddr, setWalletAddr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<WalletNetworkKey>("testnet");
  const [connected, setConnected] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const providerRef = useRef<InjectedProvider | null>(null);
  const providerIdRef = useRef<string | null>(null);
  const walletAddrRef = useRef<string | null>(null);
  const selectedNetworkRef = useRef<WalletNetworkKey>("testnet");
  const listenersRef = useRef<{
    accountsChanged: (...args: unknown[]) => void;
    chainChanged: (...args: unknown[]) => void;
    disconnect: (...args: unknown[]) => void;
  } | null>(null);

  const selectedNetworkConfig = useMemo(
    () => availableNetworks.find((network) => network.key === selectedNetwork) ?? availableNetworks[0],
    [selectedNetwork],
  );
  const isCustomWatchMode = !connected && Boolean(walletAddr);
  const activeWalletAddress = walletAddr ?? "";
  const activeNavigationItem = navigation.find((item) => item.href === pathname) ?? navigation[0];

  useEffect(() => {
    walletAddrRef.current = walletAddr;
  }, [walletAddr]);

  useEffect(() => {
    selectedNetworkRef.current = selectedNetwork;
  }, [selectedNetwork]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileNavOpen]);

  const broadcastWalletChange = useCallback((
    nextWalletAddress: string | null | undefined,
    nextNetwork: WalletNetworkKey,
    nextWalletLabel?: string | null,
    isConnected = false,
  ) => {
    if (nextWalletAddress) {
      setCookie(WALLET_COOKIE_KEY, nextWalletAddress);
    } else {
      clearCookie(WALLET_COOKIE_KEY);
    }
    setCookie(WALLET_NETWORK_COOKIE_KEY, nextNetwork);

    window.dispatchEvent(
      new CustomEvent(WALLET_CHANGE_EVENT, {
        detail: {
          walletAddress: nextWalletAddress ?? undefined,
          networkKey: nextNetwork,
          walletLabel: nextWalletLabel ?? undefined,
          connected: isConnected,
        },
      }),
    );
  }, []);

  const cleanupProviderListeners = useCallback(() => {
    if (!providerRef.current || !listenersRef.current) return;

    const { accountsChanged, chainChanged, disconnect } = listenersRef.current;
    providerRef.current.removeListener?.("accountsChanged", accountsChanged);
    providerRef.current.removeListener?.("chainChanged", chainChanged);
    providerRef.current.removeListener?.("disconnect", disconnect);
    listenersRef.current = null;
  }, []);

  const applyDisconnectedState = useCallback((nextNetwork: WalletNetworkKey) => {
    cleanupProviderListeners();
    providerRef.current = null;
    providerIdRef.current = null;
    localStorage.removeItem(WALLET_PROVIDER_STORAGE_KEY);
    localStorage.removeItem(WALLET_OVERRIDE_STORAGE_KEY);

    setConnected(false);
    setWalletAddr(null);
    setErrorText(null);
    broadcastWalletChange(undefined, nextNetwork, null, false);
  }, [broadcastWalletChange, cleanupProviderListeners]);

  const attachProviderListeners = useCallback((
    provider: InjectedProvider,
    providerId: string,
    providerName: string,
  ) => {
    cleanupProviderListeners();

    const accountsChanged = (accountsValue: unknown) => {
      const accounts = Array.isArray(accountsValue) ? accountsValue : [];
      const nextAccount =
        accounts.find((item): item is string => typeof item === "string") ?? null;

      if (!nextAccount || !isWalletAddress(nextAccount)) {
        applyDisconnectedState(selectedNetworkRef.current);
        return;
      }

      setWalletAddr(nextAccount);
      setConnected(true);
      setErrorText(null);
      localStorage.setItem(WALLET_OVERRIDE_STORAGE_KEY, nextAccount);
      localStorage.setItem(WALLET_PROVIDER_STORAGE_KEY, providerId);
      broadcastWalletChange(nextAccount, selectedNetworkRef.current, providerName, true);
    };

    const chainChanged = (chainIdValue: unknown) => {
      if (typeof chainIdValue !== "string") return;

      const matchedNetwork = inferNetworkKeyFromChainId(
        chainIdValue,
        availableNetworks.filter((network) => network.enabled),
      );
      if (!matchedNetwork) return;

      setSelectedNetwork(matchedNetwork);
      localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, matchedNetwork);
      setCookie(WALLET_NETWORK_COOKIE_KEY, matchedNetwork);
      const nextWalletAddress =
        walletAddrRef.current ??
        localStorage.getItem(WALLET_OVERRIDE_STORAGE_KEY);

      if (!nextWalletAddress || !isWalletAddress(nextWalletAddress)) {
        return;
      }

      broadcastWalletChange(nextWalletAddress, matchedNetwork, providerName, true);
    };

    const disconnect = () => {
      applyDisconnectedState(selectedNetworkRef.current);
    };

    provider.on?.("accountsChanged", accountsChanged);
    provider.on?.("chainChanged", chainChanged);
    provider.on?.("disconnect", disconnect);

    providerRef.current = provider;
    providerIdRef.current = providerId;
    listenersRef.current = { accountsChanged, chainChanged, disconnect };
  }, [applyDisconnectedState, broadcastWalletChange, cleanupProviderListeners]);

  useEffect(() => {
    function refreshWalletOptions() {
      setWalletOptions(getInjectedWalletOptions());
    }

    refreshWalletOptions();
    window.addEventListener("focus", refreshWalletOptions);
    const intervalId = window.setInterval(refreshWalletOptions, 1500);

    const savedNetwork = resolveWalletNetworkKey(
      localStorage.getItem(WALLET_NETWORK_STORAGE_KEY),
    );
    setSelectedNetwork(savedNetwork);
    setCookie(WALLET_NETWORK_COOKIE_KEY, savedNetwork);

    const savedProviderId = localStorage.getItem(WALLET_PROVIDER_STORAGE_KEY);
    const savedWallet = localStorage.getItem(WALLET_OVERRIDE_STORAGE_KEY);

    void (async () => {
      async function restoreAuthorizedWallet(
        providerId: string,
        networkKey: WalletNetworkKey,
      ) {
        const wallet = getInjectedWalletById(providerId);
        if (!wallet) return false;

        const accounts = await getAuthorizedAccounts(wallet.provider);
        const nextAccount = accounts.find((account) => isWalletAddress(account));
        if (!nextAccount) return false;

        providerRef.current = wallet.provider;
        providerIdRef.current = wallet.id;
        setWalletAddr(nextAccount);
        setConnected(true);
        setErrorText(null);
        localStorage.setItem(WALLET_OVERRIDE_STORAGE_KEY, nextAccount);
        localStorage.setItem(WALLET_PROVIDER_STORAGE_KEY, wallet.id);
        attachProviderListeners(wallet.provider, wallet.id, wallet.name);
        broadcastWalletChange(nextAccount, networkKey, wallet.name, true);
        return true;
      }

      if (savedProviderId) {
        const restored = await restoreAuthorizedWallet(savedProviderId, savedNetwork);
        if (restored) return;
      }

      if (isWalletAddress(savedWallet)) {
        const nextWallet = savedWallet!;
        setWalletAddr(nextWallet);
        setErrorText(null);
        broadcastWalletChange(nextWallet, savedNetwork, null, false);
        return;
      }

      broadcastWalletChange(undefined, savedNetwork, null, false);
    })();

    return () => {
      cleanupProviderListeners();
      window.removeEventListener("focus", refreshWalletOptions);
      window.clearInterval(intervalId);
    };
  }, [attachProviderListeners, broadcastWalletChange, cleanupProviderListeners]);

  useEffect(() => {
    function handleWalletConnectRequest(event: Event) {
      const detail = (event as CustomEvent<{ networkKey?: WalletNetworkKey }>).detail;
      const nextNetwork = resolveWalletNetworkKey(detail?.networkKey);
      setSelectedNetwork(nextNetwork);
      localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, nextNetwork);
      setCookie(WALLET_NETWORK_COOKIE_KEY, nextNetwork);
      setWalletModalOpen(true);
      setErrorText(null);
    }

    window.addEventListener(
      WALLET_CONNECT_REQUEST_EVENT,
      handleWalletConnectRequest as EventListener,
    );

    return () => {
      window.removeEventListener(
        WALLET_CONNECT_REQUEST_EVENT,
        handleWalletConnectRequest as EventListener,
      );
    };
  }, []);

  async function connectWallet(option: WalletOption) {
    setConnectingId(option.id);
    setWalletModalOpen(false);
    setErrorText(null);

    try {
      if (!selectedNetworkConfig?.enabled) {
        throw new Error(
          `${selectedNetworkConfig?.label ?? "Selected network"} is not configured yet.`,
        );
      }

      await switchOrAddNetwork(option.provider, selectedNetworkConfig);
      const accounts = (await option.provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const nextAccount = Array.isArray(accounts)
        ? accounts.find((account) => isWalletAddress(account))
        : null;

      if (!nextAccount) {
        throw new Error(`No account returned by ${option.name}.`);
      }

      setWalletAddr(nextAccount);
      setConnected(true);
      setErrorText(null);

      localStorage.setItem(WALLET_OVERRIDE_STORAGE_KEY, nextAccount);
      localStorage.setItem(WALLET_PROVIDER_STORAGE_KEY, option.id);
      localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, selectedNetwork);

      attachProviderListeners(option.provider, option.id, option.name);
      broadcastWalletChange(nextAccount, selectedNetwork, option.name, true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to connect ${option.name}.`;
      setErrorText(message);
    } finally {
      setConnectingId(null);
    }
  }

  function handleConnectWalletById(walletId: string) {
    const option = walletOptions.find((wallet) => wallet.id === walletId);
    if (!option) {
      setErrorText(`${walletId} is not detected in this browser.`);
      return;
    }

    void connectWallet(option);
  }

  function startEdit() {
    setInputVal(walletAddr ?? "");
    setEditing(true);
    setWalletModalOpen(false);
  }

  function applyWatchWallet(value: string) {
    cleanupProviderListeners();
    providerRef.current = null;
    providerIdRef.current = null;
    localStorage.removeItem(WALLET_PROVIDER_STORAGE_KEY);
    localStorage.setItem(WALLET_OVERRIDE_STORAGE_KEY, value);

    setWalletAddr(value);
    setConnected(false);
    setErrorText(null);
    setEditing(false);
    broadcastWalletChange(value, selectedNetwork, null, false);
  }

  function commitEdit() {
    const value = inputVal.trim();
    if (!isWalletAddress(value)) {
      setEditing(false);
      return;
    }

    applyWatchWallet(value);
  }

  function disconnectWallet() {
    applyDisconnectedState(selectedNetwork);
  }

  function activateJudgeReviewMode() {
    enterJudgeMode();
    if (!connected && !isCustomWatchMode) {
      applyWatchWallet(DEFAULT_WALLET_ADDRESS);
    }
  }

  function handleExitJudgeMode() {
    exitJudgeMode();
    if (!connected) {
      applyDisconnectedState(selectedNetwork);
    }
    setMobileNavOpen(false);
    if (pathname === "/judge") {
      router.push("/");
    }
  }

  function renderNavigation(mode: "desktop" | "mobile") {
    return (
      <nav className="flex flex-col gap-2">
        {navigation.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href;
          const isJudgeEntry = href === "/judge";

          return (
            <Link
              key={href}
              href={href}
              data-testid={
                mode === "desktop"
                  ? `nav-${label.toLowerCase()}`
                  : `mobile-nav-${label.toLowerCase()}`
              }
              onClick={() => {
                if (isJudgeEntry) {
                  activateJudgeReviewMode();
                }
                if (mode === "mobile") {
                  setMobileNavOpen(false);
                }
              }}
              className={`flex min-w-0 items-center gap-3 rounded-[14px] border px-4 py-[11px] text-[13px] font-medium transition ${
                active
                  ? "border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.10)] text-white shadow-[inset_0_0_0_1px_rgba(0,201,177,0.14),0_0_20px_rgba(0,201,177,0.06)]"
                  : isJudgeEntry
                    ? "border-[rgba(0,201,177,0.18)] bg-[linear-gradient(180deg,rgba(0,201,177,0.12)_0%,rgba(255,255,255,0.03)_100%)] text-white hover:border-[rgba(0,201,177,0.32)] hover:bg-[rgba(0,201,177,0.10)]"
                    : "border-transparent text-[#f4f7fb] hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  active || isJudgeEntry ? "text-[#1fd8c8]" : "text-[#f4f7fb]"
                }`}
              />
              <span>{label}</span>
              {badge ? (
                <span
                  className={`ml-auto rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                    isJudgeEntry
                      ? "border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.10)] text-[#7ef7ef]"
                      : "border-[#12453f] text-[#25d6c6]"
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderSidebarContent(mode: "desktop" | "mobile") {
    const isMobileMode = mode === "mobile";
    const shellCardClass = isMobileMode
      ? "rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,14,22,0.96)] px-4 py-4 shadow-[0_20px_48px_rgba(0,0,0,0.45)]"
      : "glass-inset rounded-[18px] px-4 py-4";
    const panelCardClass = isMobileMode
      ? "rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,16,24,0.96)] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
      : "glass-inset rounded-[18px] p-4";
    const insetButtonClass = isMobileMode
      ? "rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(12,21,31,0.98)]"
      : "glass-inset rounded-[10px]";
    const softInsetClass = isMobileMode
      ? "rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(12,21,31,0.96)]"
      : "rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]";
    const navigationShellClass = isMobileMode
      ? "mt-4 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,16,24,0.98)] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
      : "mt-4";
    const lowerSectionClass = isMobileMode
      ? "mt-4 space-y-3"
      : "mt-4 space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-4";
    const mobileScrollShellClass =
      "mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]";

    const brandCard = (
      <div className={shellCardClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <BrandLogo />
            <p className="mt-2.5 text-[12px] text-[#c9d2db]">AI Agent for DeFi Growth</p>
          </div>
          {mode === "mobile" ? (
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className={`${insetButtonClass} flex h-9 w-9 flex-none items-center justify-center text-[#d8e0e8]`}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {mode === "mobile" && judgeMode ? (
          <div className="mt-4 rounded-[14px] border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#9ff7f0]">Judge mode active</div>
            <div className="mt-1 text-[12px] leading-5 text-[#d9eef0]">
              Return to the normal wallet flow anytime from here.
            </div>
            <button
              type="button"
              data-testid="mobile-exit-judge-mode"
              onClick={handleExitJudgeMode}
              className="mt-3 w-full rounded-[11px] border border-[rgba(34,221,208,0.24)] bg-[linear-gradient(180deg,rgba(34,221,208,0.22)_0%,rgba(17,183,191,0.12)_100%)] px-3 py-2.5 text-[12px] font-semibold text-[#eafffd]"
            >
              Exit judge mode
            </button>
          </div>
        ) : null}
      </div>
    );

    const navigationBlock = (
      <div className={navigationShellClass}>
        {isMobileMode ? (
          <div className="mb-3 px-1 text-[10px] uppercase tracking-[0.16em] text-[#22ddd0]">
            Menu
          </div>
        ) : null}
        {renderNavigation(mode)}
      </div>
    );

    const lowerBlock = (
      <div className={lowerSectionClass}>
        <div className={panelCardClass}>
            <div className="flex items-center gap-2 text-[13px] font-medium text-white">
              <span
                className={`inline-flex h-3 w-3 rounded-full shadow-[0_0_14px_rgba(53,213,110,0.55)] ${
                  connected ? "bg-[#35d56e]" : judgeMode ? "bg-[#22ddd0]" : "bg-[#f3a441]"
                }`}
              />
              Account
            </div>
              <div className={`mt-1 pl-5 text-[12px] ${connected ? "text-[#35d56e]" : judgeMode || isCustomWatchMode ? "text-[#22ddd0]" : "text-[#f3a441]"}`}>
              {judgeMode ? "Judge mode" : connected ? "Connected" : isCustomWatchMode ? "Tracked wallet" : "Not connected"}
            </div>

            {editing ? (
              <div className="mt-4 flex items-center gap-2">
                <input
                  autoFocus
                  value={inputVal}
                  onChange={(event) => setInputVal(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitEdit();
                    if (event.key === "Escape") setEditing(false);
                  }}
                  placeholder="0x..."
                  className={`${insetButtonClass} flex-1 border-[rgba(37,214,198,0.4)] px-3 py-2 text-[12px] text-[#d8e0e8] outline-none`}
                />
                <button
                  type="button"
                  onClick={commitEdit}
                  className="glass-accent rounded-[10px] px-3 py-2 text-[11px] font-semibold text-[#22ddd0]"
                >
                  OK
                </button>
              </div>
            ) : connected || isCustomWatchMode ? (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(activeWalletAddress);
                    setWalletCopied(true);
                    window.setTimeout(() => setWalletCopied(false), 1400);
                  }}
                  className={`${softInsetClass} flex flex-1 items-center justify-between px-3 py-3 text-[13px] text-[#d8e0e8] transition hover:border-[rgba(0,201,177,0.35)]`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet2 className="h-4 w-4 text-[#d8e0e8]" />
                    <span>{shortAddr(activeWalletAddress)}</span>
                  </div>
                  <span className="text-[10px] text-[#9ca9b6]">{walletCopied ? "Copied!" : ""}</span>
                  <Copy className="h-3.5 w-3.5 text-[#9ca9b6]" />
                </button>
                {connected ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    title="Change tracked wallet"
                    className={`${insetButtonClass} flex h-9 w-9 flex-none items-center justify-center text-[#9ca9b6] transition hover:border-[rgba(0,201,177,0.35)] hover:text-[#22ddd0]`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {connected || isCustomWatchMode || judgeMode ? (
              <div className={`mt-3 p-3 ${softInsetClass}`}>
                <div className="text-[12px] font-medium text-white">
                  {activeWalletAddress ? shortAddr(activeWalletAddress) : judgeMode ? "Review wallet loading..." : "No wallet selected"}
                </div>
                <div className="mt-1 text-[11px] text-[#9ca9b6]">
                  {connected
                    ? selectedNetworkConfig?.label
                    : judgeMode
                      ? activeWalletAddress
                        ? "Judge review wallet"
                        : "Judge snapshot is bootstrapping the review wallet"
                      : "Tracked wallet"}
                </div>
                {judgeMode ? (
                  <button
                    type="button"
                    onClick={handleExitJudgeMode}
                    className="mt-3 rounded-[10px] border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] px-3 py-2 text-[11px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.36)]"
                  >
                    Exit judge mode
                  </button>
                ) : connected ? (
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="mt-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] px-3 py-2 text-[11px] font-semibold text-white transition hover:border-[rgba(255,255,255,0.18)]"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>
            ) : null}

            {errorText ? (
              <div className="mt-3 text-[11px] leading-5 text-[#ff9b9b]">{errorText}</div>
            ) : null}

            {!connected && !isCustomWatchMode ? (
              <div className={`mt-4 p-3 ${softInsetClass}`}>
                <div className="text-[12px] font-medium text-white">
                  {judgeMode ? "Judge snapshot active" : "Start here for hackathon review"}
                </div>
                <div className="mt-1 text-[11px] leading-5 text-[#9ca9b6]">
                  {judgeMode
                    ? "You are in the read-only judging path. Exit here anytime to return to the normal user flow."
                    : "Tap `Judge` in the menu to open the read-only review snapshot instantly. Return to the normal wallet flow anytime from the sidebar."}
                </div>
                <div className="mt-3 rounded-[10px] border border-[rgba(34,221,208,0.2)] bg-[rgba(34,221,208,0.08)] px-3 py-2 text-[11px] font-medium text-[#9ff7f0]">
                  {judgeMode
                    ? "Judge entry auto-loads the public review wallet"
                    : "Judge entry auto-loads the public review wallet"}
                </div>
                <div className="mt-2 grid gap-2">
                  {judgeMode ? (
                    <button
                      type="button"
                      onClick={handleExitJudgeMode}
                      className="rounded-[10px] border border-[rgba(34,221,208,0.22)] bg-[rgba(34,221,208,0.08)] px-3 py-2 text-[11px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(34,221,208,0.36)]"
                    >
                      Exit judge mode
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      setWalletModalOpen(true);
                    }}
                    className={`${insetButtonClass} px-3 py-2 text-[11px] font-semibold text-white`}
                  >
                    Connect wallet
                  </button>
                </div>
              </div>
            ) : null}

            {connected || isCustomWatchMode ? (
              <>
                <div className="mt-4 flex items-center gap-3 text-[13px] text-[#e5edf5]">
                  <Gift className="h-4 w-4 text-[#f3a441]" />
                  <span>Refer friends → Earn YA0G</span>
                </div>

                <div className="mt-4">
                  <p className="text-[14px] text-[#27de6b]">15 YA0G</p>
                  <p className="mt-1 text-[13px] text-[#d9e2ea]">pending rewards</p>
                </div>

                <button
                  type="button"
                  data-testid="claim-rewards"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[11px] bg-[linear-gradient(180deg,#1fd7ce_0%,#11b7bf_100%)] px-4 py-3 text-[14px] font-medium text-[#081116]"
                >
                  Claim Now
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>

        {isMobileMode ? null : (
          <div className="flex items-center gap-2">
            {socialIcons.map((Icon, index) => (
              <button
                key={index}
                type="button"
                className="glass-inset flex h-9 w-9 items-center justify-center rounded-[10px] text-[#d8e0e8] transition hover:border-[rgba(0,201,177,0.25)]"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        <div className="px-2">
          <p className="text-[12px] text-[#9daab6]">Powered by</p>
          <div className="mt-1 flex items-center gap-2 text-[14px] font-semibold text-white">
            <Disc3 className="h-4 w-4 text-[#1fd8c8]" />
            0G Chain
          </div>
        </div>
      </div>
    );

    if (isMobileMode) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          {brandCard}
          <div data-testid="mobile-sidebar-scroll" className={mobileScrollShellClass}>
            {navigationBlock}
            {lowerBlock}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="min-h-0">
          {brandCard}
          {navigationBlock}
        </div>
        {lowerBlock}
      </>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-40 px-[10px] pt-[10px] md:hidden">
        <div className="yb-card rounded-[18px] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                data-testid="mobile-menu-toggle"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-sidebar-drawer"
                aria-label="Open navigation menu"
                onClick={() => setMobileNavOpen(true)}
                className="glass-accent flex h-10 w-10 flex-none items-center justify-center rounded-[12px] text-[#22ddd0]"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[#22ddd0]">Navigation</div>
                <div className="truncate text-[14px] font-semibold text-white">
                  {activeNavigationItem.label}
                </div>
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className={`text-[10px] uppercase tracking-[0.12em] ${connected ? "text-[#35d56e]" : judgeMode || isCustomWatchMode ? "text-[#22ddd0]" : "text-[#9ca9b6]"}`}>
                {judgeMode ? "Judge mode" : connected ? "Connected" : isCustomWatchMode ? "Tracked wallet" : "Review mode"}
              </div>
              <div className="max-w-[132px] truncate text-[12px] text-[#d8e0e8]">
                {judgeMode && activeWalletAddress
                  ? shortAddr(activeWalletAddress)
                  : connected || isCustomWatchMode
                    ? shortAddr(activeWalletAddress)
                    : "Judge-first flow"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(2,6,12,0.88)] backdrop-blur-md md:hidden"
        />
      ) : null}

      {mobileNavOpen ? (
        <aside
          id="mobile-sidebar-drawer"
          data-testid="mobile-sidebar-drawer"
          className="fixed inset-y-0 left-0 z-50 w-[min(92vw,336px)] px-[10px] py-[10px] md:hidden"
        >
          <div className="flex h-full flex-col overflow-y-auto rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,10,16,0.98)] px-[10px] py-[10px] shadow-[0_28px_72px_rgba(0,0,0,0.58)] backdrop-blur-[28px]">
            {renderSidebarContent("mobile")}
          </div>
        </aside>
      ) : null}

      <aside
        data-testid="sidebar"
        className="hidden md:sticky md:top-0 md:block md:h-screen md:w-[242px] md:flex-none md:overflow-y-auto"
      >
        <div className="yb-card min-h-full px-[10px] py-[10px] md:border-r">
          {renderSidebarContent("desktop")}
        </div>
      </aside>

      <WalletConnectModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        onConnectWallet={handleConnectWalletById}
        walletOptions={walletOptions}
        network={selectedNetworkConfig}
        connectingId={connectingId}
      />
    </>
  );
}

function Gift({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 10V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M5 12H19V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 8.5C4 7.94772 4.44772 7.5 5 7.5H19C19.5523 7.5 20 7.94772 20 8.5V11C20 11.5523 19.5523 12 19 12H5C4.44772 12 4 11.5523 4 11V8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5H9.8C8.2536 7.5 7 6.2464 7 4.7C7 4.3134 7.3134 4 7.7 4C9.7068 4 11.4546 5.09321 12 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5H14.2C15.7464 7.5 17 6.2464 17 4.7C17 4.3134 16.6866 4 16.3 4C14.2932 4 12.5454 5.09321 12 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
