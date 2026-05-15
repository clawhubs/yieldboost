import { expect, test } from "@playwright/test";

test("dashboard composition renders in no-wallet review mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("hero-card")).toBeVisible();
  await expect(page.getByTestId("right-agent-panel")).toBeVisible();
  await expect(page.getByTestId("proof-banner")).toBeVisible();
  await expect(page.getByTestId("nav-audit")).toBeVisible();
  await expect(page.getByText("Start here for hackathon review")).toBeVisible();

  await page.screenshot({
    path: "test-results/dashboard-no-wallet-review.png",
    fullPage: true,
  });
});

test("mobile nav opens from the left drawer and keeps judge route reachable", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByTestId("mobile-menu-toggle")).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  await page.getByTestId("mobile-menu-toggle").click();
  await expect(page.getByTestId("mobile-sidebar-drawer")).toBeVisible();
  await expect(page.getByTestId("mobile-sidebar-scroll")).toBeVisible();

  const scrollContainer = page.getByTestId("mobile-sidebar-scroll");
  const scrollMetrics = await scrollContainer.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);

  const afterScrollTop = await scrollContainer.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    return element.scrollTop;
  });
  expect(afterScrollTop).toBeGreaterThan(0);

  await page.getByTestId("mobile-nav-audit").click();
  await expect(page).toHaveURL(/\/judge$/);
  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByTestId("mobile-sidebar-drawer")).toHaveCount(0);

  await page.screenshot({
    path: "test-results/dashboard-mobile-drawer.png",
    fullPage: true,
  });
});

test("mobile judge drawer exposes a visible exit action", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/judge", { waitUntil: "networkidle" });

  await page.getByTestId("mobile-menu-toggle").click();
  await expect(page.getByTestId("mobile-exit-judge-mode")).toBeVisible();

  await page.getByTestId("mobile-exit-judge-mode").click();
  await expect(page).toHaveURL("/");
});

test("desktop judge flow exits back to normal dashboard mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_previous_wallet");
    window.localStorage.removeItem("yb_judge_previous_provider");
    window.localStorage.removeItem("yb_judge_previous_network");
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByTestId("nav-audit").click();
  await expect(page).toHaveURL(/\/judge$/);
  await expect(page.getByTestId("judge-page")).toBeVisible();

  await page.getByRole("button", { name: "Exit judge mode" }).first().click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("hero-card")).toBeVisible();
  await expect(page.getByText("Start here for hackathon review")).toBeVisible();
  await expect(page.getByText("Judge snapshot active")).toHaveCount(0);

  const judgeModeFlag = await page.evaluate(() => window.localStorage.getItem("yb_judge_mode"));
  expect(judgeModeFlag).toBeNull();
});

test("desktop wallet connect then disconnect clears wallet session", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_previous_wallet");
    window.localStorage.removeItem("yb_judge_previous_provider");
    window.localStorage.removeItem("yb_judge_previous_network");

    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const account = "0x1111111111111111111111111111111111111111";
    let currentChainId = "0x4115";
    let authorizedAccounts: string[] = [];
    const requestCounts = {
      ethRequestAccounts: 0,
      walletRequestPermissions: 0,
      walletSwitchEthereumChain: 0,
      walletAddEthereumChain: 0,
    };

    const provider = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === "wallet_requestPermissions") {
          requestCounts.walletRequestPermissions += 1;
          return [{ parentCapability: "eth_accounts" }];
        }
        if (method === "eth_accounts") {
          return authorizedAccounts;
        }
        if (method === "eth_requestAccounts") {
          requestCounts.ethRequestAccounts += 1;
          authorizedAccounts = [account];
          listeners.get("accountsChanged")?.forEach((listener) => listener([account]));
          return authorizedAccounts;
        }
        if (method === "eth_chainId") {
          return currentChainId;
        }
        if (method === "wallet_switchEthereumChain") {
          requestCounts.walletSwitchEthereumChain += 1;
          const requested = Array.isArray(params) ? params[0] as { chainId?: string } : undefined;
          currentChainId = requested?.chainId ?? currentChainId;
          listeners.get("chainChanged")?.forEach((listener) => listener(currentChainId));
          return null;
        }
        if (method === "wallet_addEthereumChain") {
          requestCounts.walletAddEthereumChain += 1;
          const requested = Array.isArray(params) ? params[0] as { chainId?: string } : undefined;
          currentChainId = requested?.chainId ?? currentChainId;
          listeners.get("chainChanged")?.forEach((listener) => listener(currentChainId));
          return null;
        }
        return null;
      },
      on: (event: string, listener: (...args: unknown[]) => void) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event)?.add(listener);
      },
      removeListener: (event: string, listener: (...args: unknown[]) => void) => {
        listeners.get(event)?.delete(listener);
      },
    };

    Object.defineProperty(window, "ethereum", {
      value: provider,
      configurable: true,
    });

    Object.defineProperty(window, "__walletRequestCounts", {
      value: requestCounts,
      configurable: true,
    });
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByText("0G Mainnet")).toBeVisible();
  await expect(page.getByText("Testnet")).toHaveCount(0);

  await page.getByRole("button", { name: "Connect wallet" }).first().click();
  const metamaskOption = page.getByRole("button", { name: /MetaMask/i });
  await expect(metamaskOption).toBeVisible();
  await metamaskOption.click();

  const disconnectButton = page.getByRole("button", { name: "Disconnect" });
  await expect(disconnectButton).toBeVisible();

  await disconnectButton.click();

  await expect(page.getByRole("button", { name: "Connect wallet" }).first()).toBeVisible();
  await expect(disconnectButton).toHaveCount(0);

  const walletState = await page.evaluate(() => ({
    walletOverride: window.localStorage.getItem("yb_wallet_override"),
    walletProvider: window.localStorage.getItem("yb_wallet_provider"),
    walletNetwork: window.localStorage.getItem("yb_wallet_network"),
    requestCounts: (window as unknown as {
      __walletRequestCounts?: {
        ethRequestAccounts: number;
        walletRequestPermissions: number;
        walletSwitchEthereumChain: number;
        walletAddEthereumChain: number;
      };
    }).__walletRequestCounts,
  }));

  expect(walletState.walletOverride).toBeNull();
  expect(walletState.walletProvider).toBeNull();
  expect(walletState.walletNetwork).toBe("mainnet");
  expect(walletState.requestCounts?.ethRequestAccounts).toBe(1);
  expect(walletState.requestCounts?.walletRequestPermissions).toBe(0);
  expect(walletState.requestCounts?.walletSwitchEthereumChain).toBeLessThanOrEqual(1);
  expect(walletState.requestCounts?.walletAddEthereumChain).toBe(0);
});

