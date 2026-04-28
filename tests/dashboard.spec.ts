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
