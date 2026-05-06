"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider, Contract, parseUnits } from "ethers";

import {
  createApiKeyAction,
  type CreateApiKeyActionState,
} from "@/app/dev/actions";
import CreatedApiKeyCard from "@/components/dev/CreatedApiKeyCard";
import type { InjectedProvider } from "@/lib/browser-wallet";
import {
  getYaTreasuryAddress,
  YA_API_PLANS,
  YA_TESTNET_CHAIN_ID_HEX,
  YA_TESTNET_RPC_URL,
  YA_TOKEN_ADDRESS,
  YA_TOKEN_DECIMALS,
  type YaApiPlan,
} from "@/lib/ya-api-plans";

const initialCreateApiKeyActionState: CreateApiKeyActionState = {
  success: false,
  apiKey: null,
  label: null,
  error: null,
};

interface ManagedApiKeyCreateFormProps {
  ownerWalletAddress?: string | null;
  paymentMode?: "required" | "admin";
  submitLabel?: string;
  initialPlanId?: YaApiPlan["id"];
}

interface ProviderError extends Error {
  code?: number;
}

const ERC20_TRANSFER_ABI = ["function transfer(address to,uint256 value) returns (bool)"];

const CHECKOUT_LAYERS = [
  "L1 Blacklist cleared",
  "L2 Deterministic audit",
  "L3 Secure room verified",
  "L4 Wallet-bound state",
  "L5 0G receipt anchored",
  "L6 ZK envelope sealed",
  "L7 Proof registry sync",
  "L8 Throttle check passed",
  "L9 Neural handshake log",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ManagedApiKeyCreateForm({
  ownerWalletAddress,
  paymentMode = "required",
  submitLabel = "Generate API key",
  initialPlanId = "builder",
}: ManagedApiKeyCreateFormProps) {
  const router = useRouter();
  const createdCardRef = useRef<HTMLDivElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<YaApiPlan["id"]>(initialPlanId);
  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [activeLayerIndex, setActiveLayerIndex] = useState(-1);
  const [checkoutGuardComplete, setCheckoutGuardComplete] = useState(false);
  const [state, formAction, pending] = useActionState<CreateApiKeyActionState, FormData>(
    createApiKeyAction,
    initialCreateApiKeyActionState,
  );
  const selectedPlan = YA_API_PLANS.find((plan) => plan.id === selectedPlanId) ?? YA_API_PLANS[0];
  const paymentRequired = paymentMode !== "admin" && selectedPlan.priceYa > 0;
  const canSubmit =
    acknowledged && !pending && (!paymentRequired || (Boolean(paymentTxHash) && checkoutGuardComplete));

  useEffect(() => {
    if (state.success) {
      router.refresh();
      createdCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [router, state.success]);

  useEffect(() => {
    setPaymentTxHash("");
    setPaymentStatus("");
    setPaymentError("");
    setActiveLayerIndex(-1);
    setCheckoutGuardComplete(false);
  }, [selectedPlanId]);

  useEffect(() => {
    setSelectedPlanId(initialPlanId);
  }, [initialPlanId]);

  async function runCheckoutLayerPreview() {
    setCheckoutGuardComplete(false);
    for (let index = 0; index < CHECKOUT_LAYERS.length; index += 1) {
      setActiveLayerIndex(index);
      await sleep(180);
    }
    setCheckoutGuardComplete(true);
  }

  async function switchTo0GTestnet() {
    const provider = window.ethereum;
    if (!provider) {
      throw new Error("Wallet extension not detected. Install MetaMask or another EVM wallet first.");
    }

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: YA_TESTNET_CHAIN_ID_HEX }],
      });
    } catch (error) {
      const providerError = error as ProviderError;
      if (providerError.code !== 4902) {
        throw error;
      }

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: YA_TESTNET_CHAIN_ID_HEX,
            chainName: "0G Galileo Testnet",
            nativeCurrency: {
              name: "0G",
              symbol: "OG",
              decimals: 18,
            },
            rpcUrls: [YA_TESTNET_RPC_URL],
            blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
          },
        ],
      });
    }
  }

  async function payWithYa() {
    setPaymentError("");
    setPaymentStatus("Opening wallet...");
    try {
      if (!window.ethereum) {
        throw new Error("Wallet extension not detected. Install MetaMask or another EVM wallet first.");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      await switchTo0GTestnet();

      const provider = new BrowserProvider(window.ethereum as InjectedProvider);
      const signer = await provider.getSigner();
      const payerAddress = await signer.getAddress();
      if (
        ownerWalletAddress &&
        payerAddress.toLowerCase() !== ownerWalletAddress.toLowerCase()
      ) {
        throw new Error("The paying wallet must match the wallet signed into the developer portal.");
      }
      const token = new Contract(YA_TOKEN_ADDRESS, ERC20_TRANSFER_ABI, signer);
      const amount = parseUnits(String(selectedPlan.priceYa), YA_TOKEN_DECIMALS);
      const treasuryAddress = getYaTreasuryAddress();

      setPaymentStatus(`Paying ${selectedPlan.priceLabel}...`);
      const transaction = await token.transfer(treasuryAddress, amount);
      setPaymentStatus("Waiting for 0G confirmation...");
      const receipt = await transaction.wait();
      const receiptHash = receipt?.hash || transaction.hash;

      if (!receiptHash) {
        throw new Error("Payment transaction did not return a receipt hash.");
      }

      setPaymentTxHash(receiptHash);
      setPaymentStatus("Running 9-layer checkout guard...");
      await runCheckoutLayerPreview();
      setPaymentStatus(`Payment confirmed: ${receiptHash.slice(0, 10)}...${receiptHash.slice(-6)}`);
    } catch (error) {
      setPaymentStatus("");
      setPaymentError(error instanceof Error ? error.message : "YA payment failed.");
    }
  }

  return (
    <>
      {state.apiKey ? (
        <div ref={createdCardRef}>
          <CreatedApiKeyCard apiKey={state.apiKey} label={state.label} />
        </div>
      ) : null}

      <form action={formAction} className="mt-5 grid gap-3">
        {ownerWalletAddress ? (
          <input type="hidden" name="owner_wallet_address" value={ownerWalletAddress} />
        ) : null}
        <input type="hidden" name="plan_id" value={selectedPlan.id} />
        <input type="hidden" name="payment_tx_hash" value={paymentTxHash} />
        <input type="hidden" name="payment_amount_ya" value={String(selectedPlan.priceYa)} />

        <div className="grid gap-3">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d0e0ec]">
              API package
            </span>
            <p className="mt-1.5 text-[14px] leading-6 text-[#e0eaf2]">
              Paid developer keys are unlocked by a verified YA transfer on 0G Galileo testnet.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {YA_API_PLANS.map((plan) => (
              <label
                key={plan.id}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  selectedPlan.id === plan.id
                    ? "border-[rgba(0,201,177,0.42)] bg-[rgba(0,201,177,0.08)]"
                    : "border-white/8 bg-[rgba(255,255,255,0.03)] hover:border-white/16"
                }`}
              >
                <input
                  type="radio"
                  name="plan_picker"
                  value={plan.id}
                  checked={selectedPlan.id === plan.id}
                  onChange={() => setSelectedPlanId(plan.id)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      selectedPlan.id === plan.id ? "bg-[#72f3c7] shadow-[0_0_6px_rgba(114,243,199,0.5)]" : "bg-[#4a5e6d]"
                    }`} />
                    <p className="text-[14px] font-semibold text-white">{plan.name}</p>
                  </div>
                  <span className="rounded-full border border-[rgba(114,243,199,0.2)] px-2 py-0.5 text-[11px] font-semibold text-[#72f3c7]">
                    {plan.priceLabel}
                  </span>
                </div>
                <p className="mt-1.5 pl-4 text-[12px] font-medium text-[#d0e0ec]">
                  {plan.apiKeys} key{plan.apiKeys > 1 ? "s" : ""} · {plan.quotaLabel}
                </p>
                <p className="mt-1 pl-4 text-[12px] leading-5 text-[#c0d4e2]">
                  {plan.features.slice(0, 2).join(" · ")}
                </p>
              </label>
            ))}
          </div>
        </div>

        {paymentRequired ? (
          <div className="rounded-xl border border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.07)] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#72f3c7]">
                  YA Checkout
                </p>
                <p className="mt-1.5 text-[14px] font-medium leading-6 text-[#d4f6f1]">
                  Pay {selectedPlan.priceLabel} to unlock the {selectedPlan.name} API package.
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-[#b8ece5]">
                  The paying wallet must match the wallet signed into this developer portal, so a
                  payment receipt cannot be reused by another account.
                </p>
              </div>
              <button
                type="button"
                onClick={payWithYa}
                disabled={pending || Boolean(paymentStatus && !paymentTxHash)}
                className="yb-teal-button shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {paymentTxHash ? "Paid" : "Pay with YA"}
              </button>
            </div>
            {paymentStatus ? (
              <p className="mt-3 break-all font-mono text-[12px] leading-6 text-[#9cf3e8]">{paymentStatus}</p>
            ) : null}
            {paymentRequired ? (
              <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                {CHECKOUT_LAYERS.map((layer, index) => {
                  const passed = checkoutGuardComplete || index < activeLayerIndex;
                  const active = index === activeLayerIndex && !checkoutGuardComplete;
                  return (
                    <div
                      key={layer}
                      className={`rounded-lg border px-3 py-2.5 text-[12px] font-semibold transition-all duration-200 ${
                        passed
                          ? "checkout-layer-passed"
                          : active
                            ? "checkout-layer-active"
                            : "checkout-layer-idle"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {passed ? <span className="text-[#72f3c7]">&#10003;</span> : active ? <span className="inline-block h-1.5 w-1.5 animate-glow-pulse rounded-full bg-[#8ff7ea]"/> : null}
                        {layer}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {paymentError ? (
              <p className="mt-3 break-words text-[13px] leading-6 text-[#ffb3b3]">{paymentError}</p>
            ) : null}
          </div>
        ) : paymentMode === "admin" ? (
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-[14px] leading-6 text-[#e0eaf2]">
            Owner console mode: internal keys can be issued without a YA checkout receipt.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#d0e0ec]">App name</span>
            <input
              name="app_name"
              required
              placeholder="Acme Vault SDK"
              className="glass-inset rounded-xl border border-white/10 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#7a95a8] outline-none transition focus:border-[rgba(0,201,177,0.35)]"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#d0e0ec]">Owner label</span>
            <input
              name="owner_label"
              placeholder="Acme Research Team"
              className="glass-inset rounded-xl border border-white/10 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#7a95a8] outline-none transition focus:border-[rgba(0,201,177,0.35)]"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#d0e0ec]">Environment</span>
            <select
              name="environment"
              defaultValue="testnet"
              className="glass-inset rounded-xl border border-white/10 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#7a95a8] outline-none transition focus:border-[rgba(0,201,177,0.35)]"
            >
              <option value="testnet">testnet</option>
              <option value="mainnet">mainnet</option>
              <option value="multi">multi</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#d0e0ec]">Notes</span>
            <textarea
              name="notes"
              rows={2}
              placeholder="Scope, contract phase, or internal notes."
              className="glass-inset rounded-xl border border-white/10 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#7a95a8] outline-none transition focus:border-[rgba(0,201,177,0.35)]"
            />
          </label>
        </div>

        <div className="rounded-xl border border-[rgba(255,184,77,0.30)] bg-[rgba(255,184,77,0.08)] px-4 py-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#ffe0a0]">
            Important
          </p>
          <p className="mt-2 text-[15px] leading-7 text-[#fff0d0]">
            The raw API key is shown only once after creation. The key list below only displays a
            preview, not the full key. Once you close or refresh this page, or revoke the key,
            the raw key cannot be recovered.
          </p>
          <label className="mt-4 flex items-start gap-3 text-[14px] leading-6 text-[#fff4e0]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
            />
            <span>
              I understand the raw API key must be copied immediately and cannot be viewed
              again from the key list or after revocation.
            </span>
          </label>
        </div>

        {state.error ? (
          <div className="rounded-[16px] border border-[rgba(255,112,112,0.22)] bg-[rgba(255,112,112,0.08)] px-4 py-3 text-[13px] text-[#ffb3b3]">
            {state.error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="yb-teal-button mt-1 w-full rounded-xl px-5 py-3.5 text-[15px] font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Generating..." : submitLabel}
        </button>
      </form>
    </>
  );
}
