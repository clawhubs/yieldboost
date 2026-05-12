import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import DeveloperPortalShell from "@/components/dev/DeveloperPortalShell";
import { getDevPortalSetupState } from "@/lib/dev-portal";

const sdkExample = `import { YieldBoostClient, sealWithSigner, unsealWithSigner } from "yieldboost-ai-sdk";
import { Wallet } from "ethers";

const client = new YieldBoostClient({
  apiKey: process.env.YIELDBOOST_API_KEY!,
  baseUrl: "https://api.yieldboostai.xyz",
});

const signer = new Wallet(process.env.TEST_WALLET_PRIVATE_KEY!);

const sealed = await sealWithSigner(client, signer, {
  network: "mainnet",
  plaintext: "portfolio snapshot that must stay private",
  metadata: {
    app: "acme-backend",
    purpose: "nightly-proof",
  },
});

const opened = await unsealWithSigner(client, signer, {
  network: "mainnet",
  storageId: sealed.storage_id,
});

console.log(sealed.storage_id, opened.plaintext);`;

const browserExample = `import {
  YieldBoostClient,
  requestBrowserWalletAddress,
  sealWithBrowserWallet,
} from "yieldboost-ai-sdk";

const client = new YieldBoostClient({
  apiKey: import.meta.env.VITE_YIELDBOOST_API_KEY,
});

const walletAddress = await requestBrowserWalletAddress(window.ethereum);

const sealed = await sealWithBrowserWallet(client, {
  provider: window.ethereum,
  walletAddress,
  network: "mainnet",
  plaintext: "user-owned secret",
  metadata: {
    tenant: "consumer-app",
    feature: "integrity-backup",
  },
});`;

const pythonExample = `import os
import requests

api_key = os.environ["YIELDBOOST_API_KEY"]
storage_id = os.environ["YIELDBOOST_STORAGE_ID"]

metadata = requests.get(
    f"https://api.yieldboostai.xyz/v1/integrity/{storage_id}/metadata",
    headers={"X-API-Key": api_key},
).json()

print(metadata["storage_id"])
print(metadata["integrity_hash"])
print(metadata["anchor_tx_hash"])`;

const restFlow = `curl -X POST https://api.yieldboostai.xyz/v1/integrity/seal \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: yb_live_xxx" \\
  -d '{
    "network": "mainnet",
    "wallet_address": "0xYourWallet",
    "signature_kind": "eip191",
    "message": "signed wallet authorization message",
    "signature": "0xSignedByWallet",
    "plaintext": "confidential payload",
    "mime_type": "text/plain",
    "metadata": {
      "tenant": "demo-app",
      "purpose": "backtest-proof"
    }
  }'`;

const endpointTable = [
  {
    method: "POST",
    path: "/v1/integrity/seal",
    description: "Encrypt and persist plaintext or file through the full 9-layer stack.",
  },
  {
    method: "POST",
    path: "/v1/integrity/unseal",
    description: "Owner-only decrypt path. The same wallet that sealed must authorize unseal.",
  },
  {
    method: "GET",
    path: "/v1/integrity/{storage_id}/metadata",
    description: "Read sanitized integrity metadata without exposing plaintext or ciphertext.",
  },
  {
    method: "GET",
    path: "/v1/integrity/records?wallet_address=0x...&network=mainnet",
    description: "List integrity records for one wallet without exposing secret payload contents.",
  },
  {
    method: "POST",
    path: "/v1/blacklist/check",
    description: "Use L1 as a standalone screening service for hostile or disallowed text payloads.",
  },
  {
    method: "POST",
    path: "/v1/audit/evaluate",
    description: "Use L1 and L2 as an integrity audit service without sealing or anchoring payloads.",
  },
  {
    method: "POST",
    path: "/v1/proof/run",
    description: "Use L6 Zero-Knowledge Proof Layer to generate or verify proof envelopes for arbitrary commitments.",
  },
  {
    method: "POST",
    path: "/v1/governance/evaluate",
    description: "Use L8 Programmable Governance as a policy decision service for any product surface.",
  },
  {
    method: "POST",
    path: "/v1/handshake/log",
    description: "Use L9 to write audit-grade coordination logs even when no integrity record is created.",
  },
  {
    method: "GET",
    path: "/v1/status/layers",
    description: "Read platform status for each of the 9 layers as its own product surface.",
  },
  {
    method: "GET",
    path: "/v1/health",
    description: "Check infra readiness, active network, and live L1-L9 status.",
  },
];

