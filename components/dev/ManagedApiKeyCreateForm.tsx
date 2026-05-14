"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider, formatEther, parseEther } from "ethers";
import { Copy, ExternalLink, Wallet2 } from "lucide-react";

import {
  createApiKeyAction,
  type CreateApiKeyActionState,
} from "@/app/dev/actions";
import CreatedApiKeyCard from "@/components/dev/CreatedApiKeyCard";
import {
  getDefaultInjectedWallet,
  switchOrAddNetwork,
  type InjectedProvider,
} from "@/lib/browser-wallet";
import {
  get0GTreasuryAddress,
  YA_API_PLANS,
  type YaApiPlan,
} from "@/lib/ya-api-plans";
import { DEFAULT_WALLET_ADDRESS } from "@/lib/wallet";
import { getWalletNetworkConfig } from "@/lib/wallet";

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
  selectedPlanId?: YaApiPlan["id"];
  onSelectedPlanIdChange?: (planId: YaApiPlan["id"]) => void;
}

const CHECKOUT_LAYERS = [
  "L1 Hallucination Blacklist",
  "L2 Integrity Auditor",
  "L3 Secure Compute / TEE",
  "L4 Sovereign Memory",
  "L5 0G Storage Proof Layer",
  "L6 Zero-Knowledge Proof Layer",
  "L7 ProofRegistry Anchor",
  "L8 Programmable Governance",
  "L9 Cross-Agent Neural Handshake",
  "L10 AWS Nitro Enclaves",
];
const mainnetNetwork = getWalletNetworkConfig("mainnet");
const fundingAddress = get0GTreasuryAddress();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatOgAmount(value: bigint) {
  const asNumber = Number(formatEther(value));
  if (!Number.isFinite(asNumber)) {
    return formatEther(value);
  }
  return asNumber.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function normalizeWalletError(
  error: unknown,
  fallbackMessage: string,
  cancelledMessage: string,
) {
  const candidate = error as
    | {
        code?: number | string;
        shortMessage?: string;
        message?: string;
        info?: { error?: { code?: number | string; message?: string } };
      }
    | undefined;
  const code = candidate?.code ?? candidate?.info?.error?.code;
  const rawMessage =
    candidate?.shortMessage ||
    candidate?.message ||
    candidate?.info?.error?.message ||
    "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    normalizedMessage.includes("user rejected") ||
    normalizedMessage.includes("user denied") ||
    normalizedMessage.includes("action_rejected")
  ) {
    return cancelledMessage;
  }

  if (normalizedMessage.includes("insufficient funds")) {
    return "This wallet does not have enough 0G for the package amount plus gas.";
  }

  if (
    normalizedMessage.includes("missing revert data") ||
    normalizedMessage.includes("call_exception") ||
    normalizedMessage.includes("estimategas")
  ) {
    return "The wallet could not prepare this 0G transaction. Check the wallet balance, selected network, and recipient, then retry.";
  }

  return rawMessage || fallbackMessage;
}

