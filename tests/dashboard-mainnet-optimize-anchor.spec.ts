import { expect, test } from "@playwright/test";

const MAINNET_CHAIN_ID_HEX = "0x4115";
const CONNECTED_WALLET = "0x1111111111111111111111111111111111111111";
const STORAGE_CID =
  "0x123400000000000000000000000000000000000000000000000000000000abcd";
const STORAGE_TX_HASH =
  "0x567800000000000000000000000000000000000000000000000000000000dcba";
const PROOF_REGISTRY_ADDRESS = "0x8e63e117E71A80Cfc10fDF375F079e2e29cd7D7D";
const PROOF_REGISTRY_TX_HASH =
  "0x999900000000000000000000000000000000000000000000000000000000beef";

async function seedConnectedMainnetWallet(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({
      wallet,
      chainIdHex,
      proofRegistryAddress,
      proofRegistryTxHash,
    }) => {
      window.localStorage.setItem("yb_entry_mode_selected", "user");
      window.localStorage.removeItem("yb_judge_mode");
      window.localStorage.removeItem("yb_judge_network");
      window.localStorage.removeItem("yb_judge_previous_wallet");
      window.localStorage.removeItem("yb_judge_previous_provider");
      window.localStorage.removeItem("yb_judge_previous_network");
      window.localStorage.setItem("yb_wallet_override", wallet);
      window.localStorage.setItem("yb_wallet_network", "mainnet");
      window.localStorage.setItem("yb_wallet_provider", "metamask");
      document.cookie = `${"yb_wallet"}=${wallet}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = "yb_wallet_network=mainnet; path=/; max-age=31536000; SameSite=Lax";

      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      let currentChainId = chainIdHex;
      const authorizedAccounts = [wallet];
      let currentBlockNumber = 0xabcden;
      let sendTransactionCount = 0;
      let switchCount = 0;
      let lastTxHash = proofRegistryTxHash;

      const emit = (event: string, payload?: unknown) => {
        listeners.get(event)?.forEach((listener) => listener(payload));
      };

      const receipt = {
        blockHash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        blockNumber: `0x${currentBlockNumber.toString(16)}`,
        contractAddress: null,
        cumulativeGasUsed: "0x5208",
        effectiveGasPrice: "0x3b9aca00",
        from: wallet,
        gasUsed: "0x5208",
        logs: [],
        logsBloom: `0x${"0".repeat(512)}`,
        status: "0x1",
        to: proofRegistryAddress,
        transactionHash: lastTxHash,
        transactionIndex: "0x0",
        type: "0x2",
      };

      const provider = {
        isMetaMask: true,
        request: async ({
          method,
          params,
        }: {
          method: string;
          params?: unknown[] | Record<string, unknown>;
        }) => {
          if (method === "eth_accounts" || method === "eth_requestAccounts") {
            return authorizedAccounts;
          }
          if (method === "wallet_requestPermissions") {
            return [{ parentCapability: "eth_accounts" }];
          }
          if (method === "eth_chainId") {
            return currentChainId;
          }
          if (method === "net_version") {
            return `${parseInt(currentChainId, 16)}`;
          }
          if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") {
            const requested = Array.isArray(params)
              ? (params[0] as { chainId?: string } | undefined)
              : undefined;
            currentChainId = requested?.chainId ?? currentChainId;
            switchCount += 1;
            emit("chainChanged", currentChainId);
            return null;
          }
          if (method === "eth_getTransactionCount") {
            return "0x1";
          }
          if (method === "eth_blockNumber") {
            return `0x${currentBlockNumber.toString(16)}`;
          }
          if (method === "eth_gasPrice" || method === "eth_maxPriorityFeePerGas") {
            return "0x3b9aca00";
          }
          if (method === "eth_estimateGas") {
            return "0x5208";
          }
          if (method === "eth_sendTransaction") {
            sendTransactionCount += 1;
            currentBlockNumber += 1n;
            lastTxHash = proofRegistryTxHash;
            return lastTxHash;
          }
          if (method === "eth_getTransactionReceipt") {
            return {
              ...receipt,
              blockNumber: `0x${currentBlockNumber.toString(16)}`,
              transactionHash: lastTxHash,
            };
          }
          if (method === "eth_getCode") {
            return "0x1234";
          }
          if (method === "eth_call") {
            return "0x";
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

      Object.defineProperty(window, "__walletAnchorMetrics", {
        value: {
          get sendTransactionCount() {
            return sendTransactionCount;
          },
          get switchCount() {
            return switchCount;
          },
        },
        configurable: true,
      });
    },
    {
      wallet: CONNECTED_WALLET,
      chainIdHex: MAINNET_CHAIN_ID_HEX,
      proofRegistryAddress: PROOF_REGISTRY_ADDRESS,
      proofRegistryTxHash: PROOF_REGISTRY_TX_HASH,
    },
  );
}

test("dashboard mainnet 1-click optimize does not fire duplicate wallet tx on phase 2/2 double click", async ({
  page,
}) => {
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
    reasoning: "Main dashboard mainnet pending anchor test.",
    riskProfile: "Moderate",
  });

  await seedConnectedMainnetWallet(page);

  await page.route("**/api/stats/global", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hasData: true,
        formatted: {
          users: "7",
          computeJobs: "80",
          tvl: "$686",
          recentJobs24h: "11",
          protocols: "2",
        },
      }),
    });
  });

  await page.route("**/api/portfolio?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        walletAddress: CONNECTED_WALLET,
        tokens: [
          {
            symbol: "0G",
            amount: 1200,
            valueUSD: 1200,
          },
        ],
        totalUSD: 1200,
        currentAPY: 4.2,
        displayTotal: 1200,
        displayUnit: "USD",
        displayLabel: "Portfolio",
        source: "wallet_live_mainnet",
      }),
    });
  });

  await page.route("**/api/agent/latest?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: null }),
    });
  });

  await page.route("**/api/agent/optimize", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Optimization-Result": optimizationHeader,
      },
      body: '0:"Main dashboard mainnet pending anchor test."\\n',
    });
  });

  await page.route("**/api/0g/store", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cid: STORAGE_CID,
        txHash: STORAGE_TX_HASH,
        explorerUrl: `https://chainscan.0g.ai/tx/${STORAGE_TX_HASH}`,
        timestamp: new Date().toISOString(),
        walletAddress: CONNECTED_WALLET,
        proofRegistryAddress: PROOF_REGISTRY_ADDRESS,
        proofRegistryMode: "user",
        note: "Storage proof saved; awaiting wallet ProofRegistry anchor.",
      }),
    });
  });

  await page.route("**/api/0g/anchor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          walletAddress: CONNECTED_WALLET,
          proofRegistryAddress: PROOF_REGISTRY_ADDRESS,
          proofRegistryTxHash: PROOF_REGISTRY_TX_HASH,
          proofRegistryProofId: "36",
          proofRegistryExplorerUrl: `https://chainscan.0g.ai/tx/${PROOF_REGISTRY_TX_HASH}`,
        },
      }),
    });
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const optimizeButton = page.getByTestId("boost-yield-cta");
  await expect(optimizeButton).toBeEnabled({ timeout: 30_000 });
  await optimizeButton.click();

  const confirmButton = page.getByTestId("optimization-confirm-wallet-step");
  await expect(confirmButton).toBeVisible({ timeout: 10_000 });

  await Promise.all([
    confirmButton.click(),
    confirmButton.click().catch(() => undefined),
  ]);

  await expect(confirmButton).toBeDisabled();
  await expect(page.getByTestId("optimization-loading-dialog")).toContainText(
    /Waiting for wallet|Primary proof ready|Optimization complete/i,
  );

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const metrics = (window as unknown as {
          __walletAnchorMetrics?: { sendTransactionCount: number; switchCount: number };
        }).__walletAnchorMetrics;
        return {
          sendTransactionCount: metrics?.sendTransactionCount ?? 0,
          switchCount: metrics?.switchCount ?? 0,
        };
      });
    })
    .toEqual({
      sendTransactionCount: 1,
      switchCount: 1,
    });
});
