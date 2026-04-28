import { expect, test } from "@playwright/test";

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3020"}`;
const DEMO_WALLET =
  process.env.NEXT_PUBLIC_DEMO_WALLET_ADDRESS ??
  "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D";
const DEMO_NETWORK = process.env.ZG_NETWORK_KEY === "mainnet" ? "mainnet" : "testnet";

async function grantClipboard(page: import("@playwright/test").Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
}

async function clearWalletState(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
  });
}

async function enableDemoWatchMode(page: import("@playwright/test").Page) {
  const url = new URL(BASE);

  await page.context().addCookies([
    {
      name: "yb_wallet",
      value: DEMO_WALLET,
      url: url.origin,
    },
    {
      name: "yb_wallet_network",
      value: DEMO_NETWORK,
      url: url.origin,
    },
  ]);

  await page.addInitScript(
    ({ wallet, network }) => {
      window.localStorage.setItem("yb_wallet_override", wallet);
      window.localStorage.setItem("yb_wallet_network", network);
      window.localStorage.removeItem("yb_wallet_provider");
    },
    { wallet: DEMO_WALLET, network: DEMO_NETWORK },
  );
}

test("dashboard stays usable without a connected wallet", async ({ page }) => {
  await clearWalletState(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("hero-card")).toBeVisible();
  await expect(page.getByTestId("nav-judge")).toBeVisible();
  await expect(page.getByText("Start here for hackathon review")).toBeVisible();
  await expect(page.getByTestId("boost-yield-cta")).toBeDisabled();
});

test("connect wallet flow can be opened from the no-wallet state", async ({ page }) => {
  await clearWalletState(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.locator("button").filter({ hasText: /^Connect wallet$/ }).click();
  await expect(page.getByText("Connect Wallet").last()).toBeVisible();
  await expect(page.getByText(/0G Testnet|0G Mainnet/)).toBeVisible();
});

test("judge page is reachable without wallet connection", async ({ page }) => {
  await clearWalletState(page);
  await page.goto(`${BASE}/judge`, { waitUntil: "networkidle" });

  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByText("Latest proof and result")).toBeVisible();
  await expect(page.getByText("Vercel env checklist")).toBeVisible();
});

test("judge nav immediately enables demo watch mode for review", async ({ page }) => {
  await clearWalletState(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("nav-judge").click();

  await expect(page).toHaveURL(/\/judge$/);
  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByTestId("sidebar")).toContainText("Watch mode");
  await expect(page.getByTestId("sidebar")).toContainText(/0x8a3c/i);
});

test("mobile optimization modal stays scrollable and below full-screen takeover", async ({ page }) => {
  await enableDemoWatchMode(page);
  await page.setViewportSize({ width: 390, height: 844 });

  const optimizationHeader = JSON.stringify({
    current_apy: 4.2,
    optimized_apy: 8.7,
    yield_increase: 220,
    yield_increase_pct: 107,
    top_protocols: [{ name: "SaucerSwap LP", apy: 24.18, risk: "medium" }],
    recommended: "SaucerSwap LP",
    confidence: 91,
    executionSeconds: 6.4,
    estimatedAnnualGain: 220,
    totalPortfolio: 1200,
    reasoning: "Testing mobile optimize modal sizing.",
    riskProfile: "Moderate",
  });

  await page.route("**/api/agent/optimize", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Optimization-Result": optimizationHeader,
      },
      body: '0:"Testing mobile optimize modal sizing."\\n',
    });
  });
  await page.route("**/api/0g/store", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Proof sync blocked for responsive modal test" }),
    });
  });

  await page.goto(BASE, { waitUntil: "networkidle" });

  const optimizeButton = page.getByTestId("boost-yield-cta");
  await expect(optimizeButton).toBeEnabled({ timeout: 30_000 });
  const optimizeResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/agent/optimize") &&
      response.request().method() === "POST",
  );
  await optimizeButton.click();

  const dialog = page.getByTestId("optimization-loading-dialog");
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.height).toBeLessThan(844);

  const scroll = page.getByTestId("optimization-loading-scroll");
  await expect(scroll).toBeVisible();
  const scrollMetrics = await scroll.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);

  const afterScrollTop = await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    return element.scrollTop;
  });
  expect(afterScrollTop).toBeGreaterThan(0);

  await optimizeResponse;
});

