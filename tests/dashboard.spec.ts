import { expect, test } from "@playwright/test";

test("dashboard composition renders in no-wallet review mode", async ({ page }) => {
  await page.addInitScript(() => {
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
  await expect(page.getByTestId("nav-judge")).toBeVisible();
  await expect(page.getByText("Start here for hackathon review")).toBeVisible();

  await page.screenshot({
    path: "test-results/dashboard-no-wallet-review.png",
    fullPage: true,
  });
});

test("mobile nav opens from the left drawer and keeps judge route reachable", async ({ page }) => {
  await page.addInitScript(() => {
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

  await page.getByTestId("mobile-nav-judge").click();
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
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
    window.localStorage.removeItem("yb_judge_mode");
    window.localStorage.removeItem("yb_judge_previous_wallet");
    window.localStorage.removeItem("yb_judge_previous_provider");
    window.localStorage.removeItem("yb_judge_previous_network");
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByTestId("nav-judge").click();
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

    const provider = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === "eth_accounts") {
          return authorizedAccounts;
        }
        if (method === "eth_requestAccounts") {
          authorizedAccounts = [account];
          listeners.get("accountsChanged")?.forEach((listener) => listener([account]));
          return authorizedAccounts;
        }
        if (method === "eth_chainId") {
          return currentChainId;
        }
        if (method === "wallet_switchEthereumChain") {
          const requested = Array.isArray(params) ? params[0] as { chainId?: string } : undefined;
          currentChainId = requested?.chainId ?? currentChainId;
          listeners.get("chainChanged")?.forEach((listener) => listener(currentChainId));
          return null;
        }
        if (method === "wallet_addEthereumChain") {
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
  });

  await page.goto("/", { waitUntil: "networkidle" });

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
  }));

  expect(walletState.walletOverride).toBeNull();
  expect(walletState.walletProvider).toBeNull();
});