test("legacy demo wallet cookie does not keep dashboard in tracked-wallet mode", async ({ page, context, baseURL }) => {
  const origin = baseURL ?? "http://127.0.0.1:3020";

  await context.addCookies([
    {
      name: "yb_wallet",
      value: "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
      url: origin,
    },
    {
      name: "yb_wallet_network",
      value: "mainnet",
      url: origin,
    },
  ]);

  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_previous_wallet");
    window.localStorage.removeItem("yb_judge_previous_provider");
    window.localStorage.removeItem("yb_judge_previous_network");
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByRole("button", { name: "Connect wallet" }).first()).toBeVisible();
  await expect(page.getByText("Tracked wallet")).toHaveCount(0);

  const cookies = await context.cookies(origin);
  const walletCookie = cookies.find((cookie) => cookie.name === "yb_wallet");
  expect(walletCookie?.value ?? null).toBeNull();
});

test("judge route defaults to mainnet even if wallet network cookie is stale testnet", async ({ page, context, baseURL }) => {
  const origin = baseURL ?? "http://127.0.0.1:3020";

  await context.addCookies([
    {
      name: "yb_wallet_network",
      value: "testnet",
      url: origin,
    },
  ]);

  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_network");
  });

  await page.goto("/judge", { waitUntil: "networkidle" });

  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByTestId("judge-network-mainnet")).toContainText("Current review network");

  const cookies = await context.cookies(origin);
  const judgeNetworkCookie = cookies.find((cookie) => cookie.name === "yb_judge_network");
  expect(judgeNetworkCookie?.value).toBe("mainnet");
});

test("root dashboard sanitizes stale public testnet state back to mainnet", async ({ page, context, baseURL }) => {
  const origin = baseURL ?? "http://127.0.0.1:3020";

  await context.addCookies([
    {
      name: "yb_wallet_network",
      value: "testnet",
      url: origin,
    },
  ]);

  await page.addInitScript(() => {
    window.localStorage.setItem("yb_entry_mode_selected", "user");
    window.localStorage.setItem("yb_wallet_network", "testnet");
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_network");
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByText("0G Mainnet")).toBeVisible();
  await expect(page.getByText("Testnet")).toHaveCount(0);

  const rootState = await page.evaluate(() => ({
    walletNetwork: window.localStorage.getItem("yb_wallet_network"),
    judgeNetwork: window.localStorage.getItem("yb_judge_network"),
  }));

  expect(rootState.walletNetwork).toBe("mainnet");
  expect(rootState.judgeNetwork).toBeNull();
});

test("entry user mode fully clears stale judge session state", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("yb_entry_mode_selected");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_network");
    window.localStorage.setItem("yb_judge_previous_network", "testnet");
    window.localStorage.setItem(
      "yb_wallet_override",
      "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D",
    );
    window.localStorage.setItem("yb_wallet_network", "testnet");
    window.localStorage.removeItem("yb_wallet_provider");
    document.cookie = "yb_judge_mode=true; path=/; max-age=31536000; SameSite=Lax";
    document.cookie = "yb_judge_network=testnet; path=/; max-age=31536000; SameSite=Lax";
    document.cookie =
      "yb_wallet=0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D; path=/; max-age=31536000; SameSite=Lax";
    document.cookie = "yb_wallet_network=testnet; path=/; max-age=31536000; SameSite=Lax";
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByTestId("entry-mode-modal")).toBeVisible();
  await page.getByTestId("entry-user-mode").click();
  await expect(page.getByTestId("entry-mode-modal")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Connect wallet" }).first()).toBeVisible();
  await expect(page.getByText("Judge snapshot active")).toHaveCount(0);

  const state = await page.evaluate(() => ({
    entryMode: window.localStorage.getItem("yb_entry_mode_selected"),
    judgeMode: window.localStorage.getItem("yb_judge_mode"),
    judgeNetwork: window.localStorage.getItem("yb_judge_network"),
    previousWallet: window.localStorage.getItem("yb_judge_previous_wallet"),
    previousProvider: window.localStorage.getItem("yb_judge_previous_provider"),
    previousNetwork: window.localStorage.getItem("yb_judge_previous_network"),
    walletOverride: window.localStorage.getItem("yb_wallet_override"),
    walletProvider: window.localStorage.getItem("yb_wallet_provider"),
    walletNetwork: window.localStorage.getItem("yb_wallet_network"),
  }));

  expect(state.entryMode).toBe("user");
  expect(state.judgeMode).toBeNull();
  expect(state.judgeNetwork).toBeNull();
  expect(state.previousWallet).toBeNull();
  expect(state.previousProvider).toBeNull();
  expect(state.previousNetwork).toBeNull();
  expect(state.walletOverride).toBeNull();
  expect(state.walletProvider).toBeNull();
  expect(state.walletNetwork).toBe("mainnet");
});
