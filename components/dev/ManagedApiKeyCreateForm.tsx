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
}

interface ProviderError extends Error {
  code?: number;
}

const ERC20_TRANSFER_ABI = ["function transfer(address to,uint256 value) returns (bool)"];

export default function ManagedApiKeyCreateForm({
  ownerWalletAddress,
  paymentMode = "required",
  submitLabel = "Generate API key",
}: ManagedApiKeyCreateFormProps) {
  const router = useRouter();
  const createdCardRef = useRef<HTMLDivElement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<YaApiPlan["id"]>("builder");
  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [state, formAction, pending] = useActionState<CreateApiKeyActionState, FormData>(
    createApiKeyAction,
    initialCreateApiKeyActionState,
  );
  const selectedPlan = YA_API_PLANS.find((plan) => plan.id === selectedPlanId) ?? YA_API_PLANS[0];
  const paymentRequired = paymentMode !== "admin" && selectedPlan.priceYa > 0;
  const canSubmit = acknowledged && !pending && (!paymentRequired || Boolean(paymentTxHash));

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
  }, [selectedPlanId]);

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
            <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">
              API package
            </span>
            <p className="mt-2 text-[13px] leading-6 text-[#9db0c0]">
              Paid developer keys are unlocked by a verified YA transfer on 0G Galileo testnet.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {YA_API_PLANS.map((plan) => (
              <label
                key={plan.id}
                className={`cursor-pointer rounded-[18px] border p-4 transition ${
                  selectedPlan.id === plan.id
                    ? "border-[rgba(0,201,177,0.42)] bg-[rgba(0,201,177,0.1)]"
                    : "border-white/8 bg-[rgba(255,255,255,0.03)] hover:border-white/14"
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-[12px] text-[#8aa2b1]">
                      {plan.apiKeys} key{plan.apiKeys > 1 ? "s" : ""} · {plan.quotaLabel}
                    </p>
                  </div>
                  <span className="rounded-full border border-[rgba(114,243,199,0.25)] px-2 py-1 text-[11px] font-semibold text-[#72f3c7]">
                    {plan.priceLabel}
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-[#9cb0c1]">
                  {plan.features.slice(0, 2).join(" · ")}
                </p>
              </label>
            ))}
          </div>
        </div>

        {paymentRequired ? (
          <div className="rounded-[18px] border border-[rgba(0,201,177,0.2)] bg-[rgba(0,201,177,0.07)] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8ff7ea]">
                  YA checkout
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[#bdeee7]">
                  Pay {selectedPlan.priceLabel} to unlock the {selectedPlan.name} API package.
                </p>
              </div>
              <button
                type="button"
                onClick={payWithYa}
                disabled={pending || Boolean(paymentStatus && !paymentTxHash)}
                className="yb-teal-button rounded-[14px] px-4 py-3 text-[13px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {paymentTxHash ? "Paid" : "Pay with YA"}
              </button>
            </div>
            {paymentStatus ? (
              <p className="mt-3 break-all text-[13px] leading-6 text-[#9cf3e8]">{paymentStatus}</p>
            ) : null}
            {paymentError ? (
              <p className="mt-3 break-words text-[13px] leading-6 text-[#ffb3b3]">{paymentError}</p>
            ) : null}
          </div>
        ) : paymentMode === "admin" ? (
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-[13px] leading-6 text-[#9db0c0]">
            Owner console mode: internal keys can be issued without a YA checkout receipt.
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">App name</span>
          <input
            name="app_name"
            required
            placeholder="Acme Vault SDK"
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Owner label</span>
          <input
            name="owner_label"
            placeholder="Acme Research Team"
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Environment</span>
          <select
            name="environment"
            defaultValue="testnet"
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          >
            <option value="testnet">testnet</option>
            <option value="mainnet">mainnet</option>
            <option value="multi">multi</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Notes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Scope, contract phase, or internal owner notes."
            className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
          />
        </label>

        <div className="rounded-[18px] border border-[rgba(255,184,77,0.22)] bg-[rgba(255,184,77,0.08)] px-4 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffd38a]">
            Important
          </p>
          <p className="mt-2 text-[14px] leading-7 text-[#ffe4bb]">
            Raw API key hanya muncul satu kali setelah key dibuat. Daftar key di bawah hanya
            menampilkan preview, bukan raw key. Setelah halaman ditutup, di-refresh, atau key
            di-revoke, raw key tidak bisa dipulihkan lagi.
          </p>
          <label className="mt-4 flex items-start gap-3 text-[13px] leading-6 text-[#fff1d6]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
            />
            <span>
              Saya paham raw API key harus dicopy saat itu juga, dan tidak bisa dilihat lagi
              dari daftar key atau setelah revoke.
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
          className="yb-teal-button mt-2 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Generating..." : submitLabel}
        </button>
      </form>
    </>
  );
}
