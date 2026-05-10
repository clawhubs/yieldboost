import { KeyRound, Shield } from "lucide-react";

import { revokeApiKeyAction } from "@/app/dev/actions";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import ManagedApiKeyCreateForm from "@/components/dev/ManagedApiKeyCreateForm";
import type { DevDashboardResponse, ManagedApiKey, SetupState } from "@/lib/dev-portal";
import { formatDateTime, shortenHash } from "@/lib/dev-portal";

interface DeveloperConsoleViewProps {
  session: {
    walletAddress: string;
    role: "owner" | "developer";
  } | null;
  setup: SetupState;
  dashboard: DevDashboardResponse | null;
  apiKeys: ManagedApiKey[];
}

export default function DeveloperConsoleView({
  session,
  setup,
  dashboard,
  apiKeys,
}: DeveloperConsoleViewProps) {
  if (!session || session.role !== "owner") {
    return (
      <DeveloperPortalShell
        eyebrow="Owner Console"
        title="This route is reserved for the founder wallet."
        description="The owner console is for the founder wallet and platform-wide oversight."
      >
        <section className="empty-state rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(0,201,177,0.15)] bg-[rgba(0,201,177,0.05)]">
            <Shield className="h-6 w-6 text-[#72f3c7]" />
          </div>
          <p className="mt-4 text-[15px] leading-7 text-[#c8dae6]">
            Connect the founder wallet from the portal overview to unlock this route.
          </p>
          <a
            href="/dev"
            className="yb-teal-button mt-5 inline-flex rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-950"
          >
            Go to portal overview
          </a>
        </section>
      </DeveloperPortalShell>
    );
  }

  return (
    <DeveloperPortalShell
      eyebrow="Owner Console"
      title="Generate keys, watch usage, revoke exposure, audit blast radius."
      description="Operating layer for developer access — reads from the live Integrity API admin surface."
    >
      {!setup.adminEnabled ? (
        <section className="yb-card rounded-2xl p-6">
          <h2 className="text-[20px] font-semibold text-white">Console needs server-side secrets</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#c8dae6]">
            Add the missing environment variables to the deployment. The browser never sees these values.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {setup.missing.map((entry) => (
              <div key={entry} className="yb-soft-card rounded-xl p-3.5 font-mono text-[13px] font-semibold text-white">
                {entry}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* ── Stats row ────────────────────────────────────── */}
          <section className="fade-in-up fade-in-up-1 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Managed keys" value={String(dashboard?.total_api_keys ?? 0)} tone="white" />
            <StatCard label="Active" value={String(dashboard?.active_api_keys ?? 0)} tone="green" />
            <StatCard label="Requests" value={String(dashboard?.total_requests ?? 0)} tone="white" />
            <StatCard label="Blocked" value={String(dashboard?.blocked_requests ?? 0)} tone="amber" />
            <StatCard label="Deflected" value={String(dashboard?.total_deflected_attacks ?? 0)} tone="amber" />
            <StatCard label="API base" value={setup.apiBaseUrl.replace("https://", "")} tone="white" />
          </section>

          {/* ── Create key + key list ────────────────────────── */}
          <section className="fade-in-up fade-in-up-2 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="yb-card rounded-2xl p-6">
              <h2 className="text-[20px] font-semibold text-white">Create managed API key</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">
                Give each developer app its own key. Ownership stays at the wallet layer.
              </p>
              <ManagedApiKeyCreateForm paymentMode="admin" submitLabel="Generate API key" />
            </div>

            <div className="yb-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold text-white">Managed API keys</h2>
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
                        Delete API key
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
                      No managed API keys yet. Create the first credential from this console.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Top apps + stance ─────────────────────────── */}
          <section className="fade-in-up fade-in-up-3 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className="yb-card rounded-2xl p-6">
              <h2 className="text-[18px] font-semibold text-white">Top apps</h2>
              <div className="mt-4 space-y-2">
                {dashboard?.top_apps.length ? (
                  dashboard.top_apps.map((item) => (
                    <div key={`${item.key_id ?? item.app_name}`} className="glass-inset rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-semibold text-white">{item.app_name}</p>
                        <p className="text-[12px] text-[#c0d4e2]">{item.total_requests} req</p>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-5 text-[#c8dae6]">
                        Success {item.success_requests} · Blocked {item.blocked_requests} · Last used {formatDateTime(item.last_used_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state rounded-xl px-4 py-6 text-center text-[13px] text-[#d0e0ec]">
                    Usage data will appear after apps start calling the API.
                  </div>
                )}
              </div>
            </div>

            <div className="yb-card rounded-2xl p-6">
              <h2 className="text-[18px] font-semibold text-white">Login stance</h2>
              <p className="mt-3 text-[13px] leading-7 text-[#c8dae6]">
                The developer portal is now mainnet-first: wallet login and package activation stay lightweight, while issued API keys reflect the real 0G mainnet path.
              </p>
            </div>
          </section>

          {/* ── Usage + security logs ────────────────────── */}
          <section className="fade-in-up fade-in-up-4 grid gap-4 xl:grid-cols-2">
            <div className="yb-card rounded-2xl p-6">
              <h2 className="text-[18px] font-semibold text-white">Recent usage</h2>
              <div className="mt-4 space-y-2">
                {dashboard?.recent_usage.length ? (
                  dashboard.recent_usage.slice(0, 12).map((item) => (
                    <div key={`${item.request_id}-${item.timestamp}`} className="glass-inset rounded-xl px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold text-white">{item.app_name}</p>
                        <p className="font-mono text-[12px] text-[#c0d4e2]">{item.status_code} · {item.latency_ms}ms</p>
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-[#d2f3ee]">{item.method} {item.path}</p>
                      <p className="mt-1 text-[12px] text-[#c0d4e2]">
                        {item.network || "multi"} · {shortenHash(item.wallet_address, 6, 4)} · {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state rounded-xl px-4 py-6 text-center text-[13px] text-[#d0e0ec]">
                    Usage logs will stream in after authenticated requests hit the API.
                  </div>
                )}
              </div>
            </div>

            <div className="yb-card rounded-2xl p-6">
              <h2 className="text-[18px] font-semibold text-white">Recent security logs</h2>
              <div className="mt-4 space-y-2">
                {dashboard?.recent_logs.length ? (
                  dashboard.recent_logs.slice(0, 12).map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="glass-inset rounded-xl px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold text-white">{item.action_type}</p>
                        <p className={`text-[11px] font-semibold ${item.status === "Blocked" ? "text-[#f5c67d]" : "text-[#84f5b0]"}`}>{item.status}</p>
                      </div>
                      <p className="mt-1.5 text-[12px] text-[#c0d4e2]">
                        {shortenHash(item.wallet_address, 6, 4)} · Layer {item.layer_failed || "passed"} · {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state rounded-xl px-4 py-6 text-center text-[13px] text-[#d0e0ec]">
                    Security logs will appear after seal and unseal activity reaches the pipeline.
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
