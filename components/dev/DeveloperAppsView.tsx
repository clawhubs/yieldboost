import { createApiKeyAction, revokeApiKeyAction } from "@/app/dev/actions";
import CreatedApiKeyCard from "@/components/dev/CreatedApiKeyCard";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import type { ManagedApiKey } from "@/lib/dev-portal";
import { formatDateTime, shortenHash } from "@/lib/dev-portal";

interface DeveloperAppsViewProps {
  session: {
    walletAddress: string;
    role: "owner" | "developer";
  } | null;
  apiKeys: ManagedApiKey[];
  createdApiKey: string | null;
  createdApiKeyLabel: string | null;
}

export default function DeveloperAppsView({
  session,
  apiKeys,
  createdApiKey,
  createdApiKeyLabel,
}: DeveloperAppsViewProps) {
  if (!session) {
    return (
      <DeveloperPortalShell
        eyebrow="Developer Dashboard"
        title="Sign in with wallet to create your first API credential."
        description="This dashboard is for developer users, not public visitors. Wallet login auto-registers your developer account and scopes future API keys to your wallet."
      >
        <section className="yb-card rounded-[24px] p-6 md:p-7">
          <p className="text-[15px] leading-7 text-[#a5b8c7]">
            Return to the portal overview and connect a wallet first.
          </p>
          <a
            href="/dev"
            className="yb-teal-button mt-5 inline-flex rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950"
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
      description="This dashboard is scoped to the connected wallet. Create project keys, rotate them, and monitor your own API surface without seeing the founder's private operations."
    >
      {createdApiKey ? (
        <CreatedApiKeyCard apiKey={createdApiKey} label={createdApiKeyLabel} />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="yb-card rounded-[24px] p-6">
          <h2 className="text-[24px] font-semibold text-white">Create API key for your app</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#9db0c0]">
            One wallet can own multiple developer apps. Each app should get its own API key so usage and revocation stay isolated.
          </p>

          <form action={createApiKeyAction} className="mt-5 grid gap-3">
            <input type="hidden" name="owner_wallet_address" value={session.walletAddress} />
            <input type="hidden" name="return_path" value="/dev/apps" />
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
              <span className="text-[12px] uppercase tracking-[0.16em] text-[#8aa2b1]">Team or owner label</span>
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
                placeholder="What this app does, or who maintains it."
                className="glass-inset rounded-[16px] border border-white/8 px-4 py-3 text-[14px] text-white outline-none transition focus:border-[rgba(0,201,177,0.28)]"
              />
            </label>

            <button
              type="submit"
              className="yb-teal-button mt-2 rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950"
            >
              Generate API key
            </button>
          </form>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label="Your wallet" value={shortenHash(session.walletAddress, 10, 4)} tone="white" />
          <StatCard label="Role" value={session.role === "owner" ? "owner" : "developer"} tone="green" />
          <StatCard label="API keys" value={String(apiKeys.length)} tone="white" />
          <StatCard label="Requests" value={String(totalRequests)} tone="white" />
          <StatCard label="Blocked" value={String(blockedRequests)} tone="amber" />
          <StatCard label="Network bias" value="0G testnet first" tone="green" />
        </div>
      </section>

      <section className="yb-card rounded-[24px] p-6">
        <h2 className="text-[24px] font-semibold text-white">Your managed API keys</h2>
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
              Your wallet has not created any API keys yet.
            </div>
          )}
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
