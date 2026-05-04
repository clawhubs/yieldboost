import { expect, test } from "@playwright/test";

const LIVE = process.env.PLAYWRIGHT_BASE_URL ?? "https://yield.raisurge.com";

test("LIVE · Dashboard loads", async ({ page }) => {
  await page.goto(LIVE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("hero-card")).toBeVisible();
  await expect(page.getByTestId("right-agent-panel")).toBeVisible();

  await page.screenshot({
    path: "test-results/live-01-dashboard.png",
    fullPage: true,
  });
});

test("LIVE · Agent/Boost page loads", async ({ page }) => {
  await page.goto(`${LIVE}/agent`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("execute-btn")).toBeVisible();

  await page.screenshot({
    path: "test-results/live-02-agent-page.png",
    fullPage: true,
  });
});

test("LIVE · Judge page loads without wallet", async ({ page }) => {
  await page.goto(`${LIVE}/judge`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exit judge mode" }).first()).toBeVisible();
  await expect(page.getByTestId("judge-integrity-auditor")).toContainText(
    /Integrity Auditor: (Approved|Rejected)/,
  );
  await expect(page.getByRole("link", { name: /Open (latest|ProofRegistry) tx/ }).first()).toBeVisible();

  await page.screenshot({
    path: "test-results/live-02b-judge-page.png",
    fullPage: true,
  });
});

test("LIVE · Judge network switcher toggles testnet and mainnet", async ({ page }) => {
  await page.goto(`${LIVE}/judge`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const mainnetButton = page.getByTestId("judge-network-mainnet");
  const testnetButton = page.getByTestId("judge-network-testnet");

  await expect(mainnetButton).toBeVisible();
  await expect(testnetButton).toBeVisible();

  if (!(await testnetButton.isDisabled())) {
    await testnetButton.click();
    await expect(testnetButton).toContainText("Current review network");
  }

  if (!(await mainnetButton.isDisabled())) {
    await mainnetButton.click();
    await expect(mainnetButton).toContainText("Current review network");
  }
});

test("LIVE · Marketplace keeps Strategy NFT listings visible", async ({ page }) => {
  await page.goto(`${LIVE}/marketplace`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await expect(
    page.getByRole("heading", { name: "Adopt proof-backed yield strategies." }),
  ).toBeVisible();
  await expect(page.getByText(/Strategy NFT #/).first()).toBeVisible({
    timeout: 30000,
  });
});

test("LIVE · Proof modal opens", async ({ page }) => {
  await page.goto(LIVE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await page.getByTestId("view-proof-banner").click();
  await expect(page.getByTestId("proof-modal")).toBeVisible();

  await page.screenshot({
    path: "test-results/live-03-proof-modal.png",
    fullPage: true,
  });
});

test("LIVE · All sidebar routes reachable (200)", async ({ page }) => {
  const pages = ["/", "/agent", "/portfolio", "/strategies", "/opportunities", "/history", "/analytics", "/watchlist", "/agents", "/judge", "/docs", "/settings"];
  const broken: string[] = [];

  for (const p of pages) {
    const response = await page.request.get(`${LIVE}${p}`);
    if (response.status() >= 400) {
      broken.push(`${p} → ${response.status()}`);
    }
  }

  expect(broken, `Broken routes: ${broken.join(", ")}`).toHaveLength(0);
});

test("LIVE · API routes respond (200 or 429)", async ({ page }) => {
  const routes = [
    "/api/portfolio/summary",
    "/api/strategies",
    "/api/opportunities",
    "/api/history",
    "/api/analytics",
    "/api/watchlist",
    "/api/settings",
  ];

  const broken: string[] = [];

  for (const route of routes) {
    const response = await page.request.get(`${LIVE}${route}`);
    const s = response.status();
    if (s !== 200 && s !== 429) {
      broken.push(`${route} → ${s}`);
    } else {
      console.log(`[LIVE] ${route} → ${s}`);
    }
    await page.waitForTimeout(300);
  }

  expect(broken, `Broken API routes: ${broken.join(", ")}`).toHaveLength(0);
});
