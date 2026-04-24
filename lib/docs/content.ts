import {
  DEFAULT_WALLET_ADDRESS,
  getAvailableWalletNetworks,
  type WalletNetworkKey,
} from "@/lib/wallet";

export type DocSlug =
  | "overview"
  | "why-yieldboost-ai"
  | "getting-started"
  | "how-1-click-works"
  | "execute-optimization"
  | "proof-and-verification"
  | "0g-integration"
  | "wallet-and-security"
  | "faq"
  | "troubleshooting"
  | "architecture"
  | "api-and-data-flow"
  | "roadmap";

export interface DocsRuntimeNetworkStatus {
  key: WalletNetworkKey;
  label: string;
  enabled: boolean;
  explorerBase: string;
  storageConfigured: boolean;
  proofRegistryConfigured: boolean;
}

export interface DocsRuntimeStatus {
  demoWallet: string;
  llmMode: string;
  computeMode: string;
  runtimeStore: string;
  optimizationMode: string;
  proofMode: string;
  currentStatusLine: string;
  networks: Record<WalletNetworkKey, DocsRuntimeNetworkStatus>;
}

export interface DocNavItem {
  slug: DocSlug;
  href: string;
  label: string;
  description: string;
}

export interface DocNavGroup {
  title: string;
  items: DocNavItem[];
}

export interface DocCallout {
  tone: "teal" | "green" | "amber";
  title: string;
  body: string;
}

export interface DocTable {
  caption?: string;
  columns: string[];
  rows: Array<string[]>;
}

export interface DocCodeBlock {
  title: string;
  language: string;
  code: string;
}

export interface DocSection {
  id: string;
  title: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: Array<{
    title: string;
    body: string;
  }>;
  callout?: DocCallout;
  table?: DocTable;
  code?: DocCodeBlock;
}

export interface DocPage {
  slug: DocSlug;
  href: string;
  label: string;
  category: string;
  description: string;
  summary: Array<{
    label: string;
    value: string;
    tone?: "teal" | "green" | "amber" | "white";
  }>;
  quickLinks: Array<{
    label: string;
    href: string;
  }>;
  sections: DocSection[];
}

const sidebarGroups: Array<{
  title: string;
  items: Array<{
    slug: DocSlug;
    label: string;
    description: string;
  }>;
}> = [
  {
    title: "Product Fundamentals",
    items: [
      {
        slug: "overview",
        label: "Overview",
        description: "Product summary, audiences, and the main workspace tour.",
      },
      {
        slug: "why-yieldboost-ai",
        label: "Why YieldBoost AI",
        description: "Problem statement, trust model, and product intent.",
      },
      {
        slug: "getting-started",
        label: "Getting Started",
        description: "How to enter the app, connect a wallet, and prepare a demo.",
      },
    ],
  },
  {
    title: "Optimization Flow",
    items: [
      {
        slug: "how-1-click-works",
        label: "How 1-Click Works",
        description: "What happens after the dashboard CTA is pressed.",
      },
      {
        slug: "execute-optimization",
        label: "Execute Optimization",
        description: "Agent-page controls, prompt handling, and result interpretation.",
      },
      {
        slug: "proof-and-verification",
        label: "Proof & Verification",
        description: "How to read tx hashes, storage identifiers, and history.",
      },
    ],
  },
  {
    title: "Platform & Trust",
    items: [
      {
        slug: "0g-integration",
        label: "0G Integration",
        description: "Live 0G Storage flow, explorer links, and ProofRegistry behavior.",
      },
      {
        slug: "wallet-and-security",
        label: "Wallet & Security",
        description: "Connected mode, watch mode, safety notes, and demo constraints.",
      },
      {
        slug: "faq",
        label: "FAQ",
        description: "Answers for non-technical users, judges, and contributors.",
      },
      {
        slug: "troubleshooting",
        label: "Troubleshooting",
        description: "Common failures, what they mean, and what to check first.",
      },
    ],
  },
  {
    title: "Technical Reference",
    items: [
      {
        slug: "architecture",
        label: "Architecture",
        description: "App Router composition, provider state, and storage layers.",
      },
      {
        slug: "api-and-data-flow",
        label: "API & Data Flow",
        description: "Route-by-route explanation of the runtime pipeline.",
      },
      {
        slug: "roadmap",
        label: "Roadmap",
        description: "What is live now, what is fallback, and what comes next.",
      },
    ],
  },
];

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function getLlmMode() {
  if (process.env.ALIBABA_API_KEY) {
    return "Alibaba Qwen via DashScope OpenAI-compatible endpoint";
  }

  if (process.env.OPENAI_API_KEY) {
    return "OpenAI `gpt-4o-mini` narrative fallback";
  }

  return "Deterministic in-app narrative fallback";
}

function getComputeMode() {
  return process.env.E2B_API_KEY
    ? "Structured optimization snapshot executed in E2B sandbox"
    : "Deterministic local snapshot without external compute";
}

function getRuntimeStoreMode() {
  return hasValue(process.env.KV_REST_API_URL) && hasValue(process.env.KV_REST_API_TOKEN)
    ? "Vercel KV primary store with local file fallback"
    : "Local `.artifacts/runtime-store.json` fallback store";
}

export function getDocsRuntimeStatus(): DocsRuntimeStatus {
  const allNetworks = getAvailableWalletNetworks();
  const mapped = Object.fromEntries(
    allNetworks.map((network) => [
      network.key,
      {
        key: network.key,
        label: network.label,
        enabled: network.enabled,
        explorerBase: network.explorerBase,
        storageConfigured: Boolean(network.storageUrl && network.rpcUrl && network.privateKey),
        proofRegistryConfigured: Boolean(network.proofRegistryAddress),
      } satisfies DocsRuntimeNetworkStatus,
    ]),
  ) as Record<WalletNetworkKey, DocsRuntimeNetworkStatus>;

  const proofMode = mapped.testnet.storageConfigured || mapped.mainnet.storageConfigured
    ? "0G Storage upload path is configured for at least one network"
    : "0G Storage route exists, but upload credentials are still required";
  const optimizationMode =
    getComputeMode() === "Structured optimization snapshot executed in E2B sandbox"
      ? "Live compute-assisted scoring plus streamed narrative"
      : "UI-ready deterministic scoring with streamed narrative fallback";

  return {
    demoWallet: DEFAULT_WALLET_ADDRESS,
    llmMode: getLlmMode(),
    computeMode: getComputeMode(),
    runtimeStore: getRuntimeStoreMode(),
    optimizationMode,
    proofMode,
    currentStatusLine: `${mapped.testnet.enabled ? mapped.testnet.label : "Testnet not configured"} is the default workspace path; mainnet remains optional.`,
    networks: mapped,
  };
}

