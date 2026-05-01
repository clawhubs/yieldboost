"use client";

import Link from "next/link";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Database,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Wallet2,
} from "lucide-react";

interface StrategyListing {
  tokenId: number;
  apy: number;
  currentApy?: number | null;
  yieldIncreasePct?: number | null;
  estimatedAnnualGain?: number | null;
  confidence?: number | null;
  recommended?: string | null;
  storageProof?: string | null;
  txHash?: string | null;
  proofUrl?: string | null;
  proofRegistryExplorerUrl?: string | null;
  timestamp: string;
  creator: string;
  verified: boolean;
  owner: string;
  sourceLabel?: string | null;
}

interface MarketplaceListing {
  tokenId: number;
  seller: string;
  priceWei: string;
  price0G: string;
  active: boolean;
}

interface InjectedEthereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function shortAddr(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatCurrency(value?: number | null) {
  return typeof value === "number"
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "$0";
}

function getProofHref(strategy: StrategyListing) {
  return strategy.proofRegistryExplorerUrl ?? strategy.proofUrl ?? null;
}

export default function StrategyMarketplace() {
  const [strategies, setStrategies] = useState<StrategyListing[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [marketplaceAddress, setMarketplaceAddress] = useState<string | null>(null);
  const [inftAddress, setInftAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionText, setActionText] = useState<string | null>(null);

  const loadMarketplace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentResponse, listingResponse] = await Promise.all([
        fetch("/api/agent/list?scope=all", { cache: "no-store" }),
        fetch("/api/marketplace/list", { cache: "no-store" }),
      ]);
      if (!agentResponse.ok || !listingResponse.ok) {
        throw new Error("Marketplace inventory could not be loaded");
      }

      const [agentData, listingData] = await Promise.all([
        agentResponse.json(),
        listingResponse.json(),
      ]);
      if (!agentData.success) {
        throw new Error(agentData.error ?? "Marketplace inventory failed");
      }
      if (!listingData.success) {
        throw new Error(listingData.error ?? "Marketplace listing lookup failed");
      }

      setStrategies(Array.isArray(agentData.strategies) ? agentData.strategies : []);
      setListings(Array.isArray(listingData.listings) ? listingData.listings : []);
      setMarketplaceAddress(listingData.marketplaceAddress ?? null);
      setInftAddress(listingData.inftAddress ?? null);
      setMessage(listingData.message ?? agentData.message ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown marketplace error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarketplace();
  }, [loadMarketplace]);

  const listingMap = useMemo(() => {
    return new Map(listings.map((listing) => [listing.tokenId, listing]));
  }, [listings]);

  async function getSigner() {
    const ethereum = (window as typeof window & { ethereum?: InjectedEthereum }).ethereum;
    if (!ethereum) {
      throw new Error("MetaMask or an injected wallet is required for marketplace actions.");
    }

    await ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(ethereum);
    return provider.getSigner();
  }

  async function handleList(strategy: StrategyListing) {
    if (!marketplaceAddress || !inftAddress) {
      alert("Marketplace contract is not configured for this network yet.");
      return;
    }

    try {
      setActionText(`Listing Strategy #${strategy.tokenId} for 0.01 0G...`);
      const signer = await getSigner();
      const account = await signer.getAddress();
      if (account.toLowerCase() !== strategy.owner.toLowerCase()) {
        throw new Error("Connect the wallet that owns this Strategy NFT before listing.");
      }

      const inft = new ethers.Contract(
        inftAddress,
        [
          "function getApproved(uint256 tokenId) view returns (address)",
          "function isApprovedForAll(address owner,address operator) view returns (bool)",
          "function approve(address to,uint256 tokenId) external",
        ],
        signer,
      );
      const approved = await inft.getApproved(strategy.tokenId).catch(() => ethers.ZeroAddress);
      const approvedForAll = await inft.isApprovedForAll(account, marketplaceAddress).catch(() => false);
      if (
        approved.toLowerCase() !== marketplaceAddress.toLowerCase() &&
        !approvedForAll
      ) {
        setActionText(`Approving Strategy #${strategy.tokenId}...`);
        const approveTx = await inft.approve(marketplaceAddress, strategy.tokenId);
        await approveTx.wait();
      }

      const marketplace = new ethers.Contract(
        marketplaceAddress,
        ["function listStrategy(uint256 tokenId,uint256 price) external"],
        signer,
      );
      const tx = await marketplace.listStrategy(
        strategy.tokenId,
        ethers.parseEther("0.01"),
      );
      await tx.wait();
      setActionText(`Strategy #${strategy.tokenId} listed at 0.01 0G.`);
      await loadMarketplace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to list strategy");
    } finally {
      setActionText(null);
    }
  }

  async function handleAdopt(strategy: StrategyListing, listing: MarketplaceListing) {
    if (!marketplaceAddress) {
      alert("Marketplace contract is not configured for this network yet.");
      return;
    }

    try {
      setActionText(`Adopting Strategy #${strategy.tokenId}...`);
      const signer = await getSigner();
      const marketplace = new ethers.Contract(
        marketplaceAddress,
        ["function adoptStrategy(uint256 tokenId) external payable"],
        signer,
      );
      const tx = await marketplace.adoptStrategy(strategy.tokenId, {
        value: BigInt(listing.priceWei),
      });
      await tx.wait();
      setActionText(`Strategy #${strategy.tokenId} adopted.`);
      await loadMarketplace();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to adopt strategy");
    } finally {
      setActionText(null);
    }
  }

  const stats = useMemo(() => {
    const verified = strategies.filter((strategy) => strategy.verified).length;
    const avgAccuracy =
      strategies.length > 0
        ? strategies.reduce((sum, strategy) => sum + (strategy.confidence ?? 0), 0) /
          strategies.length
        : 0;
    const topRoi = strategies.reduce(
      (best, strategy) => Math.max(best, strategy.yieldIncreasePct ?? 0),
      0,
    );
    const topApy = strategies.reduce(
      (best, strategy) => Math.max(best, strategy.apy ?? 0),
      0,
    );

    return {
      total: strategies.length,
      listed: listings.length,
      verified,
      avgAccuracy,
      topRoi,
      topApy,
    };
  }, [listings.length, strategies]);

  const sortedStrategies = useMemo(
    () =>
      [...strategies].sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      ),
    [strategies],
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-[#12242c] bg-[radial-gradient(circle_at_top,rgba(34,221,208,0.12),transparent_36%),#060b10]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#22ddd0] border-t-transparent" />
          <p className="text-[13px] text-[#9fb0be]">Syncing strategy marketplace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-[#2c1d1d] bg-[#0b0808] p-8 text-center">
        <p className="text-[15px] font-semibold text-white">{error}</p>
        <p className="mt-2 text-[13px] text-[#9fb0be]">
          The existing Agent NFT flow is still available from the Agents page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-[#12313a] bg-[radial-gradient(circle_at_15%_10%,rgba(34,221,208,0.24),transparent_26%),linear-gradient(135deg,#071018_0%,#05080d_58%,#071216_100%)] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.2)] bg-[rgba(34,221,208,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#8ff5ed]">
              <Boxes className="h-3.5 w-3.5" />
              Strategy NFT Marketplace
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[34px] font-semibold leading-[1.05] text-white sm:text-[48px]">
              Adopt proof-backed yield strategies.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#a8b7c3]">
              Marketplace ini membaca Strategy Agent NFT yang sudah dimint, menampilkan ROI, akurasi, APY, dan proof link yang berasal dari metadata strategi serta 0G Storage proof trail.
            </p>
            {message ? (
              <div className="mt-4 rounded-[16px] border border-[rgba(34,221,208,0.16)] bg-[rgba(34,221,208,0.06)] px-4 py-3 text-[13px] text-[#d7f7f4]">
                {message}
              </div>
            ) : null}
            {actionText ? (
              <div className="mt-3 rounded-[16px] border border-[rgba(104,255,122,0.18)] bg-[rgba(104,255,122,0.07)] px-4 py-3 text-[13px] text-[#dfffe4]">
                {actionText}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Minted Strategies", value: stats.total.toString(), tone: "text-white" },
              { label: "Active Listings", value: stats.listed.toString(), tone: "text-[#68ff7a]" },
              { label: "Verified Artifacts", value: stats.verified.toString(), tone: "text-[#68ff7a]" },
              { label: "Top ROI Lift", value: `${stats.topRoi.toFixed(2)}%`, tone: "text-[#68ff7a]" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] p-4"
              >
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#8598a7]">
                  {item.label}
                </div>
                <div className={`mt-2 text-[30px] font-semibold ${item.tone}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-[#16242d] bg-[#071017] p-5">
          <Database className="h-5 w-5 text-[#22ddd0]" />
          <div className="mt-4 text-[15px] font-semibold text-white">0G-linked metadata</div>
          <p className="mt-2 text-[13px] leading-6 text-[#9fb0be]">
            Strategy metadata keeps performance context and links back to the stored optimization proof.
          </p>
        </div>
        <div className="rounded-[24px] border border-[#16242d] bg-[#071017] p-5">
          <ShieldCheck className="h-5 w-5 text-[#68ff7a]" />
          <div className="mt-4 text-[15px] font-semibold text-white">Proof-aware adoption</div>
          <p className="mt-2 text-[13px] leading-6 text-[#9fb0be]">
            Buyers can inspect ProofRegistry or storage transactions before trusting a strategy artifact.
          </p>
        </div>
        <div className="rounded-[24px] border border-[#16242d] bg-[#071017] p-5">
          <Sparkles className="h-5 w-5 text-[#22ddd0]" />
          <div className="mt-4 text-[15px] font-semibold text-white">Adoption-ready contract</div>
          <p className="mt-2 text-[13px] leading-6 text-[#9fb0be]">
            A simple marketplace contract is included for listing and adopting enumerable Strategy NFTs.
          </p>
        </div>
      </section>

      {sortedStrategies.length === 0 ? (
        <section className="rounded-[28px] border border-[#17232d] bg-[#070d12] p-8 text-center">
          <p className="text-[15px] font-semibold text-white">No Strategy NFTs listed yet</p>
          <p className="mt-2 text-[13px] text-[#9fb0be]">
            Run one-click optimization, mint as Agent NFT, then return here to see the strategy inventory.
          </p>
          <Link
            href="/agent"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(34,221,208,0.24)] bg-[rgba(34,221,208,0.08)] px-5 py-3 text-[13px] font-semibold text-[#9ff7f0]"
          >
            Open boost flow
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {sortedStrategies.map((strategy) => {
            const proofHref = getProofHref(strategy);
            const listing = listingMap.get(strategy.tokenId);
            return (
              <article
                key={`${strategy.tokenId}-${strategy.timestamp}`}
                className="group rounded-[26px] border border-[#15232d] bg-[linear-gradient(180deg,#09131b_0%,#060b11_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] transition hover:border-[rgba(34,221,208,0.28)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7e95a5]">
                      Strategy NFT #{strategy.tokenId}
                    </div>
                    <h2 className="mt-2 text-[21px] font-semibold text-white">
                      {strategy.recommended ?? "Proof-backed Strategy"}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[rgba(34,221,208,0.2)] bg-[rgba(34,221,208,0.08)] px-3 py-1 text-[11px] text-[#9ff7f0]">
                    {strategy.verified ? "Verified" : "Proof-linked"}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] border border-[#182733] bg-[rgba(255,255,255,0.03)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[#7f93a2]">APY</div>
                    <div className="mt-1 text-[20px] font-semibold text-[#22ddd0]">
                      {strategy.apy.toFixed(2)}%
                    </div>
                  </div>
                  <div className="rounded-[16px] border border-[#182733] bg-[rgba(255,255,255,0.03)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[#7f93a2]">ROI Lift</div>
                    <div className="mt-1 text-[20px] font-semibold text-[#68ff7a]">
                      +{(strategy.yieldIncreasePct ?? 0).toFixed(2)}%
                    </div>
                  </div>
                  <div className="rounded-[16px] border border-[#182733] bg-[rgba(255,255,255,0.03)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[#7f93a2]">Accuracy</div>
                    <div className="mt-1 text-[20px] font-semibold text-white">
                      {(strategy.confidence ?? 0).toFixed(0)}%
                    </div>
                  </div>
                  <div className="rounded-[16px] border border-[#182733] bg-[rgba(255,255,255,0.03)] p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[#7f93a2]">Annual Gain</div>
                    <div className="mt-1 text-[20px] font-semibold text-white">
                      {formatCurrency(strategy.estimatedAnnualGain)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 rounded-[18px] border border-[#15232d] bg-[#060b10] p-3 text-[12px] text-[#9fb0be]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Owner</span>
                    <span className="font-medium text-white">{shortAddr(strategy.owner)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Source</span>
                    <span className="font-medium text-white">{strategy.sourceLabel ?? "Agent NFT"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Synced</span>
                    <span className="font-medium text-white">
                      {new Date(strategy.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Listing</span>
                    <span className="font-medium text-white">
                      {listing ? `${listing.price0G} 0G` : "Not listed"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {proofHref ? (
                    <a
                      href={proofHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#00c9b1,#13d4ff)] px-4 py-2 text-[12px] font-semibold text-[#061014]"
                    >
                      Open proof
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  {listing ? (
                    <button
                      type="button"
                      onClick={() => void handleAdopt(strategy, listing)}
                      disabled={Boolean(actionText)}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(104,255,122,0.24)] bg-[rgba(104,255,122,0.10)] px-4 py-2 text-[12px] font-semibold text-[#dfffe4] disabled:opacity-60"
                    >
                      <Wallet2 className="h-3.5 w-3.5" />
                      Adopt for {listing.price0G} 0G
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleList(strategy)}
                      disabled={Boolean(actionText)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#263743] bg-[#0a131a] px-4 py-2 text-[12px] font-semibold text-[#dce7ee] disabled:opacity-60"
                    >
                      <Wallet2 className="h-3.5 w-3.5" />
                      List 0.01 0G
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="rounded-[24px] border border-[#15232d] bg-[#070d12] p-5">
        <div className="text-[14px] font-semibold text-white">Implementation note</div>
        <p className="mt-2 text-[13px] leading-6 text-[#9fb0be]">
          This marketplace reads minted Strategy NFTs, active adoption listings, and proof-backed performance metadata. Owners can list a strategy after approving the marketplace contract; another wallet can adopt it on-chain.
        </p>
      </section>
    </div>
  );
}
