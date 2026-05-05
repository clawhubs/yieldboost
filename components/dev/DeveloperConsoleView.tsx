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
        description="Developer users can manage their own app keys from the developer dashboard. The owner console is only for the founder wallet and platform-wide oversight."
      >
        <section className="yb-card rounded-[24px] p-6 md:p-7">
          <p className="text-[15px] leading-7 text-[#a5b8c7]">
            Connect the founder wallet from the portal overview to unlock this route.
          </p>
          <a
            href="/dev"
            className="yb-teal-button mt-5 inline-flex rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950"
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
      title="Generate keys, watch usage, revoke exposure, and audit the blast radius."
      description="This console is the operating layer for developer access. It is intentionally separated from the app workspace and reads from the live Integrity API admin surface."
    >
      {!setup.adminEnabled ? (
        <section className="yb-card rounded-[24px] p-6 md:p-7">
          <h2 className="text-[24px] font-semibold text-white">Console needs one server-side secret</h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#9cb0c1]">
            Add the missing environment variables below to the Next.js deployment serving `dev.yieldboostai.xyz`. The browser never sees these values.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {setup.missing.map((entry) => (
              <div key={entry} className="yb-soft-card rounded-[18px] p-4 text-[14px] font-semibold text-white">
                {entry}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="yb-card rounded-[24px] p-6">
              <h2 className="text-[24px] font-semibold text-white">Create managed API key</h2>
              <p className="mt-3 text-[14px] leading-7 text-[#9db0c0]">
                Give each developer app its own key. Ownership stays at the wallet layer, while app identity, rate limits, usage, and revocation stay here.
              </p>
              <ManagedApiKeyCreateForm submitLabel="Generate API key" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <StatCard label="Managed keys" value={String(dashboard?.total_api_keys ?? 0)} tone="white" />
              <StatCard label="Active keys" value={String(dashboard?.active_api_keys ?? 0)} tone="green" />
              <StatCard label="Requests tracked" value={String(dashboard?.total_requests ?? 0)} tone="white" />
              <StatCard label="Blocked events" value={String(dashboard?.blocked_requests ?? 0)} tone="amber" />
              <StatCard label="Deflected attacks" value={String(dashboard?.total_deflected_attacks ?? 0)} tone="amber" />
              <StatCard label="API base" value={setup.apiBaseUrl.replace("https://", "")} tone="white" />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <div className="yb-card rounded-[24px] p-6">
              <h2 className="text-[24px] font-semibold text-white">Managed API keys</h2>
              <div className="mt-5 space-y-3">
                {apiKeys.length ? (
                  apiKeys.map((item) => (
                    <article key={item.key_id} className="yb-soft-card rounded-[20px] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[17px] font-semibold text-white">{item.app_name}</h3>
                            <span className="rounded-full border border-[rgba(0,201,177,0.2)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#8ff7ea]">
                              {item.environment}
                            </span>
                            <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${item.status === "active" ? "border border-[rgba(97,242,159,0.22)] text-[#84f5b0]" : "border border-[rgba(247,185,85,0.22)] text-[#f5c67d]"}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-2 font-mono text-[13px] text-[#d4f4f0]">{item.key_preview}</p>
                          <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-[#f5c67d]">
                            Preview only. Raw key is never shown here again.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#8ea4b4]">
                            <span>Owner: {item.owner_label || "Unassigned"}</span>
                            <span>Created: {formatDateTime(item.created_at)}</span>
                            <span>Last used: {formatDateTime(item.last_used_at)}</span>
                          </div>
                          <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">
                            Scopes: {item.scopes.length ? item.scopes.join(", ") : "default platform"}
                          </p>
                          {item.notes ? (
                            <p className="mt-3 text-[13px] leading-6 text-[#9eb3c2]">{item.notes}</p>
                          ) : null}
                        </div>

                        <div className="flex min-w-[220px] flex-col gap-3">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <MiniMetric label="Requests" value={String(item.total_requests)} />
                            <MiniMetric label="Success" value={String(item.success_requests)} />
                            <MiniMetric label="Blocked" value={String(item.blocked_requests)} />
                          </div>
                          {item.status === "active" ? (
                            <form action={revokeApiKeyAction}>
                              <input type="hidden" name="key_id" value={item.key_id} />
                              <p className="mb-2 text-[12px] leading-5 text-[#8ea4b4]">
                                Revoking disables the key. It does not reveal the raw key again.
                              </p>
                              <button
                                type="submit"
                                className="w-full rounded-[14px] border border-[rgba(255,112,112,0.2)] bg-[rgba(255,112,112,0.08)] px-4 py-3 text-[13px] font-semibold text-[#ff9090]"
                              >
                                Revoke key
                              </button>
                            </form>
                          ) : (
                            <div className="rounded-[14px] border border-white/8 px-4 py-3 text-[13px] text-[#8ea4b4]">
                              Revoked {formatDateTime(item.revoked_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="yb-soft-card rounded-[20px] p-5 text-[14px] leading-7 text-[#9cb0c1]">
                    No managed API keys yet. Create the first developer credential from this console.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="yb-card rounded-[24px] p-6">
                <h2 className="text-[20px] font-semibold text-white">Top apps</h2>
                <div className="mt-4 space-y-3">
                  {dashboard?.top_apps.length ? (
                    dashboard.top_apps.map((item) => (
                      <div key={`${item.key_id ?? item.app_name}`} className="glass-inset rounded-[16px] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[15px] font-semibold text-white">{item.app_name}</p>
                          <p className="text-[12px] text-[#8aa2b1]">{item.total_requests} req</p>
                        </div>
                        <p className="mt-2 text-[13px] leading-6 text-[#9db0c0]">
                          Success {item.success_requests} · Blocked {item.blocked_requests} · Last used {formatDateTime(item.last_used_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="glass-inset rounded-[16px] px-4 py-4 text-[14px] text-[#9db0c0]">
                      Usage data will appear after apps start calling the API.
                    </div>
                  )}
                </div>
              </div>

              <div className="yb-card rounded-[24px] p-6">
                <h2 className="text-[20px] font-semibold text-white">Login stance</h2>
                <p className="mt-4 text-[14px] leading-7 text-[#9db0c0]">
                  For beta operators and early developer onboarding, 0G testnet wallet login is the right first stop. It exercises the real signature path without forcing early mainnet operational risk.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="yb-card rounded-[24px] p-6">
              <h2 className="text-[22px] font-semibold text-white">Recent usage</h2>
              <div className="mt-4 space-y-3">
                {dashboard?.recent_usage.length ? (
                  dashboard.recent_usage.slice(0, 12).map((item) => (
                    <div key={`${item.request_id}-${item.timestamp}`} className="glass-inset rounded-[16px] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-semibold text-white">{item.app_name}</p>
                        <p className="text-[12px] text-[#8aa2b1]">{item.status_code} · {item.latency_ms}ms</p>
                      </div>
                      <p className="mt-2 font-mono text-[12px] text-[#d2f3ee]">{item.method} {item.path}</p>
                      <p className="mt-2 text-[13px] leading-6 text-[#9db0c0]">
                        {item.network || "multi"} · wallet {shortenHash(item.wallet_address, 8, 4)} · {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="glass-inset rounded-[16px] px-4 py-4 text-[14px] text-[#9db0c0]">
                    Usage logs will stream in after authenticated requests hit the API.
                  </div>
                )}
              </div>
            </div>

            <div className="yb-card rounded-[24px] p-6">
              <h2 className="text-[22px] font-semibold text-white">Recent security logs</h2>
              <div className="mt-4 space-y-3">
                {dashboard?.recent_logs.length ? (
                  dashboard.recent_logs.slice(0, 12).map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="glass-inset rounded-[16px] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] font-semibold text-white">{item.action_type}</p>
                        <p className={`text-[12px] ${item.status === "Blocked" ? "text-[#f5c67d]" : "text-[#84f5b0]"}`}>{item.status}</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-[#9db0c0]">
                        Wallet {shortenHash(item.wallet_address, 8, 4)} · Layer {item.layer_failed || "passed"} · {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="glass-inset rounded-[16px] px-4 py-4 text-[14px] text-[#9db0c0]">
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
    <div className="yb-soft-card rounded-[20px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8aa2b1]">{label}</p>
      <p className={`mt-3 break-words text-[26px] font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-inset rounded-[12px] px-2 py-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#8aa2b1]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold text-white">{value}</p>
    </div>
  );
}
