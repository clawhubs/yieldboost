import { expect, test } from "@playwright/test";

test("Vault dashboard loads the forge, pipeline, and vault panels", async ({ page }) => {
  await page.goto("/vault", { waitUntil: "networkidle" });

  await expect(page.getByText("YIELDBOOST VAULT")).toBeVisible();
  await expect(page.getByRole("heading", { name: "CRACK THE SHIELD: 6-Month Dedicated VPS Prize" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Forge" })).toBeVisible();
  await expect(page.getByText("Integrity Pipeline")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live Challenge Vault" })).toBeVisible();
  await expect(page.getByText("challenge-vault.enc")).toBeVisible();
  await expect(page.getByText("Founder Upload Pending").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Vault" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Seal", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Founder Upload Pending" })).toBeDisabled();

  await page.screenshot({
    path: "test-results/vault-desktop.png",
    fullPage: true,
  });
});

test("Vault dashboard keeps primary panels usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vault", { waitUntil: "networkidle" });

  await expect(page.getByText("YIELDBOOST VAULT")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Forge" })).toBeVisible();
  await expect(page.getByText("L1: Hallucination Blacklist")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live Challenge Vault" })).toBeVisible();
  await expect(page.getByText("challenge-vault.enc")).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect Wallet" })).toBeVisible();

  await page.screenshot({
    path: "test-results/vault-mobile.png",
    fullPage: true,
  });
});

test("seal flow shows a visible 9-layer progress banner", async ({ page }) => {
  await page.addInitScript(() => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const account = "0x5C78269a85Bc1fB36fe31D5aa84ad98E14B95525";
    let currentChainId = "0x40da";
    let authorizedAccounts: string[] = [];

    const provider = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === "eth_accounts") return authorizedAccounts;
        if (method === "eth_requestAccounts") {
          authorizedAccounts = [account];
          listeners.get("accountsChanged")?.forEach((listener) => listener([account]));
          return authorizedAccounts;
        }
        if (method === "wallet_requestPermissions") {
          authorizedAccounts = [account];
          return [{ parentCapability: "eth_accounts" }];
        }
        if (method === "wallet_revokePermissions") {
          authorizedAccounts = [];
          return null;
        }
        if (method === "eth_chainId") return currentChainId;
        if (method === "net_version") return String(Number.parseInt(currentChainId, 16));
        if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") {
          const requested = Array.isArray(params) ? params[0] as { chainId?: string } : undefined;
          currentChainId = requested?.chainId ?? currentChainId;
          listeners.get("chainChanged")?.forEach((listener) => listener(currentChainId));
          return null;
        }
        if (method === "eth_sendTransaction") {
          return "0x1111111111111111111111111111111111111111111111111111111111111111";
        }
        if (method === "personal_sign") {
          return "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1b";
        }
        return null;
      },
      on: (event: string, listener: (...args: unknown[]) => void) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)?.add(listener);
      },
      removeListener: (event: string, listener: (...args: unknown[]) => void) => {
        listeners.get(event)?.delete(listener);
      },
    };

    Object.defineProperty(window, "ethereum", {
      value: provider,
      configurable: true,
    });
  });

  await page.route("**/api/vault/v1/auth/challenge", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        challenge_id: "seal-test",
        message: "Seal this test payload",
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    });
  });
  await page.route("**/api/vault/v1/integrity/seal", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        storage_id: "vault_playwright_progress",
        integrity_hash: "integrity_playwright_progress",
        payload_sha256: "payload_playwright_progress",
        mime_type: "text/plain",
        layer_statuses: {
          L1: "Passed",
          L2: "Passed",
          L3: "Passed",
          L4: "Passed",
          L5: "Passed",
          L6: "Passed",
          L7: "Passed",
          L8: "Passed",
          L9: "Passed",
        },
      }),
    });
  });
  await page.route("**/api/ya/voucher/issue", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, eligible: false, alreadyEligible: true, amountYa: 888 }),
    });
  });

  await page.goto("/vault", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(page.getByText(/0x5C78.*0G Testnet/i)).toBeVisible();
  await page.getByPlaceholder("Secret message").fill("Playwright seal progress smoke test");
  await page.getByRole("button", { name: "Seal", exact: true }).click();

  const progressBanner = page.getByTestId("vault-seal-progress-banner");
  await expect(progressBanner).toBeVisible();
  await expect(
    page.getByText(/Waiting for wallet confirmation|9-layer seal pipeline running|Upload accepted|Sync almost complete/),
  ).toBeVisible();
  await expect(page.getByText("Your file is being sealed by the 9-layer vault pipeline.")).toBeVisible();
  await expect(progressBanner.getByText("L1", { exact: true })).toBeVisible();
  await expect(progressBanner.getByText("L9", { exact: true })).toBeVisible();
});
