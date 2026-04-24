import { expect, test } from "@playwright/test";

const LIVE = "https://yieldboost-ai.vercel.app";

test("LIVE · Dashboard loads on vercel", async ({ page }) => {
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

test("LIVE · Agent/Boost page loads on vercel", async ({ page }) => {
  await page.goto(`${LIVE}/agent`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("execute-btn")).toBeVisible();

  await page.screenshot({
    path: "test-results/live-02-agent-page.png",
    fullPage: true,
  });
});

test("LIVE · Proof modal opens on vercel", async ({ page }) => {
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
  const pages = ["/", "/agent", "/portfolio", "/strategies", "/opportunities", "/history", "/analytics", "/watchlist", "/docs", "/settings"];
  const broken: string[] = [];

  for (const p of pages) {
    const response = await page.request.get(`${LIVE}${p}`);
    if (response.status() >= 400) {
      broken.push(`${p} → ${response.status()}`);
    }
  }

  expect(broken, `Broken routes: ${broken.join(", ")}`).toHaveLength(0);
});

test("LIVE · API routes on vercel (200 or 429)", async ({ page }) => {
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
