import { expect, test } from "@playwright/test";

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3020"}`;
const DEMO_WALLET =
  process.env.NEXT_PUBLIC_DEMO_WALLET_ADDRESS ??
  "0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D";
const DEMO_NETWORK = process.env.ZG_NETWORK_KEY === "mainnet" ? "mainnet" : "testnet";
const TESTNET_NETWORK = "testnet";
const ARTIFACT_ID_PATTERN = /^(0x[a-fA-F0-9]{64}|local-[a-fA-F0-9]{64})$/;

function buildTestPortfolioSnapshot() {
  return {
    tokens: [
      { symbol: "USDC", amount: 660, valueUSD: 660 },
      { symbol: "0G", amount: 360, valueUSD: 360 },
      { symbol: "BONZO", amount: 180, valueUSD: 180 },
    ],
    totalUSD: 1200,
    currentAPY: 4.2,
    displayTotal: 1200,
    displayUnit: "USD",
    displayLabel: "Seeded demo wallet snapshot",
  };
}

type TestPortfolioSnapshot = {
  tokens: Array<{ symbol: string; amount: number; valueUSD: number }>;
  totalUSD: number;
  currentAPY: number;
  displayTotal?: number;
  displayUnit?: string;
  displayLabel?: string;
};

function buildApprovedOptimizationResult(snapshot: TestPortfolioSnapshot) {
  const liveSymbols = snapshot.tokens
    .filter((token) => token.amount > 0 || token.valueUSD > 0)
    .map((token) => token.symbol.toUpperCase());
  const routeSymbols = liveSymbols.slice(0, 2);
  const recommended =
    routeSymbols.length >= 2
      ? `${routeSymbols[0]} / ${routeSymbols[1]} rebalance`
      : `${routeSymbols[0] ?? "0G"} rebalance`;
  const currentApy = Number(snapshot.currentAPY.toFixed(2));
  const optimizedApy = Number((currentApy + 4.1).toFixed(2));
  const estimatedAnnualGain = Number(
    Math.max(snapshot.totalUSD * ((optimizedApy - currentApy) / 100), 0.01).toFixed(2),
  );
  const yieldIncreasePct = Number(
    (((optimizedApy - currentApy) / Math.max(currentApy, 0.01)) * 100).toFixed(2),
  );

  return {
    current_apy: currentApy,
    optimized_apy: optimizedApy,
    yield_increase: estimatedAnnualGain,
    yield_increase_pct: yieldIncreasePct,
    top_protocols: [{ name: recommended, apy: optimizedApy, risk: "medium" }],
    recommended,
    confidence: 91,
    executionSeconds: 6.4,
    estimatedAnnualGain,
    totalPortfolio: snapshot.totalUSD,
    reasoning: "Testing live proof write with a deterministic optimize response aligned to the wallet snapshot.",
    riskProfile: "Moderate",
  };
}

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

