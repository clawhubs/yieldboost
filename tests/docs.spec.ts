import { expect, test } from "@playwright/test";

const docsRoutes = [
  "/docs",
  "/docs/overview",
  "/docs/why-yieldboost-ai",
  "/docs/getting-started",
  "/docs/how-1-click-works",
  "/docs/execute-optimization",
  "/docs/proof-and-verification",
  "/docs/0g-integration",
  "/docs/wallet-and-security",
  "/docs/faq",
  "/docs/troubleshooting",
  "/docs/architecture",
  "/docs/api-and-data-flow",
  "/docs/roadmap",
];

test("docs navigation is reachable from the app sidebar", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const docsLink = page.getByTestId("nav-docs");
  await expect(docsLink).toBeVisible();
  await docsLink.click();

  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByTestId("docs-sidebar")).toBeVisible();
  await expect(page.getByRole("heading", { name: "YieldBoost AI Docs Center" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" }).first()).toBeVisible();
});

test("docs routes render without 404 locally", async ({ page }) => {
  for (const route of docsRoutes) {
    const response = await page.goto(route, { waitUntil: "networkidle" });

    expect(response, `No response returned for ${route}`).not.toBeNull();
    expect(response?.status(), `Unexpected status for ${route}`).toBeLessThan(400);
  }
});
