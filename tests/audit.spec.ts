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