export function getDocsNavigation(): DocNavGroup[] {
  return sidebarGroups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      slug: item.slug,
      href: `/docs/${item.slug}`,
      label: item.label,
      description: item.description,
    })),
  }));
}

function flattenNavigation() {
  return getDocsNavigation().flatMap((group) => group.items);
}

function pageQuickLinks(...slugs: DocSlug[]) {
  const map = new Map(flattenNavigation().map((item) => [item.slug, item]));
  return slugs
    .map((slug) => map.get(slug))
    .filter((item): item is DocNavItem => Boolean(item))
    .map((item) => ({
      label: item.label,
      href: item.href,
    }));
}

export function getDocPage(slug: DocSlug, status: DocsRuntimeStatus): DocPage {
  const pages = getAllDocPages(status);
  return pages.find((page) => page.slug === slug) ?? pages[0];
}

export function getDocSlugs(): DocSlug[] {
  return flattenNavigation().map((item) => item.slug);
}

export function getDocNeighbors(slug: DocSlug) {
  const items = flattenNavigation();
  const index = items.findIndex((item) => item.slug === slug);
  return {
    previous: index > 0 ? items[index - 1] : null,
    next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
  };
}

export function getAllDocPages(status: DocsRuntimeStatus): DocPage[] {
  const liveExplorer = status.networks.testnet.explorerBase;
  const walletLabel = `${shortAddress(status.demoWallet)} demo wallet`;
  const registryStatus = status.networks.testnet.proofRegistryConfigured
    ? "ProofRegistry can be written on the configured testnet path"
    : "ProofRegistry remains optional until `ZG_PROOF_REGISTRY_ADDRESS` is set";
  const storageStatus = status.networks.testnet.storageConfigured
    ? "0G Storage upload can run on the default testnet path"
    : "0G Storage upload route exists, but it still needs RPC, storage URL, and private key envs";

  return [
    {
      slug: "overview",
      href: "/docs/overview",
      label: "Overview",
      category: "Product Fundamentals",
      description:
        "A complete tour of what YieldBoost AI is, who it is for, and how the workspace is structured.",
      summary: [
        { label: "Default Network", value: status.networks.testnet.label, tone: "teal" },
        { label: "Demo Wallet", value: walletLabel, tone: "white" },
        { label: "Runtime Store", value: status.runtimeStore, tone: "green" },
      ],
      quickLinks: pageQuickLinks(
        "getting-started",
        "how-1-click-works",
        "proof-and-verification",
      ),
      sections: [
        {
          id: "what-is-yieldboost-ai",
          title: "What YieldBoost AI is",
          intro:
            "YieldBoost AI is a dashboard-first DeFi optimization workspace that turns passive portfolio balances into a proof-backed recommendation flow.",
          paragraphs: [
            "The product starts with a wallet or watch-only address, reads a current portfolio snapshot, estimates a higher-yield route, streams the reasoning to the interface, and then stores the resulting receipt in the proof pipeline.",
            "It is designed for three audiences at once: end users who want a clear action path, judges who need a short demo they can verify, and developers who need a codebase that shows where optimization, storage, and proof anchoring happen.",
          ],
          callout: {
            tone: "teal",
            title: "Current truth",
            body:
              "The live, verifiable part of the app today is the proof persistence flow and history trail. Optimization scoring and narrative generation can run through E2B, Alibaba, OpenAI, or deterministic fallbacks depending on the environment.",
          },
        },
        {
          id: "workspace-flow",
          title: "How the workspace flows",
          steps: [
            {
              title: "Dashboard",
              body:
                "The dashboard gives the fastest 1-click experience through `Boost My Yield Now`, plus a snapshot of APY lift, portfolio state, and the newest proof receipt.",
            },
            {
              title: "Boost",
              body:
                "The Boost page exposes the same optimization idea with more room for the prompt, streaming narrative, progress states, and the `Execute Optimization` control.",
            },
            {
              title: "Proof surfaces",
              body:
                "History, the proof modal, and the latest result cards reveal the tx hash, storage identifier, optional ProofRegistry transaction, and explorer links.",
            },
          ],
          table: {
            caption: "Main menu guide",
            columns: ["Menu", "Primary job", "Who uses it most", "Reality check"],
            rows: [
              ["Dashboard", "Fast overview + 1-click CTA", "Users and judges", "Best place to demo the entire loop quickly"],
              ["Boost", "Prompted optimization flow", "Power users", "Best place to explain `Execute Optimization`"],
              ["Portfolio", "Current wallet state summary", "Users", "Reflects wallet/RPC availability"],
              ["Strategies", "Strategy framing and ranking", "Users and judges", "Derived from current app state"],
              ["Opportunities", "Ranked opportunities", "Users", "Useful before execution"],
              ["History", "Proof ledger and verification trail", "Judges and developers", "Most important proof review page"],
              ["Analytics", "Performance framing", "Judges and contributors", "Some values are derived from stored proofs"],
              ["Watchlist", "Protocol watchlist", "Users", "State-aware support page"],
              ["Settings", "Workspace controls", "Contributors", "Binds to runtime settings state"],
              ["Docs", "Truthful product knowledge base", "Everyone", "Use this when you need context before a demo or review"],
            ],
          },
        },
        {
          id: "judge-demo",
          title: "A reliable judge walkthrough",
          bullets: [
            "Start on `/docs` for the product framing, then jump to `/docs/overview` if the reviewer wants the high-level picture.",
            "Open the dashboard, point at `Boost My Yield Now`, and explain that it compresses the default optimization flow into one click.",
            "Run the optimization from the dashboard or Boost page, then show the proof modal and History page to prove that the result is not just visual output.",
            "If ProofRegistry is configured, highlight the extra on-chain registry tx. If it is not configured, say so directly and show the storage-only receipt path instead.",
          ],
        },
      ],
    },
    {
      slug: "why-yieldboost-ai",
      href: "/docs/why-yieldboost-ai",
      label: "Why YieldBoost AI",
      category: "Product Fundamentals",
      description:
        "Why the project exists, which problem it tackles, and what trust model it assumes.",
      summary: [
        { label: "Problem", value: "Idle DeFi capital and fragmented proof trails", tone: "amber" },
        { label: "Target Users", value: "Retail users, judges, and contributors", tone: "white" },
        { label: "Trust Model", value: "Transparent fallbacks over fake certainty", tone: "green" },
      ],
      quickLinks: pageQuickLinks("overview", "0g-integration", "roadmap"),
      sections: [
        {
          id: "problem-statement",
          title: "Problem statement",
          paragraphs: [
            "Many DeFi dashboards stop at recommendation cards. They show a higher APY route, but they do not explain how the route was produced, what part is simulated, where proof is stored, or how a reviewer should validate the claim.",
            "YieldBoost AI exists to reduce that trust gap. The interface is opinionated, the optimization flow is guided, and the proof surfaces are always close to the main action paths.",
          ],
        },
        {
          id: "why-this-shape",
          title: "Why the product is shaped as a dashboard first",
          bullets: [
            "A user should be able to understand the pitch in under a minute.",
            "A judge should be able to see action, result, and proof without switching tools repeatedly.",
            "A developer should be able to inspect the actual routes that produce the optimization snapshot, streamed reasoning, storage write, and history ledger.",
          ],
          callout: {
            tone: "amber",
            title: "No inflated claims",
            body:
              "The docs intentionally separate live proof storage from aspirational compute messaging. If an integration is optional, simulated, or fallback-driven, it is called out as such.",
          },
        },
        {
          id: "target-users",
          title: "Who the product is for",
          table: {
            columns: ["Audience", "What they need", "Where to start", "Best proof surface"],
            rows: [
              ["DeFi user", "Simple action path and low-friction CTA", "Dashboard", "Proof modal + latest tx"],
              ["Hackathon judge", "Fast narrative and verifiable artifacts", "Docs overview", "History and explorer link"],
              ["Developer", "Route-level understanding", "Architecture", "API & Data Flow"],
              ["Contributor", "Honest current-state map", "Roadmap", "Troubleshooting + architecture"],
            ],
          },
        },
        {
          id: "trust-model",
          title: "Trust model",
          paragraphs: [
            "YieldBoost AI is not a custody layer. Wallet access stays in the browser wallet or a manually entered watch-only address. The app reads wallet state, prepares optimization output, and stores proof records.",
            "The product is strongest when it is explicit about uncertainty. Optimization numbers can still come from deterministic or sandbox-assisted logic, but proof storage, history surfacing, and verifier-friendly metadata remain visible either way.",
          ],
          bullets: [
            "Connected wallets can switch networks and broadcast the selected address into the app state.",
            "Watch mode allows a valid address to be tracked without an injected wallet session.",
            "Proof records are stored in KV when configured, or in the local runtime artifact file when running locally.",
            "The app defaults to testnet-first behavior and should be presented as testnet unless the active environment says otherwise.",
          ],
        },
      ],
    },
    {
      slug: "getting-started",
      href: "/docs/getting-started",
      label: "Getting Started",
      category: "Product Fundamentals",
      description:
        "How to enter the app, connect a wallet, and understand the first meaningful screens.",
      summary: [
        { label: "Recommended Start", value: "Dashboard for fastest first impression", tone: "teal" },
        { label: "Wallet Mode", value: "Connected or watch-only", tone: "white" },
        { label: "Proof Path", value: storageStatus, tone: "green" },
      ],
      quickLinks: pageQuickLinks("overview", "wallet-and-security", "how-1-click-works"),
      sections: [
        {
          id: "first-session",
          title: "First session checklist",
          steps: [
            {
              title: "Open the app and review the sidebar",
              body:
                "The sidebar is the product spine. Dashboard is the shortest route to value, Boost is the most explicit execution surface, and Docs is the fastest way to brief a teammate or judge.",
            },
            {
              title: "Choose a wallet mode",
              body:
                "Use a detected wallet extension for connected mode, or type a valid address into the sidebar to enter watch mode without signing into a provider.",
            },
            {
              title: "Confirm network state",
              body:
                `The current environment is organized around ${status.networks.testnet.label}. Mainnet is optional and only becomes usable when its RPC and storage envs are configured.`,
            },
          ],
        },
        {
          id: "understanding-empty-states",
          title: "Understanding empty or fallback states",
          bullets: [
            "If no wallet is available, the portfolio surface reports `wallet_disconnected` and shows zero balances.",
            "If a wallet exists but RPC is missing or fails, the portfolio source can become `wallet_rpc_unavailable` or `wallet_rpc_error`.",
            "If no optimization has been run yet, History shows a waiting state instead of pretending proof already exists.",
            "If storage credentials are missing, the 0G store route returns a truthful configuration error instead of silently faking persistence.",
          ],
          callout: {
            tone: "teal",
            title: "Best demo order",
            body:
              "For a short demo, connect or paste an address, show the dashboard state, then run optimization from either the dashboard CTA or the Boost page. Finish by opening History or the proof modal.",
          },
        },
        {
          id: "starter-routes",
          title: "Routes worth bookmarking",
          table: {
            columns: ["Route", "Why it matters", "Good for", "Notes"],
            rows: [
              ["/docs", "Docs landing page", "Orientation", "Best place to hand someone a map"],
              ["/", "Dashboard", "Fast demo", "Contains `Boost My Yield Now`"],
              ["/agent", "Boost page", "Execution walkthrough", "Contains `Execute Optimization` and prompt box"],
              ["/history", "Proof history", "Verification", "Useful immediately after a run"],
              ["/docs/proof-and-verification", "Verification guide", "Judges and developers", "Explains how to read tx hash and storage proof"],
            ],
          },
        },
      ],
    },
    {
      slug: "how-1-click-works",
      href: "/docs/how-1-click-works",
      label: "How 1-Click Works",
      category: "Optimization Flow",
      description:
        "The full meaning of the dashboard CTA `Boost My Yield Now` and what the product does after that click.",
      summary: [
        { label: "CTA", value: "Boost My Yield Now", tone: "teal" },
        { label: "Intent", value: "Fastest low-friction optimization run", tone: "white" },
        { label: "Output", value: "Recommendation + proof receipt", tone: "green" },
      ],
      quickLinks: pageQuickLinks("execute-optimization", "proof-and-verification", "architecture"),
      sections: [
        {
          id: "cta-meaning",
          title: "What `Boost My Yield Now` means",
          paragraphs: [
            "This button is the dashboard shortcut for the default optimization request: optimize the current portfolio for better yield with low risk.",
            "It intentionally hides most of the prompt complexity so the user can see the full system loop without visiting the more detailed Boost page.",
          ],
        },
        {
          id: "pipeline",
          title: "The 1-click pipeline",
          steps: [
            {
              title: "Read the current wallet snapshot",
              body:
                "The app builds a portfolio map from the active wallet state. If a valid wallet is present, the provider and portfolio context refresh from the portfolio API.",
            },
            {
              title: "Generate the optimization snapshot",
              body:
                `The optimization engine currently runs in ${status.computeMode.toLowerCase()}. It returns projected APY, gain estimate, recommendation, and supporting reasoning text.`,
            },
            {
              title: "Stream the recommendation",
              body:
                `The UI then streams narrative text using ${status.llmMode.toLowerCase()} when available, or falls back to the in-app deterministic narrative.`,
            },
            {
              title: "Store the proof package",
              body:
                "After the narrative stream, the client posts the decision payload to `/api/0g/store`, which tries to upload the JSON proof package and capture the storage transaction metadata.",
            },
            {
              title: "Surface proof everywhere",
              body:
                "The latest result card, proof modal, and History page all read the stored record so the same run can be inspected in multiple places.",
            },
          ],
        },
        {
          id: "what-changes-on-screen",
          title: "What changes on screen after the click",
          bullets: [
            "The dashboard CTA switches into an optimizing state.",
            "The right-side agent surfaces update with live progress and recommendation text.",
            "The latest proof row starts showing the tx hash, storage identifier, and optional ProofRegistry details once available.",
            "History becomes the persistent review surface for later verification or demo replay.",
          ],
          code: {
            title: "Default optimization intent",
            language: "text",
            code: "Optimize my portfolio for best yield with low risk",
          },
        },
        {
          id: "live-vs-fallback",
          title: "Live vs fallback boundaries",
          table: {
            columns: ["Stage", "Live behavior", "Fallback behavior", "What to say out loud"],
            rows: [
              ["Wallet snapshot", "Reads active wallet + network", "Empty state or RPC error", "Wallet is required for a meaningful live run"],
              ["Optimization scoring", status.computeMode, "Deterministic snapshot", "Scoring stays demo-safe if external compute is missing"],
              ["Narrative stream", status.llmMode, "Built-in narrative copy", "The wording can fall back even when the UI flow still works"],
              ["Proof storage", status.proofMode, "Honest storage configuration error", "Do not imply a stored proof if upload envs are missing"],
            ],
          },
        },
      ],
    },
    {
      slug: "execute-optimization",
      href: "/docs/execute-optimization",
      label: "Execute Optimization",
      category: "Optimization Flow",
      description:
        "A detailed guide to the Boost page control, the prompt field, and the result surfaces after execution.",
      summary: [
        { label: "Button", value: "Execute Optimization", tone: "teal" },
        { label: "Best Use", value: "Detailed walkthrough and operator control", tone: "white" },
        { label: "Proof Surface", value: registryStatus, tone: "green" },
      ],
      quickLinks: pageQuickLinks("how-1-click-works", "proof-and-verification", "faq"),
      sections: [
        {
          id: "button-purpose",
          title: "What `Execute Optimization` means",
          paragraphs: [
            "The Boost page turns the same optimization engine into a guided operator workflow. Instead of a pure shortcut, it shows the active prompt, progress labels, streamed narrative, and result panels in one place.",
            "Use it when you want to explain the flow step by step, compare before and after states, or show a more explicit interaction than the dashboard CTA.",
          ],
        },
        {
          id: "reading-agent-panel",
          title: "How to read the agent panel",
          table: {
            columns: ["Panel area", "Meaning", "What changes during a run", "Why it matters"],
            rows: [
              ["Prompt box", "Requested optimization instruction", "Can be edited before submit", "Explains operator intent"],
              ["Progress tracker", "Current runtime phase", "Moves through analyzing, optimizing, executing, done", "Shows the flow is active"],
              ["Recommended response", "Streamed narrative output", "Updates as text arrives", "Useful for demos and UX trust"],
              ["Result card", "Final optimization payload", "Shows APY lift and proof details", "Connects the narrative to proof-backed output"],
            ],
          },
        },
        {
          id: "from-open-to-proof",
          title: "From page open to proof recorded",
          steps: [
            {
              title: "Open `/agent`",
              body:
                "The page renders the Boost workspace with trajectory visuals, optimization progress, 0G stats, and the main execution card.",
            },
            {
              title: "Review or edit the prompt",
              body:
                "The default prompt asks for the best yield with low risk. You can keep it for a clean demo or customize it for a more operator-style run.",
            },
            {
              title: "Click `Execute Optimization`",
              body:
                "This submits the prompt plus the current wallet-derived portfolio snapshot into the same optimization pipeline used by the dashboard.",
            },
            {
              title: "Wait for the proof surfaces",
              body:
                "Once the storage route responds, the result card can expose explorer links, storage identifiers, and optional ProofRegistry data.",
            },
          ],
          code: {
            title: "Example request body posted from the app",
            language: "json",
            code: `{
  "portfolio": {
    "USDC": 12450,
    "0G": 4180,
    "SAUCE": 2960,
    "BONZO": 2410.25
  },
  "prompt": "Optimize my portfolio for best yield with low risk"
}`,
          },
        },
        {
          id: "when-to-use-which-button",
          title: "When to use which button",
          bullets: [
            "Use `Boost My Yield Now` when speed matters more than control.",
            "Use `Execute Optimization` when you want to narrate the process, show the prompt, or explain the steps to a judge or teammate.",
            "Both controls can end in the same storage and verification surfaces, so the difference is UX shape rather than a different proof system.",
          ],
        },
      ],
    },
    {
      slug: "proof-and-verification",
      href: "/docs/proof-and-verification",
      label: "Proof & Verification",
      category: "Optimization Flow",
      description:
        "How proof records are created, stored, surfaced in the UI, and verified by a reviewer.",
      summary: [
        { label: "Primary verifier view", value: "History + proof modal", tone: "teal" },
        { label: "Explorer base", value: liveExplorer, tone: "white" },
        { label: "Registry mode", value: registryStatus, tone: "green" },
      ],
      quickLinks: pageQuickLinks("0g-integration", "api-and-data-flow", "troubleshooting"),
      sections: [
        {
          id: "proof-package",
          title: "What the proof package contains",
          paragraphs: [
            "The stored decision payload includes current APY, optimized APY, estimated gain, recommendation, confidence score, and reasoning text when available.",
            "After a storage write succeeds, the app pairs that decision payload with transaction metadata such as storage tx hash, timestamp, block number when available, wallet address, and optional ProofRegistry metadata.",
          ],
        },
        {
          id: "reading-identifiers",
          title: "How to read tx hash, storage ID, and explorer links",
          table: {
            columns: ["Field", "Where it appears", "How to read it", "Why it matters"],
            rows: [
              ["Tx hash", "Proof modal, dashboard proof row, latest result", "Primary storage write transaction", "Fastest external verification handle"],
              ["CID / storage ID", "Proof modal and result cards", "User-facing storage identifier returned by the proof flow", "Connects the run to stored content"],
              ["Explorer link", "Proof modal and result cards", "Direct link into the configured 0G explorer", "Lets a reviewer verify outside the app"],
              ["ProofRegistry tx", "Result card or proof modal when configured", "Separate contract write for registry anchoring", "Shows optional on-chain indexing layer"],
            ],
          },
          callout: {
            tone: "amber",
            title: "Important wording",
            body:
              "If the current environment only stored to 0G Storage and did not write to ProofRegistry, describe the run as storage-backed, not fully registry-anchored.",
          },
        },
        {
          id: "history-and-verification",
          title: "How history and verification work",
          paragraphs: [
            "History is the proof ledger view for the current runtime store. It summarizes runs, shows the newest proof rows, and exposes a judge-friendly verification summary.",
            "The proof modal prefers live stored proof data from `/api/0g/proof`; if no live record exists yet, it falls back to a generated placeholder so the UI remains explorable. That fallback is useful for layout testing, but it should not be presented as a real proof record.",
          ],
          bullets: [
            "Use History to show how proof entries accumulate across runs.",
            "Use the proof modal when you want to focus on one record and copy tx hash or storage ID.",
            "Use explorer links when the reviewer wants an external source of truth.",
          ],
        },
        {
          id: "proofregistry-explained",
          title: "How ProofRegistry works in this app",
          paragraphs: [
            "When a ProofRegistry address is configured for the active network, the storage route attempts a second write after the storage upload. That contract write records the proof reference and APY basis points into the registry contract.",
            "The stored proof record is then enriched with registry address, registry tx hash, explorer link, and proof ID when the emitted event is available.",
          ],
          code: {
            title: "ProofRegistry write intent",
            language: "text",
            code:
              "recordProof(cid_or_rootHash, rootHash, storageTxHash, currentApyBps, optimizedApyBps)",
          },
        },
      ],
    },
    {
      slug: "0g-integration",
      href: "/docs/0g-integration",
      label: "0G Integration",
      category: "Platform & Trust",
      description:
        "A truthful map of how 0G is used today in the project and what is still environment-dependent.",
      summary: [
        { label: "Default Path", value: status.networks.testnet.label, tone: "teal" },
        { label: "Storage", value: storageStatus, tone: "green" },
        { label: "Explorer", value: status.networks.testnet.explorerBase, tone: "white" },
      ],
      quickLinks: pageQuickLinks("proof-and-verification", "wallet-and-security", "roadmap"),
      sections: [
        {
          id: "what-is-live",
          title: "What is live in the 0G integration",
          bullets: [
            "Network configuration is modeled explicitly for testnet and mainnet in the wallet layer.",
            "The proof storage route can upload a JSON proof package through the 0G TypeScript SDK when the active network has RPC, storage URL, and private key configured.",
            "The UI consistently surfaces the resulting storage tx hash, explorer link, and optional ProofRegistry transaction.",
            "The current explorer path is built from the configured explorer base and the returned transaction hashes.",
          ],
        },
        {
          id: "how-storage-write-works",
          title: "How proof enters 0G Storage",
          steps: [
            {
              title: "Serialize decision payload",
              body:
                "The app creates a temporary JSON file that includes optimization values, timestamp, and `appId: yieldboost-ai`.",
            },
            {
              title: "Upload through the 0G SDK",
              body:
                "The storage route wraps that file with `ZgFile`, then calls the indexer upload flow using the configured RPC and signer.",
            },
            {
              title: "Capture the returned metadata",
              body:
                "The route stores the returned root hash, tx hash, block info when obtainable, wallet address, explorer URL, and optional note flags.",
            },
            {
              title: "Persist locally or in KV",
              body:
                "The proof record is inserted into the runtime store so History, the proof modal, and the latest agent state can all read the same record.",
            },
          ],
        },
        {
          id: "what-is-not-yet-full-0g-compute",
          title: "What is not yet a full 0G compute implementation",
          paragraphs: [
            "The user interface often describes the optimizer in 0G-forward language, but the current codebase does not execute portfolio optimization inside a dedicated 0G Compute integration yet.",
            "Instead, optimization scoring currently comes from deterministic logic or an E2B sandbox-assisted snapshot, while narrative generation comes from Alibaba, OpenAI, or a built-in fallback depending on environment configuration.",
          ],
          callout: {
            tone: "amber",
            title: "Recommended phrasing",
            body:
              "Describe the current project as 0G proof-integrated and 0G-ready for deeper compute evolution, not as a finished end-to-end 0G Compute execution engine.",
          },
        },
        {
          id: "network-matrix",
          title: "Network matrix",
          table: {
            columns: ["Network", "Wallet switch support", "Storage config", "ProofRegistry", "Explorer"],
            rows: [
              [
                status.networks.testnet.label,
                status.networks.testnet.enabled ? "Configured" : "Missing chain config",
                status.networks.testnet.storageConfigured ? "Ready" : "Needs envs",
                status.networks.testnet.proofRegistryConfigured ? "Configured" : "Optional / off",
                status.networks.testnet.explorerBase,
              ],
              [
                status.networks.mainnet.label,
                status.networks.mainnet.enabled ? "Configured" : "Optional / off",
                status.networks.mainnet.storageConfigured ? "Ready" : "Needs envs",
                status.networks.mainnet.proofRegistryConfigured ? "Configured" : "Optional / off",
                status.networks.mainnet.explorerBase,
              ],
            ],
          },
        },
      ],
    },
    {
      slug: "wallet-and-security",
      href: "/docs/wallet-and-security",
      label: "Wallet & Security",
      category: "Platform & Trust",
      description:
        "How wallet connection works, what watch mode means, and what safety boundaries users should understand.",
      summary: [
        { label: "Supported Wallets", value: "MetaMask, Rabby, Coinbase, Trust, OKX", tone: "teal" },
        { label: "Fallback Mode", value: "Manual watch-only address", tone: "white" },
        { label: "Demo Warning", value: "Testnet-first and non-custodial UI", tone: "amber" },
      ],
      quickLinks: pageQuickLinks("getting-started", "troubleshooting", "faq"),
      sections: [
        {
          id: "wallet-modes",
          title: "Wallet modes in this app",
          table: {
            columns: ["Mode", "How it starts", "What it can do", "Caution"],
            rows: [
              ["Connected mode", "Injected wallet connect flow", "Reads account, listens for account/network changes", "Still only as safe as the current environment config"],
              ["Watch mode", "Manual address entry", "Tracks a valid address without provider auth", "No signing and no provider-backed network context"],
              ["Disconnected", "No valid address yet", "Shows empty states", "No live optimization possible"],
            ],
          },
        },
        {
          id: "security-notes",
          title: "Security notes",
          bullets: [
            "The app does not custody funds in the code shown here; it orchestrates wallet context, optimization output, and proof storage metadata.",
            "Because this is a demo-oriented product, testnet language should remain explicit unless you have a fully configured mainnet environment.",
            "A proof receipt is not the same thing as guaranteed profitable execution. It is evidence of what the app produced and stored, not a promise of future APY.",
            "Do not commit `.env.local`, API keys, private keys, access tokens, or wallet secrets into Git.",
          ],
          callout: {
            tone: "amber",
            title: "Demo limitation",
            body:
              "This workspace is ideal for product demos, proof UX, and architecture review. It should not be pitched as a battle-tested production trading system without additional execution, custody, and risk controls.",
          },
        },
        {
          id: "network-switch",
          title: "How network switching works",
          paragraphs: [
            "When a supported injected wallet is connected, the sidebar can request a network switch or add the target chain if it is missing.",
            "The selected network is also saved into local storage and cookies so the rest of the app can fetch portfolio and proof data consistently across reloads.",
          ],
        },
        {
          id: "demo-wallet",
          title: "Demo wallet consistency",
          paragraphs: [
            `The current default demo wallet is ${status.demoWallet}. If ` +
              "`NEXT_PUBLIC_DEMO_WALLET_ADDRESS` is set, the app uses that value; otherwise it falls back to the repository default.",
            "Keep documentation, screenshots, and spoken demos aligned with the active demo wallet to avoid confusing reviewers when the address shown in the sidebar differs from the docs.",
          ],
        },
      ],
    },
    {
      slug: "faq",
      href: "/docs/faq",
      label: "FAQ",
      category: "Platform & Trust",
      description:
        "Frequently asked questions for non-technical users, judges, and contributors.",
      summary: [
        { label: "Audience", value: "Non-technical first", tone: "teal" },
        { label: "Style", value: "Short answers, no inflated claims", tone: "white" },
        { label: "Glossary", value: "Included at the bottom", tone: "green" },
      ],
      quickLinks: pageQuickLinks("overview", "proof-and-verification", "troubleshooting"),
      sections: [
        {
          id: "common-questions",
          title: "Common questions",
          steps: [
            {
              title: "Is YieldBoost AI moving funds automatically?",
              body:
                "Not by default in the code shown here. The product demonstrates optimization logic, proof persistence, and result surfacing. Treat it as a guided demo workflow unless your execution environment explicitly adds the missing production controls.",
            },
            {
              title: "What does `Boost My Yield Now` do?",
              body:
                "It runs the default optimization request from the dashboard and then tries to store the resulting proof record so you can verify the outcome.",
            },
            {
              title: "What does `Execute Optimization` do?",
              body:
                "It runs the same optimization idea from the Boost page, but with a clearer prompt field and more explicit progress and result surfaces.",
            },
            {
              title: "Do I need to know blockchain details to use the app?",
              body:
                "No. A normal user can stay at the level of APY lift, proof receipt, and explorer link. The docs only go deeper when you want to inspect how the system is wired.",
            },
          ],
        },
        {
          id: "judge-questions",
          title: "Questions judges usually ask",
          bullets: [
            "What part is live? Answer: the UI flow, wallet context, proof storage route, explorer links, and history surface are real code paths; some optimization and narrative stages can still fall back depending on environment.",
            "Is this testnet? Answer: yes by default, unless the active environment has mainnet RPC, storage, and registry configuration.",
            "How do I verify it? Answer: open History or the proof modal, then follow the explorer link and compare it with the stored identifiers.",
            "What makes it different from a dashboard mock? Answer: the app stores runtime proof records and exposes them consistently across multiple product surfaces.",
          ],
        },
        {
          id: "glossary",
          title: "Glossary",
          table: {
            columns: ["Term", "Simple meaning", "Where it appears", "Why it matters"],
            rows: [
              ["APY", "Projected annual yield rate", "Dashboard and Boost result cards", "Main performance headline"],
              ["Tx hash", "Blockchain transaction identifier", "Proof modal and result surfaces", "Fastest verification handle"],
              ["CID / storage ID", "Proof storage identifier", "Proof modal and latest result", "Used to reference the stored record"],
              ["ProofRegistry", "Optional on-chain registry contract", "Proof modal and result card", "Adds an extra verification layer"],
              ["Watch mode", "Tracking an address without wallet connection", "Sidebar", "Useful for demos and read-only review"],
              ["0G explorer", "External verification site", "Proof links", "Lets reviewers inspect transactions outside the app"],
            ],
          },
        },
      ],
    },
    {
      slug: "troubleshooting",
      href: "/docs/troubleshooting",
      label: "Troubleshooting",
      category: "Platform & Trust",
      description:
        "Common runtime failures, what they usually mean, and which page or env to check next.",
      summary: [
        { label: "Best Debug Surface", value: "History + console + API response", tone: "teal" },
        { label: "Most Common Cause", value: "Missing env or wallet context", tone: "amber" },
        { label: "Store Fallback", value: status.runtimeStore, tone: "white" },
      ],
      quickLinks: pageQuickLinks("wallet-and-security", "api-and-data-flow", "architecture"),
      sections: [
        {
          id: "symptom-table",
          title: "Symptom table",
          table: {
            columns: ["Symptom", "Likely cause", "Where to check", "Recommended response"],
            rows: [
              ["Docs or app route 404", "Route missing or server not rebuilt", "Local dev server logs", "Restart dev server and verify route tree"],
              ["No wallet balance shown", "No address, RPC off, or RPC error", "Sidebar + portfolio API", "Connect/paste a wallet and confirm RPC env"],
              ["Optimization request failed", "Agent route or provider issue", "Boost page + `/api/agent/optimize`", "Retry with default prompt and inspect provider envs"],
              ["Proof storage failed", "0G envs missing", "`/api/0g/store` response", "Set RPC, storage URL, and private key for the target network"],
              ["No ProofRegistry entry", "Registry address not configured or tx failed", "Result card note + server logs", "Describe the run as storage-only and fix env later"],
              ["History empty after run", "Store write failed or different wallet context", "Runtime store + latest agent route", "Check store backend and requested wallet address"],
            ],
          },
        },
        {
          id: "debug-order",
          title: "Recommended debug order",
          steps: [
            {
              title: "Check the sidebar first",
              body:
                "Make sure the wallet and network state are what you think they are. Many downstream issues begin with an empty or mismatched wallet context.",
            },
            {
              title: "Check the API that owns the failing step",
              body:
                "Portfolio issues start at `/api/portfolio`, optimization at `/api/agent/optimize`, and proof persistence at `/api/0g/store` or `/api/0g/proof`.",
            },
            {
              title: "Check the store backend",
              body:
                "History and latest-proof views depend on the runtime store, which can be KV-backed or local-file-backed depending on the environment.",
            },
          ],
        },
        {
          id: "honest-demo-recovery",
          title: "How to recover during a live demo",
          bullets: [
            "If ProofRegistry is unavailable, say the environment is running in storage-only mode and continue with the explorer link and stored receipt.",
            "If LLM output falls back, explain that the recommendation wording degraded gracefully while the proof and UI pipeline stayed intact.",
            "If the wallet provider is unavailable, switch to watch mode with the demo wallet so the review can continue without blocking on extension setup.",
          ],
        },
      ],
    },
    {
      slug: "architecture",
      href: "/docs/architecture",
      label: "Architecture",
      category: "Technical Reference",
      description:
        "The structure of the Next.js App Router project and the main moving parts behind the user experience.",
      summary: [
        { label: "Framework", value: "Next.js App Router", tone: "teal" },
        { label: "State Core", value: "AppDataProvider", tone: "white" },
        { label: "Proof Store", value: status.runtimeStore, tone: "green" },
      ],
      quickLinks: pageQuickLinks("api-and-data-flow", "0g-integration", "roadmap"),
      sections: [
        {
          id: "component-map",
          title: "Component map",
          table: {
            columns: ["Layer", "File family", "Responsibility", "Notes"],
            rows: [
              ["Layout shell", "`app/layout.tsx` + sidebar", "Global structure and workspace chrome", "All pages inherit the same product frame"],
              ["Client state", "`components/providers/AppDataProvider.tsx`", "Portfolio and optimization context", "Central runtime state hub"],
              ["Feature pages", "`app/*/page.tsx` + feature components", "Dashboard, Boost, portfolio, and support routes", "Docs adds a separate documentation shell"],
              ["API routes", "`app/api/**`", "Portfolio, optimization, 0G storage, proof lookup, feature page data", "Rate limited through middleware"],
              ["Server helpers", "`lib/server/**`", "Live portfolio, runtime store, feature-page loaders", "Separates server concerns from view code"],
            ],
          },
        },
        {
          id: "text-diagram",
          title: "Text diagram of the architecture",
          code: {
            title: "High-level data flow",
            language: "text",
            code: `Wallet / Watch Address
        |
        v
Sidebar wallet state -> AppDataProvider -> /api/portfolio
        |
        v
Dashboard / Boost page -> /api/agent/optimize
        |
        v
Client receives optimization payload + streamed narrative
        |
        v
/api/0g/store -> 0G SDK upload -> optional ProofRegistry write
        |
        v
runtime-store (KV or local file)
        |
        v
History / proof modal / /api/agent/latest / /api/0g/proof`,
          },
        },
        {
          id: "state-behavior",
          title: "Why the provider layer matters",
          paragraphs: [
            "The provider layer keeps wallet context, live portfolio state, optimization progress, streaming narrative, and the latest result synchronized across pages.",
            "That is why a single completed run can appear immediately in the dashboard panels, the Boost page, and the proof modal without separate manual refresh steps.",
          ],
        },
        {
          id: "docs-architecture",
          title: "How the documentation feature fits in",
          paragraphs: [
            "The docs center lives under `app/docs` and uses regular React components with semantic HTML. There is no markdown renderer and no MDX compilation layer in this implementation.",
            "Navigation, page content, and next/previous relationships are derived from typed docs metadata so the docs remain easy to extend while staying product-styled.",
          ],
        },
      ],
    },
    {
      slug: "api-and-data-flow",
      href: "/docs/api-and-data-flow",
      label: "API & Data Flow",
      category: "Technical Reference",
      description:
        "Route-by-route technical reference for developers and reviewers who want to follow the runtime from request to proof record.",
      summary: [
        { label: "Key Routes", value: "/api/portfolio, /api/agent/optimize, /api/0g/store", tone: "teal" },
        { label: "Proof Lookup", value: "/api/0g/proof and /api/agent/latest", tone: "white" },
        { label: "Persistence", value: status.runtimeStore, tone: "green" },
      ],
      quickLinks: pageQuickLinks("architecture", "proof-and-verification", "troubleshooting"),
      sections: [
        {
          id: "route-table",
          title: "Primary routes",
          table: {
            columns: ["Route", "Method", "Purpose", "Used by"],
            rows: [
              ["/api/portfolio", "GET", "Resolve active wallet portfolio snapshot", "Provider refresh and feature pages"],
              ["/api/agent/optimize", "POST", "Generate optimization payload and narrative stream", "Dashboard and Boost actions"],
              ["/api/0g/store", "POST", "Upload proof package and persist metadata", "Optimization client flow"],
              ["/api/0g/proof", "GET", "Read latest or requested proof details", "Proof modal"],
              ["/api/agent/latest", "GET", "Hydrate latest result for a wallet", "Provider startup"],
              ["/api/history", "GET", "Build proof-history page data", "History page"],
            ],
          },
        },
        {
          id: "request-life-cycle",
          title: "Request life cycle",
          steps: [
            {
              title: "Portfolio fetch",
              body:
                "The provider reads the requested wallet and network, then asks `/api/portfolio` for a current snapshot backed by the configured RPC and latest stored proof when available.",
            },
            {
              title: "Optimization request",
              body:
                "A client action posts the portfolio map and prompt to `/api/agent/optimize`, which returns an optimization payload via a response header and streams narrative text through the body.",
            },
            {
              title: "Proof persistence",
              body:
                "The client follows up with a POST to `/api/0g/store` carrying the final decision payload, network key, and wallet address.",
            },
            {
              title: "Hydration and replay",
              body:
                "Later, `/api/agent/latest`, `/api/history`, and `/api/0g/proof` all read from the stored proof record instead of recomputing everything from scratch.",
            },
          ],
        },
        {
          id: "provider-priority",
          title: "Provider priority and fallback rules",
          bullets: [
            "Optimization narrative prefers Alibaba when `ALIBABA_API_KEY` exists.",
            "If Alibaba is unavailable and `OPENAI_API_KEY` exists, the app falls back to OpenAI narrative generation.",
            "If neither provider is configured, the app still produces a deterministic narrative so the UX does not collapse.",
            "Structured optimization values can be produced via E2B when `E2B_API_KEY` is present; otherwise the app uses the deterministic snapshot builder.",
          ],
        },
        {
          id: "proof-json-shape",
          title: "Stored decision payload shape",
          code: {
            title: "Conceptual proof JSON",
            language: "json",
            code: `{
  "current_apy": 12.38,
  "optimized_apy": 23.84,
  "yield_increase": 2356.41,
  "yield_increase_pct": 23.61,
  "recommended": "SaucerSwap LP",
  "confidence": 96,
  "executionSeconds": 8.42,
  "estimatedAnnualGain": 2356.41,
  "totalPortfolio": 24570.25,
  "reasoning": "YieldBoost rerouted idle stablecoin..."
}`,
          },
        },
      ],
    },
    {
      slug: "roadmap",
      href: "/docs/roadmap",
      label: "Roadmap",
      category: "Technical Reference",
      description:
        "What is already real, what still falls back, and the next logical production steps for the project.",
      summary: [
        { label: "Live Now", value: "Docs, dashboard flow, proof storage pipeline, history", tone: "teal" },
        { label: "Current Limitation", value: "Compute and narrative can still be fallback-driven", tone: "amber" },
        { label: "Next Frontier", value: "Deeper execution and stronger verifier tooling", tone: "green" },
      ],
      quickLinks: pageQuickLinks("0g-integration", "architecture", "faq"),
      sections: [
        {
          id: "live-now",
          title: "What is live now",
          bullets: [
            "A polished multi-surface workspace with dashboard, Boost, History, analytics, and docs.",
            "Wallet connection and watch mode flow inside the sidebar.",
            "Optimization requests with streamed narrative and stored result hydration.",
            "0G Storage upload path plus optional ProofRegistry contract anchoring.",
            "A proof history ledger that can be demonstrated to judges and contributors.",
          ],
        },
        {
          id: "known-limitations",
          title: "Known limitations",
          bullets: [
            "Proof persistence depends on environment configuration; without the right envs, proof storage fails honestly.",
            "The portfolio snapshot currently focuses on native balance retrieval plus the latest proof-derived portfolio total rather than a deep multi-asset on-chain portfolio engine.",
            "The optimization engine is still demo-oriented and not a production trading executor.",
            "Some UX copy references 0G-forward compute language more aggressively than the current compute implementation warrants.",
          ],
          callout: {
            tone: "amber",
            title: "Production-ready next step",
            body:
              "The strongest next milestone is making optimization, execution, and verification all align under the same trust model so the docs, UI copy, and runtime behavior match even more tightly.",
          },
        },
        {
          id: "next-steps",
          title: "Recommended next steps",
          steps: [
            {
              title: "Deepen real portfolio ingestion",
              body:
                "Expand from native balance plus proof-derived totals into richer token discovery and protocol position parsing.",
            },
            {
              title: "Strengthen execution realism",
              body:
                "Separate recommendation, simulation, approval, and execution into clearer states with stronger safety controls.",
            },
            {
              title: "Make proof verification richer",
              body:
                "Expose proof payload viewing, explorer deep links, registry replay helpers, and failure notes more directly in the UI.",
            },
            {
              title: "Extend 0G integration",
              body:
                "Move more of the compute and verification story into explicitly live 0G-backed services so the product claim becomes even tighter.",
            },
          ],
        },
        {
          id: "contributor-notes",
          title: "Contributor notes",
          paragraphs: [
            "This docs center is intentionally typed and component-based instead of markdown-driven so it can stay visually aligned with the product UI and safely reuse live runtime facts.",
            "When you extend the app, update the documentation at the same time, especially for anything that changes the truth around proof storage, registry behavior, network readiness, or fallback rules.",
          ],
        },
      ],
    },
  ];
}
