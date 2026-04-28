import { expect, test } from "@playwright/test";

test("dashboard composition renders in no-wallet review mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("yb_wallet_override");
    window.localStorage.removeItem("yb_wallet_network");
    window.localStorage.removeItem("yb_wallet_provider");
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
