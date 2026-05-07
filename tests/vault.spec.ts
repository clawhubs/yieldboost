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
