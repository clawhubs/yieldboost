"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";

import { revokeApiKeyAction } from "@/app/dev/actions";
import DevHideRevokedKeyButton from "@/components/dev/DevHideRevokedKeyButton";
import DevPackageEndpointGuide from "@/components/dev/DevPackageEndpointGuide";
import DevPortalLogoutButton from "@/components/dev/DevPortalLogoutButton";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import ManagedApiKeyCreateForm from "@/components/dev/ManagedApiKeyCreateForm";
import type { ManagedApiKey } from "@/lib/dev-portal";
import { formatDateTime, shortenHash } from "@/lib/dev-portal";
import { getYaApiPlan, O_G_MAINNET_EXPLORER_URL } from "@/lib/ya-api-plans";

interface DeveloperAppsViewProps {
  session: {
    walletAddress: string;
    role: "owner" | "developer";
  } | null;
  apiKeys: ManagedApiKey[];
  initialPlanId?: string;
}

type AppsDashboardTab = "overview" | "endpoints";

export default function DeveloperAppsView({
  session,
  apiKeys,
  initialPlanId,
}: DeveloperAppsViewProps) {
  const defaultPlanId = getYaApiPlan(initialPlanId || "builder").id;
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const [activeTab, setActiveTab] = useState<AppsDashboardTab>("overview");
  const selectedPlan = useMemo(() => getYaApiPlan(selectedPlanId), [selectedPlanId]);
  const checkoutFocused = Boolean(initialPlanId);
  const latestCheckoutProof = useMemo(
    () =>
      apiKeys.find(
        (item) => Boolean(item.checkout_tx_hash || item.checkout_integrity_hash),
      ) ?? null,
    [apiKeys],
  );

  useEffect(() => {
    setSelectedPlanId(defaultPlanId);
  }, [defaultPlanId]);

  if (!session) {
    return (
      <DeveloperPortalShell
        eyebrow="Developer Dashboard"
        title="Sign in with wallet to create your first API credential."
        description="Wallet login auto-registers your developer account and scopes future API keys to your wallet."
      >
        <section className="empty-state rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(0,201,177,0.15)] bg-[rgba(0,201,177,0.05)]">
            <KeyRound className="h-6 w-6 text-[#72f3c7]" />
          </div>
          <p className="mt-4 text-[15px] leading-7 text-[#c8dae6]">
            Connect a wallet from the portal overview to start creating API keys.
          </p>
          <a
            href="/dev"
            className="yb-teal-button mt-5 inline-flex rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-950"
          >
            Go to wallet login
          </a>
        </section>
      </DeveloperPortalShell>
    );
  }

  const totalRequests = apiKeys.reduce((sum, item) => sum + item.total_requests, 0);
  const blockedRequests = apiKeys.reduce((sum, item) => sum + item.blocked_requests, 0);

  function openOverviewCheckout() {
    setActiveTab("overview");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById("checkout")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  return (
    <DeveloperPortalShell
      eyebrow={checkoutFocused ? "Checkout" : "Developer Dashboard"}
      title={checkoutFocused ? `Activate the ${selectedPlan.name} package.` : "Your wallet is your developer identity."}
      description={
        checkoutFocused
          ? "Review the package, sign the wallet activation, then mint the scoped API key for this package."
          : "Create project keys, rotate them, and monitor your API surface — scoped to the connected wallet."
      }
    >
      <section className="fade-in-up fade-in-up-1 flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c0d4e2]">Portal session</p>
          <p className="mt-1 text-[14px] leading-6 text-[#d0e0ec]">
            Signed in as <span className="font-semibold text-white">{shortenHash(session.walletAddress, 6, 4)}</span> on the developer dashboard.
          </p>
        </div>
        <DevPortalLogoutButton />
      </section>

      {/* ── Stats row ────────────────────────────────────── */}
      <section className="fade-in-up fade-in-up-2 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Wallet" value={shortenHash(session.walletAddress, 6, 4)} tone="white" />
        <StatCard label="Role" value={session.role} tone="green" />
        <StatCard label="API keys" value={String(apiKeys.length)} tone="white" />
        <StatCard label="Requests" value={String(totalRequests)} tone="white" />
        <StatCard label="Blocked" value={String(blockedRequests)} tone={blockedRequests > 0 ? "amber" : "white"} />
        <StatCard label="Network" value="0G mainnet" tone="green" />
      </section>

      <section className="fade-in-up fade-in-up-3 yb-card rounded-2xl p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c0d4e2]">
              Dashboard Sections
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[#d0e0ec]">
              Keep API key management and package endpoint reference in the same dashboard, but not in one crowded canvas.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                activeTab === "overview"
                  ? "border-[rgba(0,201,177,0.38)] bg-[rgba(0,201,177,0.09)]"
                  : "border-white/8 bg-[rgba(255,255,255,0.03)] hover:border-white/16"
              }`}
            >
              <p className="text-[14px] font-semibold text-white">Overview</p>
              <p className="mt-1 text-[12px] text-[#c8dae6]">
                Wallet session, package activation, and API keys.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("endpoints")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                activeTab === "endpoints"
                  ? "border-[rgba(0,201,177,0.38)] bg-[rgba(0,201,177,0.09)]"
                  : "border-white/8 bg-[rgba(255,255,255,0.03)] hover:border-white/16"
              }`}
            >
              <p className="text-[14px] font-semibold text-white">Endpoints</p>
              <p className="mt-1 text-[12px] text-[#c8dae6]">
                See exactly which routes are included in each package.
              </p>
            </button>
          </div>
        </div>
      </section>

      {activeTab === "endpoints" ? (
        <DevPackageEndpointGuide
          initialPlanId={defaultPlanId}
          selectedPlanId={selectedPlan.id}
          onSelectedPlanChange={setSelectedPlanId}
          onActivatePackage={openOverviewCheckout}
        />
      ) : (
        <>
          <section className="fade-in-up fade-in-up-4 yb-card rounded-2xl p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9ff7f0]">
                  Latest Purchase Proof
                </p>
                {latestCheckoutProof ? (
                  <>
                    <p className="mt-1 text-[15px] font-semibold text-white">
                      {latestCheckoutProof.plan_name || latestCheckoutProof.app_name}
                    </p>
                    <p className="mt-1 text-[12px] text-[#c8dae6]">
                      Recorded {formatDateTime(latestCheckoutProof.created_at)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-[13px] leading-6 text-[#c8dae6]">
                    No checkout proof has been recorded on this dashboard yet.
                  </p>
                )}
              </div>
              {latestCheckoutProof ? (
                <div className="grid gap-2 md:min-w-[320px]">
                  {latestCheckoutProof.checkout_tx_hash ? (
                    <a
                      href={`${O_G_MAINNET_EXPLORER_URL}/tx/${latestCheckoutProof.checkout_tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-[rgba(0,201,177,0.16)] bg-[rgba(0,201,177,0.05)] px-3 py-2 text-[12px] text-[#d0e0ec]"
                    >
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-[#9ff7f0]">
                        Checkout Tx
                      </span>
                      <span className="mt-1 block font-mono text-white">
                        {shortenHash(latestCheckoutProof.checkout_tx_hash, 12, 10)}
                      </span>
                    </a>
                  ) : null}
                  {latestCheckoutProof.checkout_integrity_hash ? (
                    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[12px] text-[#d0e0ec]">
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-[#9ff7f0]">
                        Integrity Proof
                      </span>
                      <span className="mt-1 block font-mono text-white">
                        {shortenHash(latestCheckoutProof.checkout_integrity_hash, 12, 10)}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section id="checkout" className="fade-in-up fade-in-up-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="yb-card rounded-2xl p-6">
              <h2 className="text-[20px] font-semibold text-white">Activate API access</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">
                Choose a package, sign the wallet activation, then generate a scoped API key.
              </p>
            <div className="mt-4 rounded-xl border border-[rgba(0,201,177,0.20)] bg-[rgba(0,201,177,0.06)] px-4 py-3 text-[13px] leading-6 text-[#d4f6f1]">
              Selected package: <span className="font-semibold text-white">{selectedPlan.name}</span>.
              {checkoutFocused
                ? " Finish wallet activation first, then the package becomes active when the API key is generated."
                : " Switch packages here when you want to activate a different API surface for this wallet."}
            </div>
            <ManagedApiKeyCreateForm
              ownerWalletAddress={session.walletAddress}
              submitLabel={checkoutFocused ? "Activate package & generate API key" : "Generate API key"}
              initialPlanId={defaultPlanId}
              selectedPlanId={selectedPlan.id}
              onSelectedPlanIdChange={setSelectedPlanId}
            />
          </div>

            <div className="yb-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold text-white">Your API keys</h2>
                <span className="rounded-full border border-[rgba(114,243,199,0.2)] px-2 py-0.5 text-[11px] font-semibold text-[#72f3c7]">
                  {apiKeys.length} key{apiKeys.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {apiKeys.length ? (
                  apiKeys.map((item) => (
                    <article key={item.key_id} className="yb-soft-card key-card-hover rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-white">{item.app_name}</h3>
                      {item.plan_name ? (
                        <span className="rounded-full border border-[rgba(114,243,199,0.2)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#72f3c7]">
                          {item.plan_name}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-[rgba(0,201,177,0.18)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#8ff7ea]">
                        {item.environment}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                        item.status === "active"
                          ? "status-active border border-[rgba(97,242,159,0.18)] text-[#84f5b0]"
                          : "status-revoked border border-[rgba(247,185,85,0.18)] text-[#f5c67d]"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[12px] text-[#d4f4f0]">{item.key_preview}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#e0b86a]">
                      Preview only — raw key shown once at creation.
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniMetric label="Requests" value={String(item.total_requests)} />
                      <MiniMetric label="Success" value={String(item.success_requests)} />
                      <MiniMetric label="Blocked" value={String(item.blocked_requests)} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#d0e0ec]">
                      <span>Owner: {item.owner_label || "—"}</span>
                      <span>Created: {formatDateTime(item.created_at)}</span>
                      <span>Last used: {formatDateTime(item.last_used_at)}</span>
                    </div>
                    {item.scopes.length ? (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#c0d4e2]">
                        Scopes: {item.scopes.join(", ")}
                      </p>
                    ) : null}
                    {item.notes ? (
                      <p className="mt-2 text-[12px] leading-5 text-[#c8dae6]">{item.notes}</p>
                    ) : null}
                    {item.checkout_tx_hash || item.checkout_integrity_hash ? (
                      <div className="mt-3 rounded-lg border border-[rgba(0,201,177,0.14)] bg-[rgba(0,201,177,0.05)] px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ff7f0]">
                          Checkout Proof
                        </p>
                        <div className="mt-2 space-y-1.5 text-[12px] text-[#d0e0ec]">
                          {item.checkout_tx_hash ? (
                            <p>
                              Checkout tx:{" "}
                              <a
                                href={`${O_G_MAINNET_EXPLORER_URL}/tx/${item.checkout_tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[#9ff7f0] underline-offset-2 hover:underline"
                              >
                                {shortenHash(item.checkout_tx_hash, 10, 8)}
                              </a>
                            </p>
                          ) : null}
                          {item.checkout_integrity_hash ? (
                            <p>
                              Integrity proof:{" "}
                              <span className="font-mono text-white">
                                {shortenHash(item.checkout_integrity_hash, 14, 10)}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {item.status === "active" ? (
                      <form action={revokeApiKeyAction} className="mt-3">
                        <input type="hidden" name="key_id" value={item.key_id} />
                        <button
                          type="submit"
                          className="revoke-btn w-full rounded-lg border border-[rgba(255,112,112,0.18)] bg-[rgba(255,112,112,0.06)] px-3 py-2 text-[12px] font-semibold text-[#ff9090]"
                        >
                          Revoke API key
                        </button>
                      </form>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <div className="rounded-lg border border-white/10 px-3 py-2 text-[13px] text-[#d0e0ec]">
                          Revoked {formatDateTime(item.revoked_at)}. This key is inactive and can be removed from this dashboard with a wallet signature.
                        </div>
                        <DevHideRevokedKeyButton
                          keyId={item.key_id}
                          walletAddress={session.walletAddress}
                        />
                      </div>
                    )}
                    </article>
                  ))
                ) : (
                  <div className="empty-state flex flex-col items-center rounded-xl px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(0,201,177,0.12)] bg-[rgba(0,201,177,0.04)]">
                      <KeyRound className="h-5 w-5 text-[#72f3c7]" />
                    </div>
                    <p className="mt-3 text-[14px] leading-6 text-[#d0e0ec]">
                      No API keys yet. Create your first credential from the form.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </DeveloperPortalShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "white" | "green" | "amber";
}) {
  const color = tone === "green" ? "text-[#84f5b0]" : tone === "amber" ? "text-[#f5c67d]" : "text-white";
  return (
    <div className="yb-soft-card rounded-xl px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c0d4e2]">{label}</p>
      <p className={`mt-1.5 break-words text-[18px] font-semibold leading-tight ${color}`}>{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-lg px-2 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#c0d4e2]">{label}</p>
      <p className="mt-1 text-[14px] font-semibold text-white">{value}</p>
    </div>
  );
}
