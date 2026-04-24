import { expect, test } from "@playwright/test";

test("dashboard desktop composition matches the mockup structure", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const sidebar = page.getByTestId("sidebar");
  const hero = page.getByTestId("hero-card");
  const rightPanel = page.getByTestId("right-agent-panel");
  const chart = page.getByTestId("yield-chart");
  const proofBanner = page.getByTestId("proof-banner");
  const executeButton = page.getByTestId("execute-btn");
  const resultCard = page.getByTestId("optimization-result");

  await expect(sidebar).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(rightPanel).toBeVisible();
  await expect(chart).toBeVisible();
  await expect(proofBanner).toBeVisible();
  await expect(executeButton).toBeVisible();
  await expect(resultCard).toBeVisible();

  const sidebarBox = await sidebar.boundingBox();
  const heroBox = await hero.boundingBox();
  const rightPanelBox = await rightPanel.boundingBox();

  expect(sidebarBox).not.toBeNull();
  expect(heroBox).not.toBeNull();
  expect(rightPanelBox).not.toBeNull();

  expect(sidebarBox!.width).toBeGreaterThan(220);
  expect(sidebarBox!.width).toBeLessThan(260);
  expect(rightPanelBox!.width).toBeGreaterThan(300);
  expect(rightPanelBox!.width).toBeLessThan(360);
  expect(heroBox!.width).toBeGreaterThan(760);
  expect(heroBox!.height).toBeGreaterThan(180);

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(scrollHeight).toBeLessThanOrEqual(1200);

  await page.screenshot({
    path: "test-results/dashboard-desktop-chromium.png",
    fullPage: true,
  });
});
