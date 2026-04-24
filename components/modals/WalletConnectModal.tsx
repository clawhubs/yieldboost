"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { siCoinbase, siOkx } from "simple-icons";
import type { WalletOption } from "@/lib/browser-wallet";
import type { WalletNetworkConfig } from "@/lib/wallet";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectWallet: (walletId: string) => void;
  walletOptions: WalletOption[];
  network?: WalletNetworkConfig;
  connectingId?: string | null;
}

const walletCatalog = [
  {
    id: "metamask",
    name: "MetaMask",
    installUrl: "https://metamask.io/download/",
    logoSrc: "/wallets/metamask.svg",
    logoAlt: "MetaMask logo",
  },
  {
    id: "rabby",
    name: "Rabby",
    installUrl: "https://rabby.io/",
    logoSrc: "/wallets/rabby.png",
    logoAlt: "Rabby logo",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
    simpleIcon: siCoinbase,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    installUrl: "https://trustwallet.com/download",
    logoSrc: "/wallets/trustwallet.svg",
    logoAlt: "Trust Wallet logo",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    installUrl: "https://www.okx.com/web3",
    simpleIcon: siOkx,
  },
];

function WalletLogo({
  logoSrc,
  logoAlt,
  simpleIcon,
}: {
  logoSrc?: string;
  logoAlt?: string;
  simpleIcon?: { path: string; hex: string };
}) {
  if (logoSrc) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
        <Image
          src={logoSrc}
          alt={logoAlt ?? "Wallet logo"}
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
      {simpleIcon ? (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path d={simpleIcon.path} fill={`#${simpleIcon.hex}`} />
        </svg>
      ) : null}
    </div>
  );
}

export default function WalletConnectModal({
  open,
  onOpenChange,
  onConnectWallet,
  walletOptions,
  network,
  connectingId,
}: WalletConnectModalProps) {
  const [mounted, setMounted] = useState(false);
  const optionMap = new Map(walletOptions.map((wallet) => [wallet.id, wallet]));

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[400px] rounded-[28px] border border-[rgba(255,255,255,0.09)] bg-[linear-gradient(180deg,rgba(13,18,24,0.98)_0%,rgba(9,14,19,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-white">Connect Wallet</div>
                <div className="mt-1 text-[12px] text-[#94a3b8]">
                  {network?.label ?? "Select a wallet provider"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border border-white/10 p-2 text-[#94a3b8] transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {walletCatalog.map((wallet) => {
                const detected = optionMap.get(wallet.id);
                const available = Boolean(detected);
                const busy = connectingId === wallet.id;

                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => {
                      if (available) {
                        onConnectWallet(wallet.id);
                        return;
                      }
                      window.open(wallet.installUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="flex w-full items-center justify-between rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left transition hover:border-[rgba(0,201,177,0.28)] hover:bg-[rgba(0,201,177,0.06)]"
                  >
                    <div className="flex items-center gap-3">
                      <WalletLogo
                        logoSrc={wallet.logoSrc}
                        logoAlt={wallet.logoAlt}
                        simpleIcon={wallet.simpleIcon}
                      />
                      <div>
                        <div className="text-[14px] font-medium text-white">{wallet.name}</div>
                        <div className="mt-1 text-[11px] text-[#8ea1af]">
                          {busy
                            ? "Connecting..."
                            : available
                              ? "Available in this browser"
                              : "Install or open this wallet"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          available
                            ? "bg-[rgba(34,221,208,0.12)] text-[#2ad7c8]"
                            : "bg-[rgba(255,255,255,0.06)] text-[#9ca9b6]"
                        }`}
                      >
                        {available ? "Detected" : "Install"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#9ca9b6]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  , document.body);
}
