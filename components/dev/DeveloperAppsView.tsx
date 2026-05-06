import { KeyRound } from "lucide-react";

import { revokeApiKeyAction } from "@/app/dev/actions";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import ManagedApiKeyCreateForm from "@/components/dev/ManagedApiKeyCreateForm";
import type { ManagedApiKey } from "@/lib/dev-portal";
import { formatDateTime, shortenHash } from "@/lib/dev-portal";

interface DeveloperAppsViewProps {
  session: {
    walletAddress: string;
    role: "owner" | "developer";
  } | null;
  apiKeys: ManagedApiKey[];
}

export default function DeveloperAppsView({
  session,
  apiKeys,
}: DeveloperAppsViewProps) {
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

  return (
    <DeveloperPortalShell
      eyebrow="Developer Dashboard"
      title="Your wallet is your developer identity."
      description="Create project keys, rotate them, and monitor your API surface — scoped to the connected wallet."
    >
      {/* ── Stats row ────────────────────────────────────── */}
      <section className="fade-in-up fade-in-up-1 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Wallet" value={shortenHash(session.walletAddress, 6, 4)} tone="white" />
        <StatCard label="Role" value={session.role} tone="green" />
        <StatCard label="API keys" value={String(apiKeys.length)} tone="white" />
        <StatCard label="Requests" value={String(totalRequests)} tone="white" />
        <StatCard label="Blocked" value={String(blockedRequests)} tone={blockedRequests > 0 ? "amber" : "white"} />
        <StatCard label="Network" value="0G testnet" tone="green" />
      </section>

      {/* ── Create key + key list ────────────────────────── */}
      <section className="fade-in-up fade-in-up-2 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="yb-card rounded-2xl p-6">
          <h2 className="text-[20px] font-semibold text-white">Buy API access with YA</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">
            Choose a package, pay with YA on 0G Galileo testnet, then generate a scoped API key.
          </p>
          <ManagedApiKeyCreateForm
            ownerWalletAddress={session.walletAddress}
            submitLabel="Generate API key"
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

                  {item.status === "active" ? (
                    <form action={revokeApiKeyAction} className="mt-3">
                      <input type="hidden" name="key_id" value={item.key_id} />
                      <button
                        type="submit"
                        className="revoke-btn w-full rounded-lg border border-[rgba(255,112,112,0.18)] bg-[rgba(255,112,112,0.06)] px-3 py-2 text-[12px] font-semibold text-[#ff9090]"
                      >
                        Revoke key
                      </button>
                    </form>
                  ) : (
                    <div className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-[13px] text-[#d0e0ec]">
                      Revoked {formatDateTime(item.revoked_at)}
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
