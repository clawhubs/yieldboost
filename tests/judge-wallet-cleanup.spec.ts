import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { Wallet } from "ethers";
import { DEFAULT_WALLET_ADDRESS } from "../lib/wallet";

const TEST_WALLET_FILE =
  process.env.YB_TEST_WALLET_KEY_FILE ??
  "/home/cucu/Coder/Private key wallet/private";
const TESTNET_CHAIN_ID_HEX = "0x40da";

function loadFirstTestWalletAddress() {
  const raw = readFileSync(TEST_WALLET_FILE, "utf8");
  const firstKey = (raw.match(/0x[a-fA-F0-9]{64}|\b[a-fA-F0-9]{64}\b/g) ?? [])[0];

  if (!firstKey) {
    throw new Error(`No private key found in ${TEST_WALLET_FILE}`);
  }

  return new Wallet(firstKey.startsWith("0x") ? firstKey : `0x${firstKey}`).address;
}

function shortAddr(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function seedConnectedTestnetWallet(
  page: import("@playwright/test").Page,
  walletAddress: string,
) {
  await page.addInitScript(
    ({ address, chainIdHex }) => {
      if (!window.sessionStorage.getItem("playwright_judge_wallet_seeded")) {
        window.sessionStorage.setItem("playwright_judge_wallet_seeded", "true");
        window.localStorage.setItem("yb_entry_mode_selected", "user");
        window.localStorage.removeItem("yb_judge_mode");
        window.localStorage.removeItem("yb_judge_network");
        window.localStorage.removeItem("yb_judge_previous_wallet");
        window.localStorage.removeItem("yb_judge_previous_provider");
        window.localStorage.removeItem("yb_judge_previous_network");
        window.localStorage.setItem("yb_wallet_override", address);
        window.localStorage.setItem("yb_wallet_network", "testnet");
        window.localStorage.setItem("yb_wallet_provider", "metamask");
        document.cookie = "yb_judge_mode=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "yb_judge_network=; path=/; max-age=0; SameSite=Lax";
        document.cookie = `yb_wallet=${address}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = "yb_wallet_network=testnet; path=/; max-age=31536000; SameSite=Lax";
      }

      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      let currentChainId = chainIdHex;
      let authorizedAccounts = [address];

      const emit = (event: string, payload?: unknown) => {
        listeners.get(event)?.forEach((listener) => listener(payload));
      };

      const provider = {
        isMetaMask: true,
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
          if (method === "eth_accounts" || method === "eth_requestAccounts") {
            return authorizedAccounts;
          }
          if (method === "eth_chainId") {
            return currentChainId;
          }
          if (method === "wallet_requestPermissions") {
            return [{ parentCapability: "eth_accounts" }];
          }
          if (method === "wallet_revokePermissions") {
            return null;
          }
          if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") {
            const requested = Array.isArray(params)
              ? (params[0] as { chainId?: string } | undefined)
              : undefined;
            currentChainId = requested?.chainId ?? currentChainId;
            emit("chainChanged", currentChainId);
            return null;
          }
          return null;
        },
        on: (event: string, listener: (...args: unknown[]) => void) => {
          if (!listeners.has(event)) {
            listeners.set(event, new Set());
          }
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

      Object.defineProperty(window, "__testWalletProvider", {
        value: {
          emitAccountsChanged(accounts: string[]) {
            authorizedAccounts = accounts;
            emit("accountsChanged", accounts);
          },
          emitChainChanged(nextChainId: string) {
            currentChainId = nextChainId;
            emit("chainChanged", nextChainId);
          },
          emitDisconnect() {
            emit("disconnect");
          },
        },
        configurable: true,
      });
    },
    { address: walletAddress, chainIdHex: TESTNET_CHAIN_ID_HEX },
  );
}

test("entering judge from a connected testnet wallet fully clears the active wallet session", async ({
  page,
  context,
  baseURL,
}) => {
  const walletAddress = loadFirstTestWalletAddress();
  const walletLabel = shortAddr(walletAddress);
  const judgeWalletLabel = shortAddr(DEFAULT_WALLET_ADDRESS);
  const origin = baseURL ?? "http://127.0.0.1:3020";

  await seedConnectedTestnetWallet(page, walletAddress);

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible();

  const stateBeforeJudge = await page.evaluate(() => ({
    walletOverride: window.localStorage.getItem("yb_wallet_override"),
    walletProvider: window.localStorage.getItem("yb_wallet_provider"),
    walletNetwork: window.localStorage.getItem("yb_wallet_network"),
  }));

  expect(stateBeforeJudge.walletOverride?.toLowerCase()).toBe(walletAddress.toLowerCase());
  expect(stateBeforeJudge.walletProvider).toBe("metamask");
  expect(stateBeforeJudge.walletNetwork).toBe("testnet");

  await page.getByTestId("nav-audit").click();
  await page.waitForFunction(() => window.localStorage.getItem("yb_judge_mode") === "true");

  const stateAfterJudge = await page.evaluate(() => ({
    walletOverride: window.localStorage.getItem("yb_wallet_override"),
    walletProvider: window.localStorage.getItem("yb_wallet_provider"),
    judgeMode: window.localStorage.getItem("yb_judge_mode"),
    previousWallet: window.localStorage.getItem("yb_judge_previous_wallet"),
    previousProvider: window.localStorage.getItem("yb_judge_previous_provider"),
    previousNetwork: window.localStorage.getItem("yb_judge_previous_network"),
  }));

  expect(stateAfterJudge.walletOverride).toBeNull();
  expect(stateAfterJudge.walletProvider).toBeNull();
  expect(stateAfterJudge.judgeMode).toBe("true");
  expect(stateAfterJudge.previousWallet?.toLowerCase()).toBe(walletAddress.toLowerCase());
  expect(stateAfterJudge.previousProvider).toBe("metamask");
  expect(stateAfterJudge.previousNetwork).toBe("testnet");

  const cookiesAfterJudge = await context.cookies(origin);
  expect(cookiesAfterJudge.find((cookie) => cookie.name === "yb_wallet")).toBeUndefined();

  await page.goto("/judge", { waitUntil: "networkidle" });
  const sidebar = page.getByTestId("sidebar");
  await expect(page.getByTestId("judge-page")).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Exit judge mode" }).first()).toBeVisible();
  await expect(sidebar.getByText(judgeWalletLabel).first()).toBeVisible();
  await expect(sidebar.getByText(walletLabel)).toHaveCount(0);

  await page.evaluate((address) => {
    const api = window as unknown as {
      __testWalletProvider?: {
        emitAccountsChanged: (accounts: string[]) => void;
        emitChainChanged: (nextChainId: string) => void;
        emitDisconnect: () => void;
      };
    };

    api.__testWalletProvider?.emitAccountsChanged([address]);
    api.__testWalletProvider?.emitChainChanged("0x40da");
    api.__testWalletProvider?.emitDisconnect();
  }, walletAddress);

  await page.waitForTimeout(250);

  await expect(sidebar.getByText(judgeWalletLabel).first()).toBeVisible();
  await expect(sidebar.getByText(walletLabel)).toHaveCount(0);

  const stateAfterStaleProviderEvents = await page.evaluate(() => ({
    walletOverride: window.localStorage.getItem("yb_wallet_override"),
    walletProvider: window.localStorage.getItem("yb_wallet_provider"),
    judgeMode: window.localStorage.getItem("yb_judge_mode"),
  }));

  expect(stateAfterStaleProviderEvents.walletOverride).toBeNull();
  expect(stateAfterStaleProviderEvents.walletProvider).toBeNull();
  expect(stateAfterStaleProviderEvents.judgeMode).toBe("true");
});

test("connected testnet wallet restores cleanly after entering and exiting judge mode", async ({
  page,
}) => {
  const walletAddress = loadFirstTestWalletAddress();
  const walletLabel = shortAddr(walletAddress);

  await seedConnectedTestnetWallet(page, walletAddress);
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible();
  await expect(page.getByText(walletLabel).last()).toBeVisible();

  await page.getByTestId("nav-audit").click();
  await page.waitForFunction(() => window.localStorage.getItem("yb_judge_mode") === "true");

  await page.goto("/judge", { waitUntil: "networkidle" });
  const judgeSidebar = page.getByTestId("sidebar");
  await expect(judgeSidebar.getByRole("button", { name: "Exit judge mode" }).first()).toBeVisible();

  await judgeSidebar.getByRole("button", { name: "Exit judge mode" }).first().click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible();

  const restoredState = await page.evaluate(() => ({
    judgeMode: window.localStorage.getItem("yb_judge_mode"),
    walletOverride: window.localStorage.getItem("yb_wallet_override"),
    walletProvider: window.localStorage.getItem("yb_wallet_provider"),
    walletNetwork: window.localStorage.getItem("yb_wallet_network"),
    previousWallet: window.localStorage.getItem("yb_judge_previous_wallet"),
    previousProvider: window.localStorage.getItem("yb_judge_previous_provider"),
    previousNetwork: window.localStorage.getItem("yb_judge_previous_network"),
  }));

  expect(restoredState.judgeMode).toBeNull();
  expect(restoredState.walletOverride?.toLowerCase()).toBe(walletAddress.toLowerCase());
  expect(restoredState.walletProvider).toBe("metamask");
  expect(restoredState.walletNetwork).toBe("testnet");
  expect(restoredState.previousWallet).toBeNull();
  expect(restoredState.previousProvider).toBeNull();
  expect(restoredState.previousNetwork).toBeNull();

  const dashboardSidebar = page.getByTestId("sidebar");
  await expect(dashboardSidebar.getByText(walletLabel).last()).toBeVisible();
  await expect(page.getByTestId("optimization-loading-modal")).toHaveCount(0);
  await expect(page.getByTestId("optimization-progress-chip")).toHaveCount(0);
});