async function enableDemoWatchMode(
  page: import("@playwright/test").Page,
  network: "testnet" | "mainnet" = DEMO_NETWORK,
) {
  const url = new URL(BASE);

  await page.context().addCookies([
    {
      name: "yb_wallet",
      value: DEMO_WALLET,
      url: url.origin,
    },
    {
      name: "yb_wallet_network",
      value: network,
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
    { wallet: DEMO_WALLET, network },
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
  await page.goto(`${BASE}/judge`, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByTestId("judge-network-sync-overlay")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Mainnet review starts here." })).toBeVisible();
  await expect(page.getByText("Latest proof and wallet snapshot")).toBeVisible();
  await expect(page.getByText("ZK-Proof")).toBeVisible();
  await expect(page.getByText("Governance").first()).toBeVisible();
  await expect(page.getByText("Neural Handshake").first()).toBeVisible();
  await expect(page.getByText("ZK Proof CID", { exact: true })).toBeVisible();
  await expect(page.getByText("Governance CID", { exact: true })).toBeVisible();
  await expect(page.getByText("Handshake CID", { exact: true })).toBeVisible();
  const integrityAuditor = page.getByTestId("judge-integrity-auditor");
  if ((await integrityAuditor.count()) > 0) {
    await expect(integrityAuditor).toContainText(
      /Integrity Auditor: (Approved|Rejected)/,
    );
  }
  await expect(page.getByText("Judge wallet:")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open (latest|ProofRegistry) tx/ }).first()).toBeVisible();
});

test("testnet ZKR, governance, and handshake artifacts are exposed by backend routes", async ({
  request,
}) => {
  const [zkResponse, governanceResponse, handshakeResponse] = await Promise.all([
    request.get(`${BASE}/api/zk/verify?network=testnet&wallet=${DEMO_WALLET}`),
    request.get(`${BASE}/api/governance/evaluate?network=testnet&wallet=${DEMO_WALLET}`),
    request.get(`${BASE}/api/agents/handshake?network=testnet&wallet=${DEMO_WALLET}`),
  ]);

  expect(zkResponse.ok()).toBeTruthy();
  expect(governanceResponse.ok()).toBeTruthy();
  expect(handshakeResponse.ok()).toBeTruthy();

  const zk = await zkResponse.json();
  const governance = await governanceResponse.json();
  const handshake = await handshakeResponse.json();

  expect(["testnet-verified", "tee-envelope-recorded", "zk-ready"]).toContain(
    zk.data.latest.status,
  );
  expect(zk.data.latest.proofCid).toMatch(ARTIFACT_ID_PATTERN);
  if (zk.data.latest.txHash) {
    expect(zk.data.latest.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  }
  expect(governance.data.latest.status).toBe("active");
  expect(governance.data.latest.artifactCid).toMatch(ARTIFACT_ID_PATTERN);
  if (governance.data.latest.txHash) {
    expect(governance.data.latest.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  }
  expect(handshake.data.latest.status).toBe("completed");
  expect(handshake.data.latest.artifactCid).toMatch(ARTIFACT_ID_PATTERN);
  if (handshake.data.latest.txHash) {
    expect(handshake.data.latest.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  }
});

test("mainnet judge surfaces live integrity artifacts after recorded optimize flow", async ({
  page,
}) => {
  await enableDemoWatchMode(page, "mainnet");
  await page.goto(`${BASE}/judge`, { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Mainnet review starts here." }),
  ).toBeVisible();
  await expect(page.getByTestId("judge-network-sync-overlay")).toHaveCount(0);

  await expect(page.getByText("Sovereign Memory").first()).toBeVisible();
  await expect(page.getByText("Hallucination Blacklist").first()).toBeVisible();
  await expect(page.getByText("Multiverse Stress Test").first()).toBeVisible();
  await expect(page.getByText("ZK-Proof").first()).toBeVisible();
  await expect(page.getByText("Governance").first()).toBeVisible();
  await expect(page.getByText("Neural Handshake").first()).toBeVisible();

  await expect(page.getByText("Tee Envelope Recorded")).toBeVisible();
  await expect(page.getByText("Active").first()).toBeVisible();
  await expect(page.getByText("Completed").first()).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Open memory tx on Chainscan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open blacklist tx on Chainscan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open stress tx on Chainscan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open ZK proof anchor on Chainscan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open governance tx on Chainscan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open handshake tx on Chainscan" }),
  ).toBeVisible();
});

test("mainnet dashboard surfaces the latest ZK compliance report", async ({
  page,
}) => {
  await enableDemoWatchMode(page, "mainnet");
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(page.getByTestId("zk-compliance-report")).toContainText(
    /Last Strategy Execution: 100% Policy Compliant \(Proof ID: 0x/i,
  );
});

test("direct judge entry bootstraps the review wallet across dashboard and history", async ({
  page,
}) => {
  await clearWalletState(page);
  await page.goto(`${BASE}/judge`, { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(page.getByText(/Judge wallet:\s*0x8a3c/i)).toBeVisible();

  await page.getByRole("link", { name: "Open dashboard" }).click();
  await expect(page).toHaveURL(BASE);
  await expect(page.getByTestId("sidebar")).toContainText("Judge mode");
  await expect(page.getByTestId("boost-yield-cta")).toBeDisabled();

  const historyResponse = await page.goto(`${BASE}/history`, { waitUntil: "domcontentloaded" });
  expect(historyResponse?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Execution History & Proof Ledger" })).toBeVisible();
});

test("judge network switcher can toggle testnet and mainnet review state", async ({
  page,
}) => {
  await clearWalletState(page);
  await page.goto(`${BASE}/judge`, { waitUntil: "domcontentloaded" });

  const switcher = page.getByTestId("judge-network-switcher");
  const mainnetButton = page.getByTestId("judge-network-mainnet");
  const testnetButton = page.getByTestId("judge-network-testnet");

  await expect(switcher).toBeVisible();
  await expect(mainnetButton).toBeVisible();
  await expect(testnetButton).toBeVisible();

  if (!(await testnetButton.isDisabled())) {
    await testnetButton.click();
    await expect(page.getByTestId("judge-network-sync-overlay")).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Testnet comparison snapshot." }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("judge-network-testnet")).toContainText(
      "Current review network",
      { timeout: 30_000 },
    );
    await expect(
      page.getByText(/Testnet Verified|Tee Envelope Recorded|Zk Ready/).first(),
    ).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
    await expect(page.getByText("Completed").first()).toBeVisible();
    const testnetStorageNetwork = await page.evaluate(() =>
      window.localStorage.getItem("yb_wallet_network"),
    );
    expect(testnetStorageNetwork).toBe("testnet");
    const testnetCookies = await page.context().cookies();
    expect(
      testnetCookies.find((cookie) => cookie.name === "yb_wallet_network")?.value,
    ).toBe("testnet");
  }

  const refreshedMainnetButton = page.getByTestId("judge-network-mainnet");
  if (!(await refreshedMainnetButton.isDisabled())) {
    await refreshedMainnetButton.click();
    await expect(page.getByTestId("judge-network-sync-overlay")).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(page.getByTestId("judge-network-mainnet")).toContainText(
      "Current review network",
      { timeout: 30_000 },
    );
    await expect(
      page.getByRole("heading", { name: "Mainnet review starts here." }),
    ).toBeVisible({
      timeout: 30_000,
    });
    const mainnetStorageNetwork = await page.evaluate(() =>
      window.localStorage.getItem("yb_wallet_network"),
    );
    expect(mainnetStorageNetwork).toBe("mainnet");
    const mainnetCookies = await page.context().cookies();
    expect(
      mainnetCookies.find((cookie) => cookie.name === "yb_wallet_network")?.value,
    ).toBe("mainnet");
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
  await page.goto(`${BASE}/marketplace`, { waitUntil: "domcontentloaded" });

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
        zkComplianceProof: {
          proofId:
            "0x8152d70f376f1119932457c9c98ef0f43fd495a19867471ca9f8be070ddf73b1",
          status: "verified",
          policyCompliantPct: 100,
          summary:
            "Deterministic policy verifier confirmed the latest strategy run is 100% compliant.",
          explorerUrl:
            "https://chainscan-galileo.0g.ai/tx/0xd086a8015810dfa8cb49242f0c9f2351407ff66d6b95c1eb5586581bdcc073b1",
          proofRegistryExplorerUrl:
            "https://chainscan-galileo.0g.ai/tx/0x7028b3002c2dd849be9266b4821ce7d3fff81bb07df851c63611b26b112be307",
        },
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
  await expect(page.getByTestId("zk-compliance-report")).toContainText(
    /Last Strategy Execution: 100% Policy Compliant \(Proof ID: 0x/i,
  );
  await expect(page.getByTestId("view-proof-banner")).toBeVisible();
});

test("1-click optimize plus testnet integrity stack surfaces all live feature cards in Judge", async ({
  page,
  request,
}) => {
  test.setTimeout(240_000);

  await enableDemoWatchMode(page, TESTNET_NETWORK);
  const portfolioResponse = await request.get(
    `${BASE}/api/portfolio?wallet=${DEMO_WALLET}&network=${TESTNET_NETWORK}`,
  );
  expect(portfolioResponse.ok()).toBeTruthy();

  const portfolioPayload = (await portfolioResponse.json()) as {
    tokens?: Array<{ symbol: string; amount: number; valueUSD: number }>;
    totalUSD?: number;
    currentAPY?: number;
    displayTotal?: number;
    displayUnit?: string;
    displayLabel?: string;
  };
  const portfolioSnapshot = portfolioPayload.tokens?.length
    ? {
        tokens: portfolioPayload.tokens,
        totalUSD: portfolioPayload.totalUSD ?? 0,
        currentAPY: portfolioPayload.currentAPY ?? 0,
        displayTotal: portfolioPayload.displayTotal,
        displayUnit: portfolioPayload.displayUnit,
        displayLabel: portfolioPayload.displayLabel,
      }
    : buildTestPortfolioSnapshot();
  const approvedOptimizationResult = buildApprovedOptimizationResult(portfolioSnapshot);
  const optimizationHeader = JSON.stringify(approvedOptimizationResult);

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

  await page.goto(BASE, { waitUntil: "networkidle" });

  const optimizeButton = page.getByTestId("boost-yield-cta");
  await expect(optimizeButton).toBeEnabled({ timeout: 30_000 });
  let proofPayload:
    | {
        success?: boolean;
        cid?: string;
        txHash?: string;
        sovereignMemory?: { cid?: string; txHash?: string; explorerUrl?: string };
      }
    | null = null;

  await optimizeButton.click();
  const proofResponse = await page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/0g/store") &&
        response.request().method() === "POST",
      { timeout: 90_000 },
    )
    .catch(() => null);

  await expect(page.getByTestId("proof-banner")).toContainText(
    /Proof stored as|proof sync is currently blocked|Proof sync is running in the background/i,
    { timeout: 60_000 },
  );

  if (proofResponse) {
    expect(proofResponse.status()).toBe(200);

    proofPayload = (await proofResponse.json()) as {
      success?: boolean;
      cid?: string;
      txHash?: string;
      sovereignMemory?: { cid?: string; txHash?: string; explorerUrl?: string };
    };

    expect(proofPayload.success).toBe(true);
    expect(proofPayload.cid).toMatch(ARTIFACT_ID_PATTERN);
    expect(proofPayload.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(proofPayload.sovereignMemory?.cid).toMatch(ARTIFACT_ID_PATTERN);
    if (proofPayload.sovereignMemory?.txHash) {
      expect(proofPayload.sovereignMemory.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }
  }

  const rejectedBlacklistDecision = {
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
  };
  const rejectedBlacklistSnapshot = {
    tokens: [],
    totalUSD: 0,
    currentAPY: 0,
  };

  const [
    blacklistResponse,
    stressResponse,
    zkResponse,
    governanceResponse,
    handshakeResponse,
  ] = await Promise.all([
    request.post(`${BASE}/api/auditor/blacklist`, {
      data: {
        networkKey: TESTNET_NETWORK,
        decision: rejectedBlacklistDecision,
        portfolioSnapshot: rejectedBlacklistSnapshot,
      },
    }),
    request.post(`${BASE}/api/stress-test/run`, {
      data: {
        networkKey: TESTNET_NETWORK,
        walletAddress: DEMO_WALLET,
      },
    }),
    request.post(`${BASE}/api/zk/verify`, {
      data: {
        networkKey: TESTNET_NETWORK,
        walletAddress: DEMO_WALLET,
        agentId: DEMO_WALLET,
        decision: approvedOptimizationResult,
        portfolioSnapshot,
        reasoning: approvedOptimizationResult.reasoning,
        summary: "Playwright validation of ZK-ready reasoning envelope after 1-click optimize.",
      },
    }),
    request.post(`${BASE}/api/governance/evaluate`, {
      data: {
        networkKey: TESTNET_NETWORK,
        walletAddress: DEMO_WALLET,
        agentId: DEMO_WALLET,
        evaluatedAction: "playwright-optimize-validation",
        decision: approvedOptimizationResult,
        portfolioSnapshot,
        enforce: true,
      },
    }),
    request.post(`${BASE}/api/agents/handshake`, {
      data: {
        networkKey: TESTNET_NETWORK,
        walletAddress: DEMO_WALLET,
        requestingAgent: "YieldBoost Optimizer Agent",
        respondingAgent: "Integrity Auditor Agent",
        handshakeType: "cross-agent-neural-handshake",
        skillPurpose: "Cross-check deterministic proof envelope after UI optimize",
        summary: "Playwright handshake validation after 1-click optimize.",
      },
    }),
  ]);

  expect(blacklistResponse.ok()).toBeTruthy();
  expect(stressResponse.ok()).toBeTruthy();
  expect(zkResponse.ok()).toBeTruthy();
  expect(governanceResponse.ok()).toBeTruthy();
  expect(handshakeResponse.ok()).toBeTruthy();

  const blacklist = await blacklistResponse.json();
  const stress = await stressResponse.json();
  const zk = await zkResponse.json();
  const governance = await governanceResponse.json();
  const handshake = await handshakeResponse.json();

  expect(blacklist.data.cid).toMatch(ARTIFACT_ID_PATTERN);
  expect(stress.data.reportCid).toMatch(ARTIFACT_ID_PATTERN);
  expect(stress.data.verdict).toBe("PASS");
  expect(["testnet-verified", "tee-envelope-recorded", "zk-ready"]).toContain(
    zk.data.status,
  );
  expect(zk.data.proofCid).toMatch(ARTIFACT_ID_PATTERN);
  expect(governance.data.status).toBe("active");
  expect(governance.data.artifactCid).toMatch(ARTIFACT_ID_PATTERN);
  expect(handshake.data.status).toBe("completed");
  expect(handshake.data.artifactCid).toMatch(ARTIFACT_ID_PATTERN);

  await page.goto(`${BASE}/judge`, { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Testnet comparison snapshot." }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("judge-network-testnet")).toContainText(
    "Current review network",
  );

  await expect(page.getByText("Sovereign Memory").first()).toBeVisible();
  await expect(page.getByText(/Latest memory CID/i).first()).toBeVisible();
  await expect(page.getByText("Hallucination Blacklist").first()).toBeVisible();
  await expect(page.getByText(/Latest rejection indexed/i).first()).toBeVisible();
  await expect(page.getByText("Multiverse Stress Test").first()).toBeVisible();
  await expect(page.getByText("PASS").first()).toBeVisible();
  await expect(page.getByText("ZK-Proof")).toBeVisible();
  await expect(
    page.getByText(
      zk.data.status
        .split("-")
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    ).first(),
  ).toBeVisible();
  await expect(page.getByText("Governance").first()).toBeVisible();
  await expect(page.getByText("Active").first()).toBeVisible();
  await expect(page.getByText("Neural Handshake").first()).toBeVisible();
  await expect(page.getByText("Completed").first()).toBeVisible();
  await expect(page.getByText("Memory CID", { exact: true })).toBeVisible();
  await expect(page.getByText("Blacklist CID", { exact: true })).toBeVisible();
  await expect(page.getByText("Stress Report CID", { exact: true })).toBeVisible();
  await expect(page.getByText("ZK Proof CID", { exact: true })).toBeVisible();
  await expect(page.getByText("Governance CID", { exact: true })).toBeVisible();
  await expect(page.getByText("Handshake CID", { exact: true })).toBeVisible();
  if (proofPayload?.sovereignMemory?.explorerUrl) {
    await expect(page.getByRole("link", { name: /Open memory tx on Chainscan/i })).toBeVisible();
  }
  if (blacklist.data.explorerUrl) {
    await expect(page.getByRole("link", { name: /Open blacklist tx on Chainscan/i })).toBeVisible();
  }
  if (stress.data.explorerUrl) {
    await expect(page.getByRole("link", { name: /Open stress tx on Chainscan/i })).toBeVisible();
  }
  if (zk.data.proofRegistryExplorerUrl || zk.data.explorerUrl) {
    await expect(page.getByRole("link", { name: /Open ZK proof/i }).first()).toBeVisible();
  }
  if (governance.data.explorerUrl) {
    await expect(page.getByRole("link", { name: /Open governance tx on Chainscan/i })).toBeVisible();
  }
  if (handshake.data.explorerUrl) {
    await expect(page.getByRole("link", { name: /Open handshake tx on Chainscan/i })).toBeVisible();
  }
});

test("integrity auditor rejects hallucinated proof writes before storage", async ({
  request,
}) => {
  test.setTimeout(120_000);

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

  const historyResponse = await page.goto(`${BASE}/history`, { waitUntil: "domcontentloaded" });
  expect(historyResponse?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Execution History & Proof Ledger" })).toBeVisible();

  const agentsResponse = await page.goto(`${BASE}/agents`, { waitUntil: "domcontentloaded" });
  expect(agentsResponse?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Agent Gallery" })).toBeVisible();

  const judgeResponse = await page.goto(`${BASE}/judge`, { waitUntil: "domcontentloaded" });
  expect(judgeResponse?.ok()).toBeTruthy();
  await expect(page.getByTestId("judge-page")).toBeVisible();
});
