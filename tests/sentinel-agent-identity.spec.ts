import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { Wallet } from "ethers";

const WALLET_FILE =
  process.env.YB_SENTINEL_WALLET_KEY_FILE ??
  "/home/cucu/Coder/Private key wallet/private";

function loadUserWallets(limit = 3) {
  const raw = readFileSync(WALLET_FILE, "utf8");
  return [
    ...new Set(
      (raw.match(/0x[a-fA-F0-9]{64}|\b[a-fA-F0-9]{64}\b/g) ?? []).map((value) =>
        value.startsWith("0x") ? value : `0x${value}`,
      ),
    ),
  ]
    .slice(0, limit)
    .map((privateKey) => new Wallet(privateKey).address);
}

test.describe.configure({ mode: "serial" });

test("Sentinel agent_identity and TEE attestation run through 1-click optimize for user wallets on testnet", async ({
  browser,
}) => {
  test.setTimeout(420_000);

  test.skip(
    process.env.YB_SENTINEL_ENABLED !== "true",
    "Set YB_SENTINEL_ENABLED=true to run the local Sentinel layer test.",
  );

  const accountCount = Number.parseInt(process.env.YB_SENTINEL_TEST_ACCOUNTS ?? "3", 10);
  const wallets = loadUserWallets(accountCount);
  expect(wallets).toHaveLength(accountCount);

  for (const [index, walletAddress] of wallets.entries()) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.addInitScript((address) => {
      window.localStorage.removeItem("yb_judge_mode");
      window.localStorage.setItem("yb_wallet_override", address);
      window.localStorage.setItem("yb_wallet_network", "testnet");
      window.localStorage.removeItem("yb_wallet_provider");
      document.cookie = "yb_judge_mode=; path=/; max-age=0; SameSite=Lax";
      document.cookie = `yb_wallet=${address}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = "yb_wallet_network=testnet; path=/; max-age=31536000; SameSite=Lax";
    }, walletAddress);

    await page.goto("/agent", { waitUntil: "networkidle" });

    await expect(page.getByTestId("execute-btn")).toBeEnabled({
      timeout: 45_000,
    });
    await page
      .locator("textarea[name='prompt']")
      .fill(
        `Optimize my portfolio for best yield with low risk. TEE verified Sentinel run ${Date.now()} account ${index + 1}.`,
      );

    const proofResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/0g/store") &&
        response.request().method() === "POST",
      { timeout: 180_000 },
    );

    await page.getByTestId("execute-btn").click();
    const proofResponse = await proofResponsePromise;
    expect(proofResponse.status()).toBe(200);

    const payload = (await proofResponse.json()) as {
      success?: boolean;
      walletAddress?: string;
      networkKey?: string;
      teeVerified?: boolean;
      teeProvider?: string;
      teeChatId?: string;
      teeSignedTextMatches?: boolean;
      teeVerificationMethod?: string;
      teeServiceAttestationVerified?: boolean;
      teeServiceSignerMatched?: boolean;
      teeServiceComposeVerified?: boolean;
      sentinelProof?: {
        status?: string;
        proofGenerated?: boolean;
        publicSignals?: {
          agentCommitment?: string;
          actionContextHash?: string;
          sessionNullifier?: string;
        };
      };
    };

    expect(payload.success).toBe(true);
    expect(payload.networkKey).toBe("testnet");
    expect(payload.walletAddress?.toLowerCase()).toBe(walletAddress.toLowerCase());
    expect(payload.sentinelProof?.status).toBe("verified");
    expect(payload.sentinelProof?.proofGenerated).toBe(true);
    expect(payload.sentinelProof?.publicSignals?.agentCommitment).toMatch(/^\d+$/);
    expect(payload.sentinelProof?.publicSignals?.sessionNullifier).toMatch(/^\d+$/);
    expect(payload.teeVerified).toBe(true);
    expect(payload.teeProvider).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(payload.teeChatId).toBeTruthy();
    expect([
      "broker-response-signature",
      "service-attestation-report",
    ]).toContain(payload.teeVerificationMethod);
    if (payload.teeVerificationMethod === "broker-response-signature") {
      expect(payload.teeSignedTextMatches).toBe(true);
    } else {
      expect(payload.teeServiceAttestationVerified).toBe(true);
      expect(payload.teeServiceSignerMatched).toBe(true);
      expect(payload.teeServiceComposeVerified).toBe(true);
    }

    await expect(page.getByTestId("sentinel-layer-card")).toContainText(
      "Noir agent_identity: verified",
      { timeout: 60_000 },
    );
    await expect(page.getByTestId("tee-attestation-card")).toContainText(
      "0G Compute: verified",
      { timeout: 60_000 },
    );
    await context.close();
  }
});