const layerCards = [
  ["L1", "Hallucination Blacklist", "Reject obviously hostile or disallowed payloads before secrets move anywhere."],
  ["L2", "Integrity Auditor", "Deterministic logic checks catch malformed or suspicious requests."],
  ["L3", "Secure Compute / TEE", "Sensitive encryption and decryption happen inside isolated, on-demand compute."],
  ["L4", "Sovereign Memory", "Ownership and integrity state are recorded without leaking payload content."],
  ["L5", "0G Storage Proof Layer", "Encrypted proof receipts are pushed to decentralized storage."],
  ["L6", "Zero-Knowledge Proof Layer", "Proof envelope and integrity hash are produced for later verification."],
  ["L7", "ProofRegistry Anchor", "Storage commitments are anchored to 0G so records become externally inspectable."],
  ["L8", "Programmable Governance", "Policy gates, rate limits, and circuit breakers protect the surface."],
  ["L9", "Cross-Agent Neural Handshake", "Security logs and cross-agent audit traces preserve operational accountability."],
];

export default function DeveloperDocsView() {
  const setup = getDevPortalSetupState();

  return (
    <DeveloperPortalShell
      eyebrow="Integration Docs"
      title="Everything a developer needs to integrate the 9-layer Integrity API without guessing."
      description="This docs surface stays focused on the 9-layer security product itself: integrity seal, integrity unseal, metadata, health, SDK path, and what each request gains from the pipeline."
    >
      <section className="fade-in-up fade-in-up-1 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="yb-card rounded-[24px] p-6 md:p-7">
          <h2 className="text-[26px] font-semibold text-white">Quickstart for partner apps</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Quickstep
              step="Step 1"
              title="Login with wallet"
              description="Wallet login registers the developer account. Founder wallet becomes owner. Other wallets become developer users."
            />
            <Quickstep
              step="Step 2"
              title="Create app key"
              description="Each app gets its own managed API key. Usage, revocation, and rate controls stay per app."
            />
            <Quickstep
              step="Step 3"
              title="Integrate SDK or REST"
              description="Use the official TypeScript SDK source now, or call the platform endpoints directly from your stack."
            />
            <Quickstep
              step="Step 4"
              title="Pick your layer mode"
              description="Use integrity endpoints for full record flow, or call blacklist, audit, proof, governance, handshake, and status modules independently."
            />
          </div>

          <div className="mt-6 rounded-[20px] border border-[rgba(143,247,234,0.14)] bg-[rgba(7,22,26,0.7)] p-5">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8ff7ea]">API Key Rule</p>
            <p className="mt-3 text-[14px] leading-7 text-[#d4f6f1]">
              Raw API keys are shown once at creation time. YieldBoost stores only a hashed representation after that. New keys are package-scoped: Free stays on non-AI verification modules, Builder and Pro can use the Alibaba anti-sybil module, and Protocol unlocks full compute, AWS Nitro Fortress, selected partner SDK wrappers, and all marketplace surfaces. If a partner loses the raw key, the secure path is to revoke and mint a new one, not to reveal it again from the server.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-[rgba(104,255,122,0.18)] bg-[rgba(104,255,122,0.07)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#dfffe4]">
                  <Store className="h-4 w-4" />
                  Modular Immunity Armory
                </div>
                <p className="mt-3 text-[14px] leading-7 text-[#dfffe4]">
                  For productized endpoints, open the Modular Immunity Armory. Each card has its own playground and docs for plugging a YieldBoost API key into another developer&apos;s web app.
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[#c8f7d0]">
                  Public base: <span className="font-mono text-white">https://dev.yieldboostai.xyz</span>. Local base: <span className="font-mono text-white">http://127.0.0.1:3030</span>.
                </p>
              </div>
              <Link
                href="/dev/marketplace"
                className="yb-teal-button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-950"
              >
                Open Modular Immunity Armory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="yb-card rounded-[24px] p-6">
            <h2 className="text-[20px] font-semibold text-white">Portal Wiring</h2>
            <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#c8dae6]">
              <p><span className="text-white">API base:</span> {setup.apiBaseUrl}</p>
              <p><span className="text-white">Admin enabled:</span> {setup.adminEnabled ? "yes" : "no"}</p>
              {!setup.adminEnabled ? (
                <p><span className="text-white">Missing env:</span> {setup.missing.join(", ")}</p>
              ) : null}
            </div>
          </div>

          <div className="yb-card rounded-[24px] p-6">
            <h2 className="text-[20px] font-semibold text-white">Recommended Login Stance</h2>
            <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#c8dae6]">
              <p><span className="text-white">Developer portal:</span> wallet-first login is the right model because this product is ownership-native.</p>
              <p><span className="text-white">Mainnet-first:</span> start with a 0G wallet, sign package activation, and keep issued API keys scoped to the connected developer account.</p>
              <p><span className="text-white">Testnet fallback:</span> the request shape stays compatible, but the public developer portal now treats mainnet as the source of truth.</p>
            </div>
          </div>

          <div className="yb-card rounded-[24px] p-6">
            <h2 className="text-[20px] font-semibold text-white">Identity Split</h2>
            <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#c8dae6]">
              <p><span className="text-white">Developer app:</span> identified by the managed API key.</p>
              <p><span className="text-white">Portal account:</span> identified by the wallet that logs into `dev.yieldboostai.xyz`.</p>
              <p><span className="text-white">End-user record owner:</span> identified by the wallet that signs `seal` and `unseal` requests.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="fade-in-up fade-in-up-2 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="yb-card rounded-[24px] p-6 md:p-7">
          <h2 className="text-[24px] font-semibold text-white">Official TypeScript SDK</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#c8dae6]">
            The official SDK source now ships inside this repository at `sdk/yieldboost-ai-sdk`. It is ready to vendor or publish, and it wraps the API key header plus the public integrity, audit, proof, governance, handshake, and status surface.
          </p>
          <div className="mt-5 rounded-[20px] bg-[rgba(5,12,18,0.55)] p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8ff7ea]">Node / server example</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[13px] leading-6 text-[#d4f4f0]">{sdkExample}</pre>
          </div>
          <div className="mt-4 rounded-[20px] bg-[rgba(5,12,18,0.55)] p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8ff7ea]">Browser wallet example</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[13px] leading-6 text-[#d4f4f0]">{browserExample}</pre>
          </div>
        </div>

        <div className="yb-card rounded-[24px] p-6 md:p-7">
          <h2 className="text-[24px] font-semibold text-white">Raw REST integration</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#c8dae6]">
            If you do not want the SDK, keep your integration centered on the platform routes. The lower-level auth handshake exists behind the scenes, but the public story here stays on the 9-layer security surface.
          </p>
          <div className="mt-5 rounded-[20px] bg-[rgba(5,12,18,0.55)] p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8ff7ea]">Core integrity request</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[13px] leading-6 text-[#d4f4f0]">{restFlow}</pre>
          </div>
          <div className="mt-4 rounded-[20px] bg-[rgba(5,12,18,0.55)] p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#8ff7ea]">Python batch example</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[13px] leading-6 text-[#d4f4f0]">{pythonExample}</pre>
          </div>
        </div>
      </section>

      <section className="fade-in-up fade-in-up-3 yb-card rounded-[24px] p-6 md:p-7">
        <h2 className="text-[24px] font-semibold text-white">Endpoint contract</h2>
        <p className="mt-3 max-w-4xl text-[14px] leading-7 text-[#c8dae6]">
          This page only shows the public surface that expresses the 9-layer security product. Legacy vault-prefixed transport routes are intentionally left out here so the developer story stays clean and separate from the hacker challenge product. Partner teams can use the full record flow or call individual layers as standalone security services.
        </p>
        <div className="mt-5 space-y-3">
          {endpointTable.map((item) => (
            <div key={item.path} className="yb-soft-card rounded-[18px] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-[13px] text-[#d4f4f0]">
                  <span className="text-[#8ff7ea]">{item.method}</span> {item.path}
                </p>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[#96b0c2]">integration surface</p>
              </div>
              <p className="mt-3 text-[14px] leading-7 text-[#c8dae6]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fade-in-up fade-in-up-4 yb-card rounded-[24px] p-6 md:p-7">
        <h2 className="text-[24px] font-semibold text-white">What every request buys you: the 9-layer stack</h2>
        <p className="mt-3 max-w-4xl text-[14px] leading-7 text-[#c8dae6]">
          This is the part worth being loud about. Partner apps are not just calling a storage endpoint. Every request enters a layered integrity pipeline designed to filter abuse, isolate sensitive computation, persist proof-backed records, and keep an audit trail that survives beyond a single process.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {layerCards.map(([id, title, description]) => (
            <article key={id} className="yb-soft-card rounded-[18px] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ff7ea]">{id}</p>
              <h3 className="mt-2 text-[16px] font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </DeveloperPortalShell>
  );
}

function Quickstep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="yb-soft-card rounded-[18px] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#96b0c2]">{step}</p>
      <p className="mt-2 text-[16px] font-semibold text-white">{title}</p>
      <p className="mt-2 text-[13px] leading-6 text-[#c8dae6]">{description}</p>
    </div>
  );
}
