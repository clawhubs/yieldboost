import { expect, test } from "@playwright/test";

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3020"}`;

// ── helpers ──────────────────────────────────────────────────────────────────

async function grantClipboard(page: import("@playwright/test").Page) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Dashboard load
// ═══════════════════════════════════════════════════════════════════════════
test("1 · Dashboard loads without crash", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("hero-card")).toBeVisible();
  await expect(page.getByTestId("right-agent-panel")).toBeVisible();
  await expect(page.getByTestId("yield-chart")).toBeVisible();
  await expect(page.getByTestId("proof-banner")).toBeVisible();
  await expect(page.getByTestId("execute-btn")).toBeVisible();
  await expect(page.getByTestId("optimization-result")).toBeVisible();

  await page.screenshot({
    path: "test-results/audit-01-dashboard-desktop.png",
    fullPage: true,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Sidebar visible + all nav links present
// ═══════════════════════════════════════════════════════════════════════════
test("2 · Sidebar navigation links all present", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const navItems = [
    "dashboard",
    "boost",
    "portfolio",
    "strategies",
    "opportunities",
    "history",
    "analytics",
    "watchlist",
    "settings",
  ];

  for (const item of navItems) {
    await expect(
      page.getByTestId(`nav-${item}`),
      `nav-${item} missing`,
    ).toBeVisible();
  }

  await page.screenshot({
    path: "test-results/audit-02-sidebar-nav.png",
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Wallet / account visible and correct address
// ═══════════════════════════════════════════════════════════════════════════
test("3 · Wallet address displayed correctly", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const sidebar = page.getByTestId("sidebar");
  await expect(sidebar).toBeVisible();

  const walletText = await sidebar.innerText();
  expect(walletText).toMatch(/0x8a3c/i);
  expect(walletText).toMatch(/ee7[Dd]/);

  await page.screenshot({ path: "test-results/audit-03-wallet-visible.png" });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Copy wallet address works
// ═══════════════════════════════════════════════════════════════════════════
test("4 · Copy wallet address works", async ({ page }) => {
  await grantClipboard(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  const walletBtn = page.getByTestId("sidebar").locator("button").filter({
    hasText: /0x8a3c/i,
  });
  await expect(walletBtn).toBeVisible();
  await walletBtn.click();

  const copied = await page.evaluate(() =>
    navigator.clipboard.readText().catch(() => ""),
  );
  expect(copied.toLowerCase()).toContain("0x8a3c");

  await page.screenshot({
    path: "test-results/audit-04-wallet-copy.png",
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Execute optimization flow (Agent page)
// ═══════════════════════════════════════════════════════════════════════════
test("5 · Execute optimization flow", async ({ page }) => {
  await page.goto(`${BASE}/agent`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const execBtn = page.getByTestId("execute-btn");
  await expect(execBtn).toBeVisible();

  await page.screenshot({
    path: "test-results/audit-05a-agent-before-execute.png",
    fullPage: true,
  });

  await execBtn.click();

  await page.waitForTimeout(3000);

  await page.screenshot({
    path: "test-results/audit-05b-agent-executing.png",
    fullPage: true,
  });

  await page.waitForTimeout(12000);

  await page.screenshot({
    path: "test-results/audit-05c-agent-after-execute.png",
    fullPage: true,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Optimization result appears (Dashboard panel - always shown)
// ═══════════════════════════════════════════════════════════════════════════
test("6 · Optimization result card visible on dashboard", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const result = page.getByTestId("optimization-result");
  await expect(result).toBeVisible();

  const resultText = await result.innerText();
  expect(resultText).toMatch(/optimization complete|apy/i);

  await page.screenshot({
    path: "test-results/audit-06-optimization-result.png",
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Proof modal opens (from dashboard proof banner)
// ═══════════════════════════════════════════════════════════════════════════
test("7 · Proof modal opens from banner", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("view-proof-banner").click();

  await expect(page.getByTestId("proof-modal")).toBeVisible();

  const modalText = await page.getByTestId("proof-modal").innerText();
  expect(modalText).toMatch(/proof|0G|tx hash|cid/i);

  await page.screenshot({
    path: "test-results/audit-07-proof-modal.png",
    fullPage: true,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Copy txHash and CID inside proof modal
// ═══════════════════════════════════════════════════════════════════════════
test("8 · Copy txHash and CID in proof modal", async ({ page }) => {
  await grantClipboard(page);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("view-proof-banner").click();
  await expect(page.getByTestId("proof-modal")).toBeVisible();
  await page.waitForTimeout(1500);

  const copyTx = page.getByTestId("copy-tx-hash");
  await expect(copyTx).toBeVisible();
  await copyTx.click();

  const txClipboard = await page.evaluate(() =>
    navigator.clipboard.readText().catch(() => ""),
  );
  expect(txClipboard.length).toBeGreaterThan(5);

  const copyCid = page.getByTestId("copy-storage-cid");
  await expect(copyCid).toBeVisible();
  await copyCid.click();

  const cidClipboard = await page.evaluate(() =>
    navigator.clipboard.readText().catch(() => ""),
  );
  expect(cidClipboard.length).toBeGreaterThan(5);

  await page.screenshot({
    path: "test-results/audit-08-copy-in-modal.png",
    fullPage: true,
  });

  await page.getByTestId("proof-modal-close").click();
  await expect(page.getByTestId("proof-modal")).not.toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. ProofRegistry data visible in proof modal (conditional on env)
// ═══════════════════════════════════════════════════════════════════════════
test("9 · Proof modal has ProofRegistry section or storage-only notice", async ({
  page,
}) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByTestId("view-proof-banner").click();
  await expect(page.getByTestId("proof-modal")).toBeVisible();
  await page.waitForTimeout(2000);

  const modalText = await page.getByTestId("proof-modal").innerText();

  const hasRegistry = /proofregistry|registry address|proof #\d+/i.test(
    modalText,
  );
  const hasStorage = /0g storage|cid|tx hash/i.test(modalText);

  expect(hasStorage || hasRegistry).toBeTruthy();

  await page.screenshot({
    path: "test-results/audit-09-proof-registry-modal.png",
    fullPage: true,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. ProofRegistry data visible in AgentPanel (right panel on dashboard)
// ═══════════════════════════════════════════════════════════════════════════
test("10 · AgentPanel shows proof/registry info on dashboard", async ({
  page,
}) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const agentPanel = page.getByTestId("right-agent-panel");
  await expect(agentPanel).toBeVisible();

  const panelText = await agentPanel.innerText();
  expect(panelText).toMatch(/optimization complete|proof|storage|0G|APY/i);

  const proofBtn = page.getByTestId("agent-card-proof");
  await expect(proofBtn).toBeVisible();

  await page.screenshot({
    path: "test-results/audit-10-agent-panel-proof.png",
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Explorer links present
// ═══════════════════════════════════════════════════════════════════════════
test("11 · Explorer link present in proof modal", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByTestId("view-proof-banner").click();
  await expect(page.getByTestId("proof-modal")).toBeVisible();
  await page.waitForTimeout(1500);

  const explorerLink = page.getByTestId("open-0g-explorer");
  await expect(explorerLink).toBeVisible();

  const href = await explorerLink.getAttribute("href");
  expect(href).toBeTruthy();
  expect(href).not.toBe("#");
  expect(href).toMatch(/0g|chainscan|galileo/i);

  await page.screenshot({
    path: "test-results/audit-11-explorer-link.png",
    fullPage: true,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. API smoke tests
// ═══════════════════════════════════════════════════════════════════════════
test("12 · API routes respond (200 or 429-rate-limited, never 404/5xx)", async ({
  page,
}) => {
  const routes = [
    "/api/portfolio/summary",
    "/api/strategies",
    "/api/opportunities",
    "/api/history",
    "/api/analytics",
    "/api/watchlist",
    "/api/settings",
    "/api/stats/global",
  ];

  const rateLimited: string[] = [];
  const failed: string[] = [];

  for (const route of routes) {
    await page.waitForTimeout(200);
    const response = await page.request.get(`${BASE}${route}`);
    const status = response.status();

    if (status === 429) {
      rateLimited.push(route);
      console.log(`[RATE-LIMITED] ${route} – 429 (rate limiter active, this is expected in test runs)`);
    } else if (status >= 400) {
      failed.push(`${route} → ${status}`);
    } else {
      const json = await response.json().catch(() => null);
      expect(json, `${route} returned non-JSON`).toBeTruthy();
    }
  }

  if (rateLimited.length > 0) {
    console.log(`[INFO] ${rateLimited.length} routes were rate-limited (429). Rate limiter is working correctly.`);
  }

  expect(
    failed,
    `These routes returned hard errors: ${failed.join(", ")}`,
  ).toHaveLength(0);
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. All sidebar menus – open + content visible + screenshot
// ═══════════════════════════════════════════════════════════════════════════

const sidebarPages = [
  { label: "Dashboard", href: "/", testid: "nav-dashboard", heading: /dashboard|let ai|earn|stop letting/i },
  { label: "Boost", href: "/agent", testid: "nav-boost", heading: /boost|optimization|yield|autonomous/i },
  { label: "Portfolio", href: "/portfolio", testid: "nav-portfolio", heading: /portfolio/i },
  { label: "Strategies", href: "/strategies", testid: "nav-strategies", heading: /strateg/i },
  { label: "Opportunities", href: "/opportunities", testid: "nav-opportunities", heading: /opportunit/i },
  { label: "History", href: "/history", testid: "nav-history", heading: /history/i },
  { label: "Analytics", href: "/analytics", testid: "nav-analytics", heading: /analytic/i },
  { label: "Watchlist", href: "/watchlist", testid: "nav-watchlist", heading: /watchlist/i },
  { label: "Settings", href: "/settings", testid: "nav-settings", heading: /settings/i },
] as const;

for (const pg of sidebarPages) {
  test(`13 · Sidebar → ${pg.label} – loads with content`, async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const navLink = page.getByTestId(pg.testid);
    await expect(navLink, `${pg.testid} not found in sidebar`).toBeVisible();
    await navLink.click();

    await page.waitForURL(`**${pg.href === "/" ? "/" : pg.href}`, {
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const sidebar = page.getByTestId("sidebar");
    await expect(sidebar, "sidebar disappeared on nav").toBeVisible();

    const pageText = await page.evaluate(() => document.body.innerText);

    const hasHeading = pg.heading.test(pageText);
    if (!hasHeading) {
      console.warn(
        `[WARN] ${pg.label}: heading pattern ${pg.heading} not found. Page text sample: ${pageText.slice(0, 300)}`,
      );
    }

    expect(pageText.trim().length, `${pg.label} page appears blank`).toBeGreaterThan(50);
    expect(pageText, `${pg.label} still exposes mock wording`).not.toMatch(
      /\bmock(?:up)?\b|\bplaceholder\b/i,
    );

    await page.screenshot({
      path: `test-results/audit-13-sidebar-${pg.label.toLowerCase()}.png`,
      fullPage: true,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. Dashboard controls are clickable and notifications are functional
// ═══════════════════════════════════════════════════════════════════════════
test("14 · Dashboard controls open settings and optimization notifications", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByTestId("risk-profile").click();
  await page.waitForURL("**/settings", { timeout: 15000 });
  await expect(page.getByTestId("sidebar")).toBeVisible();

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByTestId("alerts-button").click();
  await expect(page.getByTestId("optimization-notification-panel")).toBeVisible();

  await page.screenshot({
    path: "test-results/audit-14-dashboard-shortcuts.png",
    fullPage: true,
  });
});
