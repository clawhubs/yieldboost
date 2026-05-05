import Link from "next/link";
import { ArrowRight, Boxes, Radar, ShieldCheck, Vault } from "lucide-react";

import DevPortalAccessCard from "@/components/dev/DevPortalAccessCard";
import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import { getDevPortalSetupState } from "@/lib/dev-portal";

const layers = [
  { id: "L1", title: "Hallucination Blacklist", body: "Rejects hostile prompts, bait payloads, and abuse signatures before they touch the vault." },
  { id: "L2", title: "Integrity Auditor", body: "Runs deterministic checks on payload size, ownership intent, network binding, and replay posture." },
  { id: "L3", title: "0G TEE / Ephemeral Sandbox", body: "Encrypts and decrypts only inside isolated execution with strict zero-leakage handling." },
  { id: "L4", title: "Sovereign Memory", body: "Records ownership and state transitions without returning secrets in metadata surfaces." },
  { id: "L5", title: "0G Storage Blob", body: "Anchors encrypted blobs to live 0G storage so the ciphertext survives outside app memory." },
  { id: "L6", title: "ZK Reasoning Envelope", body: "Builds integrity commitments over payload, ciphertext, storage root, and request metadata." },
  { id: "L7", title: "0G ProofRegistry Anchor", body: "Publishes proof commitments on-chain so developers can audit a verifiable trail." },
  { id: "L8", title: "Safety Throttling", body: "Caps abusive traffic and suspicious usage before the pipeline turns into an attack surface." },
  { id: "L9", title: "Neural Handshake Journal", body: "Closes every request with audit-ready coordination logs for postmortem and governance." },
];

export default function DeveloperLandingView({
  session,
}: {
  session: {
    walletAddress: string;
    role: "owner" | "developer";
  } | null;
}) {
  const setup = getDevPortalSetupState();

  return (
    <DeveloperPortalShell
      eyebrow="Dev Portal"
      title="The 9-layer integrity stack, packaged like a product instead of a pitch deck."
      description="This portal is for developers integrating the Integrity API. Public pages should explain how to use the API clearly. Private dashboards should appear only after wallet login."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="yb-card rounded-[24px] p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="glass-accent flex h-12 w-12 items-center justify-center rounded-[16px] text-[#76f0df]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#8aa2b1]">Positioning</p>
              <h2 className="text-[24px] font-semibold text-white">Integrity-as-a-Service for wallets, files, and high-trust AI flows</h2>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#a5b8c7]">
            We are not selling a wrapper around storage. We are selling a hostile-environment pipeline where every vault request passes through nine sequential control planes before it earns the right to persist, unseal, or anchor anything.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="yb-soft-card rounded-[18px] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8aa2b1]">API Surface</p>
              <p className="mt-2 text-[24px] font-semibold text-white">`/v1`</p>
              <p className="mt-2 text-[13px] leading-6 text-[#96adbd]">Seal, unseal, metadata, health, and per-app access control.</p>
            </div>
            <div className="yb-soft-card rounded-[18px] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8aa2b1]">Network Readiness</p>
              <p className="mt-2 text-[24px] font-semibold text-[#72f3c7]">Testnet-first</p>
              <p className="mt-2 text-[13px] leading-6 text-[#96adbd]">Config is symmetric with mainnet so cutover becomes validation, not rewrites.</p>
            </div>
            <div className="yb-soft-card rounded-[18px] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8aa2b1]">Portal Auth</p>
              <p className="mt-2 text-[24px] font-semibold text-white">Wallet-first</p>
              <p className="mt-2 text-[13px] leading-6 text-[#96adbd]">
                Developer users register with wallet login. Founder wallet is auto-promoted to owner access.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <DevPortalAccessCard session={session} />

          <div className="yb-card rounded-[24px] p-6">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[16px] text-[#76f0df]">
                <Radar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#8aa2b1]">Deployment Shape</p>
                <h2 className="text-[20px] font-semibold text-white">Ready for `dev.yieldboostai.xyz`</h2>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-7 text-[#a5b8c7]">
              Keep `api.yieldboostai.xyz` machine-first. Put docs, keys, usage, and launch messaging on a dedicated dev portal so the API stays clean and the developer story gets stronger.
            </p>
            <div className="mt-5 space-y-3">
              <Link href="/dev/docs" className="yb-teal-button flex items-center justify-between rounded-[16px] px-4 py-3 text-[14px] font-semibold text-slate-950">
                Read Integration Docs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={session?.role === "owner" ? "/dev/console" : "/dev/apps"} className="yb-soft-card flex items-center justify-between rounded-[16px] px-4 py-3 text-[14px] font-semibold text-white">
                {session ? (session.role === "owner" ? "Open owner dashboard" : "Open developer dashboard") : "Open dashboard after login"}
                <ArrowRight className="h-4 w-4 text-[#76f0df]" />
              </Link>
            </div>
          </div>

          <div className="yb-card rounded-[24px] p-6">
            <div className="flex items-center gap-3">
              <div className="glass-accent flex h-11 w-11 items-center justify-center rounded-[16px] text-[#76f0df]">
                <Vault className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#8aa2b1]">Login Recommendation</p>
                <h2 className="text-[20px] font-semibold text-white">Use a 0G testnet wallet first</h2>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-7 text-[#a5b8c7]">
              For beta, testnet wallet login is the right choice. It keeps operational risk low while preserving the exact wallet-native ownership and signature model you want to carry into mainnet later.
            </p>
          </div>

          {!setup.adminEnabled ? (
            <div className="yb-card rounded-[24px] p-6">
              <h2 className="text-[20px] font-semibold text-white">Portal Wiring</h2>
              <p className="mt-4 text-[14px] leading-7 text-[#a5b8c7]">
                Founder-only admin actions still need server-side env configuration: {setup.missing.join(", ")}.
              </p>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="yb-card rounded-[24px] p-6 md:p-7">
        <div className="flex items-center gap-3">
          <div className="glass-accent flex h-12 w-12 items-center justify-center rounded-[16px] text-[#76f0df]">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8aa2b1]">Nine Layers</p>
            <h2 className="text-[26px] font-semibold text-white">A brag-worthy stack is only useful if every layer does a real job.</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {layers.map((layer) => (
            <article key={layer.id} className="yb-soft-card rounded-[20px] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#72f3c7]">{layer.id}</p>
                <div className="rounded-full border border-[rgba(0,201,177,0.2)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#9ae9dc]">
                  Integrity
                </div>
              </div>
              <h3 className="mt-3 text-[18px] font-semibold text-white">{layer.title}</h3>
              <p className="mt-3 text-[14px] leading-6 text-[#9cb0c1]">{layer.body}</p>
            </article>
          ))}
        </div>
      </section>
    </DeveloperPortalShell>
  );
}