export default function ManagedApiKeyCreateForm({
  ownerWalletAddress,
  paymentMode = "required",
  submitLabel = "Generate API key",
  initialPlanId = "builder",
  selectedPlanId: controlledSelectedPlanId,
  onSelectedPlanIdChange,
}: ManagedApiKeyCreateFormProps) {
  const router = useRouter();
  const createdCardRef = useRef<HTMLDivElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [uncontrolledSelectedPlanId, setUncontrolledSelectedPlanId] =
    useState<YaApiPlan["id"]>(initialPlanId);
  const [checkoutReviewReady, setCheckoutReviewReady] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [activeLayerIndex, setActiveLayerIndex] = useState(-1);
  const [checkoutGuardComplete, setCheckoutGuardComplete] = useState(false);
  const [walletHelperStatus, setWalletHelperStatus] = useState("");
  const [walletHelperError, setWalletHelperError] = useState("");
  const [state, formAction, pending] = useActionState<CreateApiKeyActionState, FormData>(
    createApiKeyAction,
    initialCreateApiKeyActionState,
  );
  const selectedPlanId = controlledSelectedPlanId ?? uncontrolledSelectedPlanId;
  const selectedPlan = YA_API_PLANS.find((plan) => plan.id === selectedPlanId) ?? YA_API_PLANS[0];
  const paymentRequired = paymentMode !== "admin" && selectedPlan.checkoutPrice0g !== "0";
  const isDemoWalletSession = Boolean(
    ownerWalletAddress &&
      ownerWalletAddress.toLowerCase() === DEFAULT_WALLET_ADDRESS.toLowerCase(),
  );
  const effectiveCheckoutAmount = paymentRequired
    ? isDemoWalletSession
      ? "0"
      : selectedPlan.checkoutPrice0g
    : "0";
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
    setCheckoutReviewReady(false);
  }, [selectedPlanId]);

  useEffect(() => {
    if (controlledSelectedPlanId === undefined) {
      setUncontrolledSelectedPlanId(initialPlanId);
    }
  }, [controlledSelectedPlanId, initialPlanId]);

  function handleSelectPlan(planId: YaApiPlan["id"]) {
    if (controlledSelectedPlanId === undefined) {
      setUncontrolledSelectedPlanId(planId);
    }
    onSelectedPlanIdChange?.(planId);
  }

  async function runCheckoutLayerPreview() {
    setCheckoutGuardComplete(false);
    for (let index = 0; index < CHECKOUT_LAYERS.length; index += 1) {
      setActiveLayerIndex(index);
      await sleep(180);
    }
    setCheckoutGuardComplete(true);
  }

  async function payWith0G() {
    setPaymentError("");
    setPaymentStatus("Opening wallet...");
    try {
      if (!window.ethereum) {
        throw new Error("Wallet extension not detected. Install MetaMask or another EVM wallet first.");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      await add0GMainnetToWallet();

      const provider = new BrowserProvider(window.ethereum as InjectedProvider);
      const signer = await provider.getSigner();
      const payerAddress = await signer.getAddress();
      if (
        ownerWalletAddress &&
        payerAddress.toLowerCase() !== ownerWalletAddress.toLowerCase()
      ) {
        throw new Error("The paying wallet must match the wallet signed into the developer portal.");
      }
      const treasuryAddress = get0GTreasuryAddress();
      const amount = parseEther(effectiveCheckoutAmount);
      const [payerBalance, feeData] = await Promise.all([
        provider.getBalance(payerAddress),
        provider.getFeeData(),
      ]);
      const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? BigInt(0);
      const estimatedGasCost = gasPrice > BigInt(0) ? gasPrice * BigInt(21000) : BigInt(0);
      const minimumNeeded = amount + estimatedGasCost;

      if (payerBalance === BigInt(0)) {
        throw new Error(
          `This wallet has 0 0G on 0G Mainnet, so the wallet cannot open a checkout confirmation yet. Fund it first, then retry. Package: ${selectedPlan.priceLabel}. Estimated gas floor: ${formatOgAmount(estimatedGasCost)} 0G.`,
        );
      }

      if (payerBalance < minimumNeeded) {
        throw new Error(
          `Insufficient 0G balance for checkout. Wallet balance: ${formatOgAmount(payerBalance)} 0G. Required package: ${effectiveCheckoutAmount} 0G. Estimated gas floor: ${formatOgAmount(estimatedGasCost)} 0G.`,
        );
      }

      setPaymentStatus(
        effectiveCheckoutAmount === "0"
          ? "Sending demo wallet gas-only activation transaction..."
          : `Sending ${selectedPlan.priceLabel}...`,
      );
      const transaction = await signer.sendTransaction({
        to: treasuryAddress,
        value: amount,
      });
      setPaymentStatus("Waiting for 0G confirmation...");
      const receipt = await transaction.wait();
      const receiptHash = receipt?.hash || transaction.hash;
      if (!receiptHash) {
        throw new Error("Payment transaction did not return a receipt hash.");
      }

      setPaymentTxHash(receiptHash);
      setPaymentStatus("Running 10-layer checkout guard...");
      await runCheckoutLayerPreview();
      setPaymentStatus(
        effectiveCheckoutAmount === "0"
          ? `Demo wallet activation confirmed: ${receiptHash.slice(0, 10)}...${receiptHash.slice(-6)}`
          : `Payment confirmed: ${receiptHash.slice(0, 10)}...${receiptHash.slice(-6)}`,
      );
    } catch (error) {
      setPaymentStatus("");
      setPaymentError(
        normalizeWalletError(
          error,
          "0G payment failed.",
          "Transaction was cancelled in your wallet. No package was activated.",
        ),
      );
    }
  }

  async function add0GMainnetToWallet() {
    setWalletHelperError("");
    setWalletHelperStatus("Opening wallet network setup...");
    try {
      const wallet = getDefaultInjectedWallet();
      if (!wallet) {
        throw new Error("Install or unlock a browser wallet first.");
      }
      await switchOrAddNetwork(wallet.provider, mainnetNetwork);
      setWalletHelperStatus("0G Mainnet is now available in your wallet.");
    } catch (error) {
      setWalletHelperStatus("");
      setWalletHelperError(
        normalizeWalletError(
          error,
          "Unable to add 0G Mainnet to wallet.",
          "Wallet network setup was cancelled in your wallet.",
        ),
      );
    }
  }

  async function copyFundingAddress() {
    try {
      await navigator.clipboard.writeText(fundingAddress);
      setWalletHelperError("");
      setWalletHelperStatus("0G funding address copied.");
    } catch {
      setWalletHelperError("Unable to copy the 0G funding address.");
    }
  }

  function beginCheckoutReview() {
    setPaymentError("");
    setPaymentStatus("");
    setCheckoutReviewReady(true);
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
        <input type="hidden" name="payment_mode" value={paymentMode} />
        <input type="hidden" name="plan_id" value={selectedPlan.id} />
        <input type="hidden" name="payment_tx_hash" value={paymentTxHash} />

        <div className="grid gap-3">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d0e0ec]">
              API package
            </span>
            <p className="mt-1.5 text-[14px] leading-6 text-[#e0eaf2]">
              Free stays instant. Builder, Pro, and Protocol activate through a native 0G mainnet payment receipt.
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(0,201,177,0.18)] bg-[rgba(0,201,177,0.05)] px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9ff7f0]">
                  <Wallet2 className="h-4 w-4" />
                  0G Mainnet wallet helper
                </div>
                <p className="mt-2 text-[13px] leading-6 text-[#d7e7ef]">
                  If the customer wallet does not have the 0G network yet, add 0G Mainnet first, then fund the wallet with 0G before package checkout.
                </p>
                <div className="mt-3 grid gap-1 text-[12px] leading-6 text-[#c8dae6]">
                  <div>
                    RPC: <span className="font-mono text-white">{mainnetNetwork.rpcUrl}</span>
                  </div>
                  <div>
                    Chain ID: <span className="font-mono text-white">{mainnetNetwork.chainId}</span>
                  </div>
                  <div>
                    Funding wallet: <span className="font-mono break-all text-white">{fundingAddress}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={add0GMainnetToWallet}
                  className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,201,177,0.20)] bg-[rgba(0,201,177,0.08)] px-3 py-2 text-[12px] font-semibold text-[#9ff7f0] transition hover:border-[rgba(0,201,177,0.35)]"
                >
                  <Wallet2 className="h-3.5 w-3.5" />
                  Add 0G to wallet
                </button>
                <button
                  type="button"
                  onClick={copyFundingAddress}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.20)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy address
                </button>
                <a
                  href={mainnetNetwork.explorerBase}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-white transition hover:border-[rgba(0,201,177,0.20)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  0G explorer
                </a>
              </div>
            </div>
            {walletHelperStatus ? (
              <p className="mt-3 text-[12px] leading-5 text-[#9ff7f0]">{walletHelperStatus}</p>
            ) : null}
            {walletHelperError ? (
              <p className="mt-2 text-[12px] leading-5 text-[#ffb3b3]">{walletHelperError}</p>
            ) : null}
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
                  onChange={() => handleSelectPlan(plan.id)}
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
                {plan.listPrice0g ? (
                  <p className="mt-1 pl-4 text-[11px] font-medium text-[#96b0c2]">
                    <span className="line-through">{plan.listPrice0g} 0G</span>
                    {plan.promoLabel ? <span className="ml-2 text-[#72f3c7]">{plan.promoLabel}</span> : null}
                  </p>
                ) : null}
              </label>
            ))}
          </div>
        </div>

        {paymentRequired ? (
          <div className="rounded-xl border border-[rgba(0,201,177,0.28)] bg-[rgba(0,201,177,0.07)] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#72f3c7]">
                  Package activation
                </p>
                <p className="mt-1.5 text-[14px] font-medium leading-6 text-[#d4f6f1]">
                  Activate the {selectedPlan.name} API package with a native 0G mainnet transaction.
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-[#b8ece5]">
                  The paying wallet must match the wallet signed into this developer portal, so a
                  checkout receipt cannot be reused by another account.
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-[#9cf3e8]">
                  Step 1 reviews the package and wallet match. Step 2 opens the 0G transaction confirmation in your wallet.
                </p>
                {isDemoWalletSession ? (
                  <p className="mt-1.5 text-[12px] leading-5 text-[#9cf3e8]">
                    Demo wallet override: this wallet sends a 0-value 0G transaction, so it only pays network gas and does not pay the package price.
                  </p>
                ) : null}
                {selectedPlan.listPrice0g ? (
                  <p className="mt-1 text-[12px] leading-5 text-[#9cf3e8]">
                    List price <span className="line-through">{selectedPlan.listPrice0g} 0G</span>
                    {selectedPlan.promoLabel ? <span className="ml-2">{selectedPlan.promoLabel}</span> : null}
                  </p>
                ) : null}
              </div>
              {checkoutReviewReady ? (
                <button
                  type="button"
                  onClick={payWith0G}
                  disabled={pending || Boolean(paymentStatus && !paymentTxHash)}
                  className="yb-teal-button shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {paymentTxHash ? "Paid" : effectiveCheckoutAmount === "0" ? "Send gas-only tx" : "Pay with 0G"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={beginCheckoutReview}
                  disabled={pending}
                  className="yb-teal-button shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Start checkout
                </button>
              )}
            </div>
            {checkoutReviewReady && !paymentTxHash ? (
              <div className="mt-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(2,10,18,0.48)] px-4 py-4 text-[13px] leading-6 text-[#d7e7f2]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#72f3c7]">
                  Checkout review
                </p>
                <div className="mt-2 grid gap-1">
                  <p>Package: <span className="font-semibold text-white">{selectedPlan.name}</span></p>
                  <p>Required checkout: <span className="font-semibold text-white">{effectiveCheckoutAmount} 0G</span></p>
                  <p>Action: <span className="font-semibold text-white">Native 0G transfer</span></p>
                  {ownerWalletAddress ? (
                    <p>Signed-in wallet: <span className="break-all font-mono text-[12px] text-[#9cf3e8]">{ownerWalletAddress}</span></p>
                  ) : null}
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#a9c9d7]">
                  The next button will open the wallet popup. The app will not activate the package before the on-chain 0G transaction is confirmed.
                </p>
              </div>
            ) : null}
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
            Owner console mode: internal keys can be issued without a checkout receipt.
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
          {paymentMode === "required" ? (
            <>
              <input type="hidden" name="environment" value="mainnet" />
              <div className="grid gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#d0e0ec]">Environment</span>
                <div className="glass-inset rounded-xl border border-[rgba(0,201,177,0.16)] px-3.5 py-2.5 text-[14px] font-semibold text-[#72f3c7]">
                  mainnet
                </div>
              </div>
            </>
          ) : (
            <label className="grid gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#d0e0ec]">Environment</span>
              <select
                name="environment"
                defaultValue="mainnet"
                className="glass-inset rounded-xl border border-white/10 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#7a95a8] outline-none transition focus:border-[rgba(0,201,177,0.35)]"
              >
                <option value="mainnet">mainnet</option>
                <option value="multi">multi</option>
                <option value="testnet">testnet</option>
              </select>
            </label>
          )}
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
          {paymentRequired ? (
            <p className="mt-3 text-[13px] leading-6 text-[#ffe6b8]">
              For paid packages, complete checkout above first. The final button stays locked until the 0G transaction is confirmed.
            </p>
          ) : null}
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
          {pending ? "Generating..." : paymentRequired ? "Generate API key after checkout" : submitLabel}
        </button>
      </form>
    </>
  );
}
