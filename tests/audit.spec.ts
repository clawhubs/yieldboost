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
    window.localStorage.removeItem("yb_judge_mode");
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
      window.localStorage.removeItem("yb_judge_mode");
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
  await expect(page.getByText("Latest proof and wallet snapshot")).toBeVisible();
  await expect(page.getByTestId("judge-integrity-auditor")).toContainText(
    /Integrity Auditor: (Approved|Rejected)/,
  );
  await expect(page.getByText("Judge wallet:")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open (latest|ProofRegistry) tx/ }).first()).toBeVisible();
});

test("direct judge entry bootstraps the review wallet across dashboard and history", async ({
  page,
}) => {
  await clearWalletState(page);
  await page.goto(`${BASE}/judge`, { waitUntil: "networkidle" });

  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByText(/Judge wallet:\s*0x8a3c/i)).toBeVisible();

  await page.getByRole("link", { name: "Open dashboard" }).click();
  await expect(page).toHaveURL(BASE);
  await expect(page.getByTestId("sidebar")).toContainText("Judge mode");
  await expect(page.getByTestId("boost-yield-cta")).toBeDisabled();

  const historyResponse = await page.goto(`${BASE}/history`, { waitUntil: "networkidle" });
  expect(historyResponse?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Execution History & Proof Ledger" })).toBeVisible();
});

test("judge network switcher can toggle testnet and mainnet review state", async ({
  page,
}) => {
  await clearWalletState(page);
  await page.goto(`${BASE}/judge`, { waitUntil: "networkidle" });

  const switcher = page.getByTestId("judge-network-switcher");
  const mainnetButton = page.getByTestId("judge-network-mainnet");
  const testnetButton = page.getByTestId("judge-network-testnet");

  await expect(switcher).toBeVisible();
  await expect(mainnetButton).toBeVisible();
  await expect(testnetButton).toBeVisible();

  if (!(await testnetButton.isDisabled())) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      testnetButton.click(),
    ]);
    await expect(page.getByTestId("judge-network-testnet")).toContainText("Current review network");
  }

  const refreshedMainnetButton = page.getByTestId("judge-network-mainnet");
  if (!(await refreshedMainnetButton.isDisabled())) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      refreshedMainnetButton.click(),
    ]);
    await expect(page.getByTestId("judge-network-mainnet")).toContainText("Current review network");
  }
});