test("demo watch wallet flow hydrates review data", async ({ page }) => {
  await enableDemoWatchMode(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(page.getByTestId("sidebar")).toContainText(/Watch mode|Connected/);
  await expect(page.getByTestId("sidebar")).toContainText(/0x8a3c/i);
  await expect(page.getByTestId("boost-yield-cta")).toBeEnabled({ timeout: 30_000 });
});

test("1-click optimize writes a real proof from the demo watch wallet", async ({ page }) => {
  await enableDemoWatchMode(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  const optimizeButton = page.getByTestId("boost-yield-cta");
  await expect(optimizeButton).toBeEnabled({ timeout: 30_000 });

  const proofWrite = page.waitForResponse(
    (response) =>
      response.url().includes("/api/0g/store") &&
      response.request().method() === "POST",
    { timeout: 90_000 },
  );

  await optimizeButton.click();

  const proofResponse = await proofWrite;
  expect([200, 502, 503]).toContain(proofResponse.status());

  await expect(
    page.getByText(/Proof stored as|proof sync is blocked|proof sync blocker/i),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("view-proof-banner")).toBeVisible();
});

test("proof modal stays honest when no live proof tx exists", async ({ page }) => {
  await enableDemoWatchMode(page);

  const optimizationHeader = JSON.stringify({
    current_apy: 4.2,
    optimized_apy: 8.7,
    yield_increase: 220,
    yield_increase_pct: 107,
    top_protocols: [{ name: "SaucerSwap LP", apy: 24.18, risk: "medium" }],
    recommended: "SaucerSwap LP",
    confidence: 91,
    executionSeconds: 6.4,
    estimatedAnnualGain: 220,
    totalPortfolio: 1200,
    reasoning: "Testing honest proof fallback behavior.",
    riskProfile: "Moderate",
  });

  await page.route("**/api/agent/optimize", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Optimization-Result": optimizationHeader,
      },
      body: '0:"Testing honest proof fallback behavior."\\n',
    });
  });
  await page.route("**/api/0g/store", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Proof sync blocked for honesty test" }),
    });
  });
  await page.route("**/api/0g/proof*", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "No live proof available yet" }),
    });
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  const storageResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/0g/store") &&
      response.request().method() === "POST",
  );
  await page.getByTestId("boost-yield-cta").click();
  await storageResponse;

  await expect(
    page.getByTestId("proof-banner").getByText(/Proof sync blocked for honesty test/i),
  ).toBeVisible({
    timeout: 60_000,
  });
  await page.getByTestId("agent-card-proof").first().click();

  await expect(page.getByTestId("proof-modal")).toBeVisible();
  await expect(page.getByText("No live proof is available yet.")).toBeVisible();
  await expect(page.getByText(/will not send you to a fallback explorer page/i)).toBeVisible();
  await expect(page.getByTestId("open-0g-explorer")).toHaveCount(0);
});

test("proof modal, history, agents, and judge routes stay accessible after watch-mode hydration", async ({
  page,
}) => {
  await grantClipboard(page);
  await enableDemoWatchMode(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("view-proof-banner").click();
  await expect(page.getByTestId("proof-modal")).toBeVisible();
  await expect(page.getByTestId("copy-tx-hash")).toBeVisible();
  await expect(page.getByTestId("copy-storage-cid")).toBeVisible();

  await page.getByTestId("copy-tx-hash").click();
  await expect
    .poll(async () => page.evaluate(() => navigator.clipboard.readText().catch(() => "")))
    .toContain("0x");

  const historyResponse = await page.goto(`${BASE}/history`, { waitUntil: "networkidle" });
  expect(historyResponse?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Execution History & Proof Ledger" })).toBeVisible();

  const agentsResponse = await page.goto(`${BASE}/agents`, { waitUntil: "networkidle" });
  expect(agentsResponse?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Agent Gallery" })).toBeVisible();

  const judgeResponse = await page.goto(`${BASE}/judge`, { waitUntil: "networkidle" });
  expect(judgeResponse?.ok()).toBeTruthy();
  await expect(page.getByTestId("judge-page")).toBeVisible();
});
