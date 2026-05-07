import { expect, test } from "@playwright/test";

test("YA faucet connects wallet and adds YA testnet token to MetaMask", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: { method: string; params?: unknown }[] = [];
    const account = "0x1234567890abcdef1234567890abcdef12345678";
    let currentChainId = "0x40da";

    Object.defineProperty(window, "__ybWalletCalls", {
      value: calls,
      configurable: true,
    });

    Object.defineProperty(window, "ethereum", {
      value: {
        request: async ({ method, params }: { method: string; params?: unknown }) => {
          calls.push({ method, params });
          if (method === "wallet_switchEthereumChain") {
            const requested = Array.isArray(params) ? params[0] as { chainId?: string } : undefined;
            currentChainId = requested?.chainId ?? currentChainId;
            return null;
          }
          if (method === "eth_requestAccounts") {
            return [account];
          }
          if (method === "eth_chainId") {
            return currentChainId;
          }
          if (method === "wallet_watchAsset") {
            return true;
          }
          return null;
        },
      },
      configurable: true,
    });
  });

  await page.route("**/api/ya/faucet/claim", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        amountYa: 888,
        txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        explorerUrl: "https://chainscan-galileo.0g.ai/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        migrationEligible: true,
      }),
    });
  });

  await page.goto("/faucet?voucher=YA-TEST-PLAY-WR", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(page.getByText("Wallet connected on 0G Galileo Testnet.")).toBeVisible();
  await expect(page.getByPlaceholder("0x1234...abcd")).toHaveValue("0x1234567890abcdef1234567890abcdef12345678");

  await page.getByRole("button", { name: "Add YA Testnet to Wallet" }).click();
  await expect(page.getByText("YA token is now available in MetaMask on 0G Galileo Testnet.")).toBeVisible();

  const watchAssetCall = await page.evaluate(() => {
    const calls = (window as typeof window & { __ybWalletCalls?: { method: string; params?: unknown }[] }).__ybWalletCalls || [];
    return calls.find((call) => call.method === "wallet_watchAsset");
  });
  expect(watchAssetCall).toBeTruthy();
  expect(JSON.stringify(watchAssetCall)).toContain("0xa8018A4920ecA7AF0Df88caCFD5E21b939A678b5");
  expect(JSON.stringify(watchAssetCall)).toContain("/token/ya-wallet.png");

  await page.getByRole("button", { name: "Claim exclusive 888 YA" }).click();
  await expect(page.getByText("Claimed 888 YA. This wallet is now migration-eligible.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add YA Testnet to MetaMask" })).toBeVisible();
});