test("judge nav enables read-only judge mode for review", async ({ page }) => {
  await clearWalletState(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("nav-judge").click();

  await expect(page).toHaveURL(/\/judge$/);
  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByTestId("sidebar")).toContainText("Judge mode");
  await expect(page.getByTestId("sidebar")).toContainText(/0x8a3c/i);
  await expect(page.getByRole("button", { name: "Exit judge mode" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Open dashboard" }).click();
  await expect(page).toHaveURL(BASE);
  await expect(page.getByTestId("boost-yield-cta")).toBeDisabled();
  await expect(page.getByTestId("boost-yield-cta")).toContainText("Judge Snapshot Active");
});

test("judge mode can be exited back to the normal no-wallet flow", async ({ page }) => {
  await clearWalletState(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("nav-judge").click();
  await expect(page.getByTestId("sidebar")).toContainText("Judge mode");

  await page.getByRole("button", { name: "Exit judge mode" }).first().click();

  await expect(page).toHaveURL(BASE);
  await expect(page.getByTestId("sidebar")).not.toContainText("Judge mode");
  await expect(page.getByTestId("sidebar")).toContainText("Not connected");
  await expect(page.getByTestId("sidebar")).not.toContainText(/0x8a3c/i);
});

test("marketplace page keeps strategy NFT listings visible", async ({ page }) => {
  await enableDemoWatchMode(page);
  await page.goto(`${BASE}/marketplace`, { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { name: "Adopt proof-backed yield strategies." }),
  ).toBeVisible();
  await expect(page.getByText(/Strategy NFT #/).first()).toBeVisible({
    timeout: 30_000,
  });
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

test("seeded demo wallet hydrates normal testnet data", async ({ page }) => {
  await enableDemoWatchMode(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(page.getByTestId("sidebar")).toContainText(/Tracked wallet|Connected/);
  await expect(page.getByTestId("sidebar")).toContainText(/0x8a3c/i);
  await expect(page.getByTestId("boost-yield-cta")).toBeEnabled({ timeout: 30_000 });
});

test("1-click optimize surfaces a stored proof receipt from the demo wallet", async ({
  page,
}) => {
  const integrityAudit = {
    status: "APPROVED",
    score: 96,
    reasons: ["APY projection stays within deterministic guardrail bounds."],
    checkedAt: new Date().toISOString(),
    source: "deterministic-logic-guardrail",
  };
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
    reasoning: "Testing live proof write with a deterministic optimize response.",
    riskProfile: "Moderate",
  });

  await enableDemoWatchMode(page);
  await page.route("**/api/agent/optimize", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Optimization-Result": optimizationHeader,
      },
      body: '0:"Testing live proof write with a deterministic optimize response."\\n',
    });
  });
  await page.route("**/api/0g/store", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cid: "0xe8c827c03427e1cecc768ec2eb4f30b34ab3315e9979cd6568fafc76e1853d88",
        txHash: "0xd086a8015810dfa8cb49242f0c9f2351407ff66d6b95c1eb5586581bdcc073b1",
        explorerUrl:
          "https://chainscan-galileo.0g.ai/tx/0xd086a8015810dfa8cb49242f0c9f2351407ff66d6b95c1eb5586581bdcc073b1",
        timestamp: new Date().toISOString(),
        walletAddress: DEMO_WALLET,
        proofRegistryAddress: "0x516D005367045b1fc18c9c9a0Ff7bf8653d1B4e3",
        proofRegistryTxHash:
          "0x7028b3002c2dd849be9266b4821ce7d3fff81bb07df851c63611b26b112be307",
        proofRegistryProofId: "23",
        proofRegistryExplorerUrl:
          "https://chainscan-galileo.0g.ai/tx/0x7028b3002c2dd849be9266b4821ce7d3fff81bb07df851c63611b26b112be307",
        integrityAudit,
      }),
    });
  });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const optimizeButton = page.getByTestId("boost-yield-cta");
  await expect(optimizeButton).toBeEnabled({ timeout: 30_000 });

  const proofWrite = page.waitForResponse(
    (response) =>
      response.url().includes("/api/0g/store") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await optimizeButton.click();

  const proofResponse = await proofWrite;
  expect([200, 502, 503]).toContain(proofResponse.status());

  await expect(
    page.getByText(/Proof stored as|proof sync is blocked|proof sync blocker/i),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("integrity-auditor-indicator")).toContainText(
    "Integrity Auditor: Approved",
  );
  await expect(page.getByTestId("integrity-auditor-indicator")).toContainText(
    "Logic Guardrail passed",
  );
  await expect(page.getByTestId("view-proof-banner")).toBeVisible();
});

test("integrity auditor rejects hallucinated proof writes before storage", async ({
  request,
}) => {
  const response = await request.post("/api/0g/store", {
    data: {
      networkKey: "testnet",
      walletAddress: DEMO_WALLET,
      decision: {
        current_apy: 0,
        optimized_apy: 420,
        yield_increase: 999999,
        yield_increase_pct: 9999,
        recommended: "Imaginary ETH Hyper Vault",
        confidence: 99,
        executionSeconds: 1.2,
        estimatedAnnualGain: 999999,
        totalPortfolio: 0,
        reasoning: "This should be blocked before 0G Storage or ProofRegistry writes.",
      },
      portfolioSnapshot: {
        tokens: [],
        totalUSD: 0,
        currentAPY: 0,
      },
    },
  });
  const payload = (await response.json()) as {
    success?: boolean;
    integrityAudit?: { status?: string; source?: string; reasons?: string[] };
  };

  expect(response.status()).toBe(422);
  expect(payload.success).toBe(false);
  expect(payload.integrityAudit?.status).toBe("REJECTED");
  expect(payload.integrityAudit?.source).toBe("deterministic-logic-guardrail");
  expect(payload.integrityAudit?.reasons?.join(" ")).toMatch(/zero|guardrail/i);
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

test("proof modal, history, agents, and judge routes stay accessible after demo-wallet hydration", async ({
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
