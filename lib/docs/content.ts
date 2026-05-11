import {
  DEFAULT_WALLET_ADDRESS,
  getAvailableWalletNetworks,
  getDefaultWalletNetworkKey,
  getYieldStrategyAttestationOracleAddress,
  getYieldStrategyInftAddress,
  getYieldStrategyMarketplaceAddress,
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
  | "strategy-as-inft"
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
        description: "What YieldBoost is, who pays for it, and where to click first.",
      },
      {
        slug: "why-yieldboost-ai",
        label: "Why YieldBoost AI",
        description: "The bot problem, the trust gap, and why the 9-layer stack matters.",
      },
      {
        slug: "getting-started",
        label: "Getting Started",
        description: "The fastest path for a user, judge, or partner to understand the project.",
      },
    ],
  },
  {
    title: "Optimization Flow",
    items: [
      {
        slug: "how-1-click-works",
        label: "How 1-Click Works",
        description: "How one wallet becomes one proof-backed yield recommendation.",
      },
      {
        slug: "execute-optimization",
        label: "Execute Optimization",
        description: "How the live optimization flow turns a portfolio into an action path.",
      },
      {
        slug: "proof-and-verification",
        label: "Proof & Verification",
        description: "How to verify that the result is real and not just UI theater.",
      },
    ],
  },
  {
    title: "Platform & Trust",
    items: [
      {
        slug: "0g-integration",
        label: "0G Integration",
        description: "Where 0G gives the app its storage, compute, and proof anchor backbone.",
      },
      {
        slug: "strategy-as-inft",
        label: "Strategy as INFT",
        description: "How a strategy becomes an ownable on-chain artifact instead of a temporary result card.",
      },
      {
        slug: "wallet-and-security",
        label: "Wallet & Security",
        description: "How wallet access works and where the security boundaries actually are.",
      },
      {
        slug: "faq",
        label: "FAQ",
        description: "Straight answers for users, judges, and builders.",
      },
      {
        slug: "troubleshooting",
        label: "Troubleshooting",
        description: "What breaks, why it breaks, and where to look first.",
      },
    ],
  },
  {
    title: "Technical Reference",
    items: [
      {
        slug: "architecture",
        label: "Architecture",
        description: "How the product is put together behind the screens.",
      },
      {
        slug: "api-and-data-flow",
        label: "API & Data Flow",
        description: "How requests move through proof, storage, governance, and security layers.",
      },
      {
        slug: "roadmap",
        label: "Roadmap",
        description: "What is live, what earns money, and what gets built next.",
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

function hasComputeCredentials(networkKey: WalletNetworkKey) {
  const provider =
    networkKey === "mainnet"
      ? process.env.ZG_MAINNET_COMPUTE_PROVIDER_ADDRESS ?? process.env.ZG_COMPUTE_PROVIDER_ADDRESS
      : process.env.ZG_TESTNET_COMPUTE_PROVIDER_ADDRESS ?? process.env.ZG_COMPUTE_PROVIDER_ADDRESS;
  const signer =
    networkKey === "mainnet"
      ? process.env.ZG_MAINNET_LEDGER_PRIVATE_KEY ?? process.env.ZG_LEDGER_PRIVATE_KEY
      : process.env.ZG_TESTNET_LEDGER_PRIVATE_KEY ?? process.env.ZG_LEDGER_PRIVATE_KEY;

  return hasValue(provider) && hasValue(signer);
}

function getLlmMode() {
  const defaultNetworkKey = getDefaultWalletNetworkKey();
  return hasComputeCredentials(defaultNetworkKey)
    ? "0G Compute broker path with deterministic fallback"
    : "Deterministic in-app narrative fallback";
}

function getComputeMode() {
  const defaultNetworkKey = getDefaultWalletNetworkKey();
  return hasComputeCredentials(defaultNetworkKey)
    ? `0G Compute credentials configured for ${defaultNetworkKey}`
    : "Deterministic fallback available when compute is unavailable";
}

function getRuntimeStoreMode() {
  return hasValue(process.env.KV_REST_API_URL) && hasValue(process.env.KV_REST_API_TOKEN)
    ? "Vercel KV primary store with local file fallback"
    : "Local `.artifacts/runtime-store.local.json` fallback store";
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
  const optimizationMode = "Mainnet-first optimizer with Integrity Auditor, proof storage, and Agent NFT minting";
  const defaultNetworkKey = getDefaultWalletNetworkKey();
  const defaultNetworkLabel = mapped[defaultNetworkKey]?.label ?? "0G Mainnet";

  return {
    demoWallet: DEFAULT_WALLET_ADDRESS,
    llmMode: getLlmMode(),
    computeMode: getComputeMode(),
    runtimeStore: getRuntimeStoreMode(),
    optimizationMode,
    proofMode,
    currentStatusLine: `${defaultNetworkLabel} is the active default workspace path, while the judge review can still switch networks on demand.`,
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
  const defaultNetworkKey = getDefaultWalletNetworkKey();
  const secondaryNetworkKey: WalletNetworkKey = defaultNetworkKey === "mainnet" ? "testnet" : "mainnet";
  const defaultNetwork = status.networks[defaultNetworkKey];
  const secondaryNetwork = status.networks[secondaryNetworkKey];
  const liveExplorer = defaultNetwork.explorerBase;
  const walletLabel = `${shortAddress(status.demoWallet)} demo wallet`;
  const registryStatus = defaultNetwork.proofRegistryConfigured
    ? `ProofRegistry is configured for ${defaultNetwork.label}`
    : `ProofRegistry needs an address for ${defaultNetwork.label}`;
  const storageStatus = defaultNetwork.storageConfigured
    ? `0G Storage upload is configured for ${defaultNetwork.label}`
    : `0G Storage upload needs RPC, storage URL, and signer envs for ${defaultNetwork.label}`;
  const inftAddress = getYieldStrategyInftAddress(defaultNetworkKey);
  const marketplaceAddress = getYieldStrategyMarketplaceAddress(defaultNetworkKey);
  const oracleAddress = getYieldStrategyAttestationOracleAddress(defaultNetworkKey);
  const agentNftStatus = inftAddress
    ? `YieldStrategyINFT live at ${shortAddress(inftAddress)}`
    : "YieldStrategyINFT address is not configured";
  const marketplaceStatus = marketplaceAddress
    ? `Strategy marketplace live at ${shortAddress(marketplaceAddress)}`
    : "Marketplace address is not configured";
  const oracleStatus = oracleAddress
    ? `Attestation oracle live at ${shortAddress(oracleAddress)}`
    : "Attestation oracle address is not configured";

  return [
    {
      slug: "overview",
      href: "/docs/overview",
      label: "Overview",
      category: "Product Fundamentals",
      description:
        "A complete tour of what YieldBoost AI is, who it is for, and how the workspace is structured.",
      summary: [
        { label: "Default Network", value: defaultNetwork.label, tone: "teal" },
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
            "YieldBoost AI is a mainnet-first DeFi optimization workspace that turns idle wallet balances into proof-backed yield strategies.",
          paragraphs: [
            "The product starts with a wallet or watch-only address, reads the current portfolio snapshot, recommends a low-risk route, checks the output with Integrity Auditor, and stores the resulting proof package through the 0G proof pipeline.",
            "It is designed for three audiences at once: end users who want a clear action path, judges who need a short mainnet demo they can verify, and developers who need a codebase that shows where optimization, storage, ProofRegistry anchoring, Agent NFT minting, and marketplace adoption happen.",
          ],
          callout: {
            tone: "teal",
            title: "Current truth",
            body:
              "The live public story is now mainnet-first: Judge Mode shows the latest proof-backed wallet snapshot, ProofRegistry links, Integrity Auditor status, YieldStrategyINFT artifacts, and marketplace context without requiring a wallet connection.",
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
                "History, the proof modal, Judge Mode, and the latest result cards reveal the tx hash, storage identifier, ProofRegistry transaction, Agent NFT mint reference, and explorer links.",
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
              ["Agents", "Minted strategy Agent NFTs", "Users and judges", "Shows proof-backed strategies as on-chain artifacts"],
              ["Marketplace", "Strategy adoption listings", "Users and judges", "Shows listed Strategy NFTs and adoption status"],
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
            "Start on `/judge` when the reviewer wants the fastest proof-backed view without wallet connection.",
            "Use `/docs` when the reviewer wants architecture, security boundaries, and the plain-English explanation behind the live flow.",
            "Open the dashboard or `/agent`, run 1-click optimization, then show the proof modal with Integrity Auditor, 0G Storage CID, block number, and ProofRegistry tx.",
            "Mint the result as an Agent NFT, then open `/agents` or `/marketplace` to show that the strategy becomes an on-chain artifact, not only a UI state.",
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
        { label: "Problem", value: "Idle DeFi capital and hallucination-prone AI output", tone: "amber" },
        { label: "Target Users", value: "Retail users, judges, and contributors", tone: "white" },
        { label: "Trust Model", value: "Guardrailed output + proof trail", tone: "green" },
      ],
      quickLinks: pageQuickLinks("overview", "0g-integration", "roadmap"),
      sections: [
        {
          id: "problem-statement",
          title: "Problem statement",
          paragraphs: [
            "Many DeFi dashboards stop at recommendation cards. They show a higher APY route, but they do not explain how the route was produced, what part is simulated, where proof is stored, or how a reviewer should validate the claim.",
            "YieldBoost AI exists to reduce that trust gap. The interface is opinionated, the optimization flow is guided, Integrity Auditor checks the recommendation, and the proof surfaces are always close to the main action paths.",
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
              "The docs present the current product as mainnet-first and proof-backed, while still being clear about what is a recommendation, what is an on-chain proof, and what is a future execution layer.",
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
            "The product is strongest when it is explicit about verification. Optimization output is treated as a proposal, checked by Integrity Auditor, persisted through the proof flow, and only then presented as a reviewable strategy artifact.",
          ],
          bullets: [
            "Connected wallets can switch networks and broadcast the selected address into the app state.",
            "Watch mode allows a valid address to be tracked without an injected wallet session.",
            "Proof records are stored in KV when configured, or in the local runtime artifact file when running locally.",
            `The live submission path defaults to ${defaultNetwork.label}, while ${secondaryNetwork.label} remains available for comparison and fallback testing.`,
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
        { label: "Proof Path", value: storageStatus, tone: defaultNetwork.storageConfigured ? "green" : "amber" },
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
                `The current public path is organized around ${defaultNetwork.label}. ${secondaryNetwork.label} remains available from the switcher for comparison and fallback testing.`,
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
              ["/judge", "Read-only review surface", "Judges", "Best place to verify latest proof without wallet setup"],
              ["/", "Dashboard", "Fast demo", "Contains `Boost My Yield Now`"],
              ["/agent", "Boost page", "Execution walkthrough", "Contains `Execute Optimization` and prompt box"],
              ["/agents", "Agent NFT gallery", "NFT proof review", "Shows minted Strategy NFTs"],
              ["/marketplace", "Strategy marketplace", "Adoption review", "Shows listed proof-backed Strategy NFTs"],
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
                `The optimization engine uses ${status.computeMode.toLowerCase()}. It returns projected APY, gain estimate, recommendation, and supporting reasoning text.`,
            },
            {
              title: "Audit the recommendation",
              body:
                "Integrity Auditor checks the recommendation against the wallet snapshot and proof context so unrealistic or unsafe AI output can be rejected before proof writing or NFT minting.",
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
            "The latest proof row starts showing the tx hash, storage identifier, Integrity Auditor status, and ProofRegistry details once available.",
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
              ["Optimization scoring", status.computeMode, "Deterministic snapshot fallback", "The product stays usable if external compute is unavailable"],
              ["Integrity Auditor", "Deterministic guardrail", "Rejects unsafe or unrealistic output", "Do not store or mint a rejected recommendation"],
              ["Narrative stream", status.llmMode, "Built-in narrative copy", "The wording can fall back while the proof flow still remains explicit"],
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
                "Once the storage route responds, the result card can expose explorer links, storage identifiers, Integrity Auditor data, and ProofRegistry data.",
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
            "After a storage write succeeds, the app pairs that decision payload with transaction metadata such as storage tx hash, timestamp, block number when available, wallet address, Integrity Auditor result, and ProofRegistry metadata when anchored.",
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
              ["Integrity Auditor", "Proof modal, Judge Mode, stored payload", "APPROVED or REJECTED guardrail result", "Shows the AI output was checked before proof/mint"],
              ["Explorer link", "Proof modal and result cards", "Direct link into the configured 0G explorer", "Lets a reviewer verify outside the app"],
              ["ProofRegistry tx", "Result card or proof modal", "Separate contract write for registry anchoring", "Shows on-chain indexing layer"],
            ],
          },
          callout: {
            tone: "amber",
            title: "Important wording",
            body:
              "A proof receipt proves what the app produced and stored. It is not a guarantee of future APY, and it should not be described as an automatic fund-moving transaction.",
          },
        },
        {
          id: "history-and-verification",
          title: "How history and verification work",
          paragraphs: [
            "History is the proof ledger view for the current runtime store. It summarizes runs, shows the newest proof rows, and exposes a judge-friendly verification summary.",
            "The proof modal prefers live stored proof data from `/api/0g/proof`; if a CID lookup is not available, it can still resolve receipt metadata from a known transaction hash so older Agent NFTs do not appear as pending forever.",
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
        "Live 0G Storage, 0G Compute broker path, explorer links, ProofRegistry behavior, and mainnet deployment artifacts.",
      summary: [
        { label: "Default Path", value: defaultNetwork.label, tone: "teal" },
        { label: "Storage", value: storageStatus, tone: defaultNetwork.storageConfigured ? "green" : "amber" },
        { label: "Compute", value: status.computeMode, tone: "green" },
        { label: "Explorer", value: liveExplorer, tone: "white" },
      ],
      quickLinks: pageQuickLinks("proof-and-verification", "wallet-and-security", "roadmap"),
      sections: [
        {
          id: "what-is-live",
          title: "What is live in the 0G integration",
          bullets: [
            "Network configuration is modeled explicitly for testnet and mainnet in the wallet layer.",
            "The proof storage route can upload a JSON proof package through the 0G TypeScript SDK when the active network has RPC, storage URL, and private key configured.",
            "0G Compute broker inference is attempted when the active network has a compute provider address and ledger signer configured.",
            "Integrity Auditor checks the recommendation before the proof write and before Agent NFT minting.",
            "The UI consistently surfaces the resulting storage tx hash, explorer link, Integrity Auditor status, ProofRegistry transaction, and mainnet contract artifacts.",
            "The current explorer path is built from the configured explorer base and the returned transaction hashes.",
          ],
        },
        {
          id: "tee-verification",
          title: "0G Compute and attestation metadata",
          paragraphs: [
            "When 0G Compute credentials are configured, the optimization route prioritizes inference through the 0G Compute broker. The app validates broker response metadata before presenting the result as verified runtime output.",
            "When attestation metadata is present, the proof record can include provider address, model identifier, chat ID, verification method, and signed-text match status. Agent NFT minting can also register attestation hashes through the oracle path.",
          ],
          bullets: [
            "0G Compute is the highest-priority narrative path when configured, falling back honestly if unavailable.",
            "The UI displays verification metadata only when it exists in the returned proof package.",
            "Attestation metadata can be persisted in the stored proof record and linked to Agent NFT verification.",
          ],
          callout: {
            tone: "green",
            title: "Compute configuration",
            body:
              "To enable the 0G Compute path, set the active network's compute provider address and ledger signer envs. If the broker path is unavailable, the app keeps the recommendation flow explicit instead of faking a compute result.",
          },
        },
        {
          id: "how-storage-write-works",
          title: "How proof enters 0G Storage",
          steps: [
            {
              title: "Serialize decision payload",
              body:
                "The app creates a temporary JSON file that includes optimization values, timestamp, Integrity Auditor result, optional compute metadata, and `appId: yieldboost-ai`.",
            },
            {
              title: "Upload through the 0G SDK",
              body:
                "The storage route wraps that file with `ZgFile`, then calls the indexer upload flow using the configured RPC and signer.",
            },
            {
              title: "Capture the returned metadata",
              body:
                "The route stores the returned root hash, tx hash, block info when obtainable, wallet address, explorer URL, Integrity Auditor fields, compute metadata, and optional note flags.",
            },
            {
              title: "Persist locally or in KV",
              body:
                "The proof record is inserted into the runtime store so History, the proof modal, and the latest agent state can all read the same record.",
            },
          ],
        },
        {
          id: "compute-fallbacks",
          title: "Compute and narrative fallback behavior",
          paragraphs: [
            "The optimization engine prioritizes 0G Compute when the active network is configured, then falls back to deterministic local narrative when that path is unavailable.",
            "This keeps the app functional even when compute infrastructure is unavailable, while still being honest about which path produced the result.",
          ],
          table: {
            columns: ["Provider", "Priority", "When active", "What it provides"],
            rows: [
              ["0G Compute broker", "1 (highest)", "Active network compute provider + ledger signer set", "Broker-backed inference and verification metadata when available"],
              ["Deterministic", "2", "Always available", "Built-in narrative templates"],
            ],
          },
        },
        {
          id: "network-matrix",
          title: "Network matrix",
          table: {
            columns: ["Network", "Wallet switch support", "Storage config", "ProofRegistry", "Compute", "Explorer"],
            rows: [
              [
                status.networks.testnet.label,
                status.networks.testnet.enabled ? "Configured" : "Missing chain config",
                status.networks.testnet.storageConfigured ? "Ready" : "Needs envs",
                status.networks.testnet.proofRegistryConfigured ? "Configured" : "Optional / off",
                "Network-aware envs supported",
                status.networks.testnet.explorerBase,
              ],
              [
                status.networks.mainnet.label,
                status.networks.mainnet.enabled ? "Configured" : "Optional / off",
                status.networks.mainnet.storageConfigured ? "Ready" : "Needs envs",
                status.networks.mainnet.proofRegistryConfigured ? "Configured" : "Optional / off",
                "Network-aware envs supported",
                status.networks.mainnet.explorerBase,
              ],
            ],
          },
        },
      ],
    },
    {
      slug: "strategy-as-inft",
      href: "/docs/strategy-as-inft",
      label: "Strategy as INFT",
      category: "Platform & Trust",
      description:
        "How yield optimization strategies become Agent NFTs and marketplace-ready proof-backed artifacts.",
      summary: [
        { label: "Contract", value: agentNftStatus, tone: inftAddress ? "green" : "amber" },
        { label: "Marketplace", value: marketplaceStatus, tone: marketplaceAddress ? "green" : "amber" },
        { label: "Oracle", value: oracleStatus, tone: oracleAddress ? "green" : "amber" },
      ],
      quickLinks: pageQuickLinks("0g-integration", "wallet-and-security", "faq"),
      sections: [
        {
          id: "what-is-strategy-inft",
          title: "What Strategy as INFT means",
          paragraphs: [
            "Each successful yield optimization can be minted as an Agent NFT. This NFT represents the strategy route, APY context, wallet ownership, and proof trail from the optimization run.",
            "The current runtime packages strategy metadata with the proof CID, tx hash, performance fields, Integrity Auditor result, and optional compute metadata. The contract stores the strategy artifact while the app keeps proof links visible for review.",
          ],
          bullets: [
            "NFT represents a specific yield optimization strategy",
            "Mint goes to the connected wallet, not the server signer",
            "Integrity Auditor must approve the strategy before minting",
            "Marketplace adoption lets a listed strategy be reviewed before another wallet adopts it",
          ],
        },
        {
          id: "how-to-mint",
          title: "How to mint an Agent NFT",
          steps: [
            {
              title: "Complete an optimization",
              body:
                "Run an optimization from the dashboard or Boost page. Once the proof is stored, you can mint the strategy as an NFT.",
            },
            {
              title: "Open the proof modal",
              body:
                "Open proof details from the latest result card and confirm the proof has a storage CID, tx hash, block number, and Integrity Auditor status.",
            },
            {
              title: "Click 'Mint as Agent'",
              body:
                "In the proof modal footer, click the 'Mint as Agent' button. This calls the mint API which deploys the strategy to the YieldStrategyINFT contract.",
            },
            {
              title: "View in Agent Gallery",
              body:
                "After minting, visit `/agents` to see all minted Agent NFTs with APY, proof links, ownership, and the source label.",
            },
          ],
        },
        {
          id: "authorization-system",
          title: "Strategy marketplace and adoption",
          paragraphs: [
            "The Marketplace page reads minted Strategy NFTs and active adoption listings from the mainnet marketplace contract when configured.",
            "This lets a strategy become a reviewable artifact that can be listed, inspected, and adopted after the buyer checks the proof trail.",
          ],
          bullets: [
            "Owners can list Strategy NFTs from the marketplace UI.",
            "Listings expose price, owner, APY, ROI lift, accuracy, and proof links.",
            "Buyers can inspect proof metadata before trusting the artifact.",
            "The current mainnet marketplace address is surfaced in Judge Mode and the docs.",
          ],
        },
        {
          id: "tee-verification",
          title: "Attestation oracle and verification flag",
          paragraphs: [
            "When the optimization includes verified compute metadata, the mint route can derive an attestation hash and register it through the AttestationRegistryOracle before minting.",
            "The INFT `verified` flag is therefore reserved for this attestation path. A strategy can still be proof-backed and Integrity Auditor-approved even when the on-chain attestation flag is false.",
          ],
          callout: {
            tone: "green",
            title: "Avoid confusion",
            body:
              "In `/agents`, `verified=false` does not mean the proof is fake. It means the specific on-chain oracle attestation flag was not set for that NFT.",
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
        { label: "Security Boundary", value: "Non-custodial recommendation and proof UX", tone: "amber" },
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
            `The current public deployment is mainnet-first on ${defaultNetwork.label}, while ${secondaryNetwork.label} stays available for comparison.`,
            "A proof receipt is not the same thing as guaranteed profitable execution. It is evidence of what the app recommended, audited, produced, and stored, not a promise of future APY.",
            "Do not commit `.env.local`, API keys, private keys, access tokens, or wallet secrets into Git.",
          ],
          callout: {
            tone: "amber",
            title: "Demo limitation",
            body:
              "This workspace is ideal for product demos, proof UX, architecture review, and strategy artifact minting. It should not be pitched as an autonomous production trading executor without additional execution, custody, and risk controls.",
          },
        },
        {
          id: "0g-storage-data-safety",
          title: "What the app stores in 0G Storage",
          paragraphs: [
            "The proof route writes a compact JSON proof package that is meant to support verification and replay of the optimization result. In the current implementation, this package can include the optimization decision, timestamp, wallet-scoped metadata, and a portfolio snapshot when the client provides it.",
            "That means the stored record is useful for auditability, but it should be described honestly: it is proof-oriented application data, not a private zero-knowledge portfolio vault.",
          ],
          table: {
            columns: ["Data type", "Current behavior", "Why it exists", "What it does not include"],
            rows: [
              ["Optimization decision", "Stored", "Lets judges and users inspect the recommended route and APY change later", "Does not include private keys or seed phrases"],
              ["Integrity Auditor result", "Stored", "Shows whether the recommendation passed the anti-hallucination guardrail", "Does not guarantee future market outcomes"],
              ["Wallet-scoped metadata", "Stored", "Keeps proof history tied to the review wallet", "Does not grant signing authority"],
              ["Portfolio snapshot fields", "Optionally stored", "Helps replay the recorded context behind the proof", "Not a full encrypted vault of wallet history"],
              ["Secrets and credentials", "Not stored", "Should remain in envs or wallet software only", "Never belongs in proof payloads"],
            ],
          },
          callout: {
            tone: "green",
            title: "Security boundary",
            body:
              "The strongest honest claim is that YieldBoost AI stores verifier-friendly proof data and Integrity Auditor context while keeping wallet secrets out of the proof flow.",
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
                "No. The product recommends and proves a strategy; it does not automatically swap, stake, or move user funds. Execution remains a separate production-grade layer.",
            },
            {
              title: "What does `Boost My Yield Now` do?",
              body:
                "It runs the default optimization request from the dashboard, passes the output through Integrity Auditor, and stores the resulting proof record when approved.",
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
            `What part is live? Answer: the ${defaultNetwork.label} proof flow, wallet context, proof storage route, ProofRegistry links, Agent NFT minting, marketplace reading, and Judge Mode are live code paths.`,
            `Is this testnet? Answer: no, the public submission path is mainnet-first. ${secondaryNetwork.label} is still available for comparison and testing.`,
            "How do I verify it? Answer: open `/judge`, History, or the proof modal, then follow the ChainScan links and compare them with the stored identifiers.",
            "What makes it different from a dashboard mock? Answer: the app stores runtime proof records, anchors them, mints strategy artifacts, and exposes the same trail across Judge Mode, Agents, Marketplace, and Docs.",
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
              ["Integrity Auditor", "Deterministic anti-hallucination guardrail", "Proof modal and Judge Mode", "Rejects unsafe or unrealistic recommendations before proof/mint"],
              ["Agent NFT", "On-chain strategy artifact", "Agents page and proof modal", "Turns a proof-backed strategy into an ownable artifact"],
              ["Marketplace", "Strategy adoption surface", "Marketplace page and Judge Mode", "Lets listed Strategy NFTs be inspected before adoption"],
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
              ["No ProofRegistry entry", "Wrong network, registry env mismatch, or tx failed", "Result card note + server logs", "Keep the storage proof visible and fix the registry path before claiming an anchor"],
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
            "If ProofRegistry is unavailable, say the current run has a storage proof but the registry anchor needs attention, then continue with the explorer link and stored receipt.",
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
              ["Contract surfaces", "`/agents` + `/marketplace`", "Read minted Strategy NFTs and adoption listings", "Backed by INFT and marketplace envs"],
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
Integrity Auditor checks recommendation
        |
        v
/api/0g/store -> 0G SDK upload -> ProofRegistry anchor when configured
        |
        v
runtime-store (KV or local file)
        |
        v
History / proof modal / Judge Mode / /api/agent/latest / /api/0g/proof
        |
        v
Mint as Agent -> YieldStrategyINFT -> Agents / Marketplace`,
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
                "The client follows up with a POST to `/api/0g/store` carrying the audited decision payload, network key, wallet address, and runtime metadata.",
            },
            {
              title: "Hydration and replay",
              body:
                "Later, `/api/agent/latest`, `/api/history`, and `/api/0g/proof` all read from the stored proof record instead of recomputing everything from scratch.",
            },
            {
              title: "Artifact minting and adoption",
              body:
                "`/api/agent/mint`, `/api/agent/list`, and `/api/marketplace/list` connect the approved proof output to YieldStrategyINFT and the marketplace adoption surface.",
            },
          ],
        },
        {
          id: "provider-priority",
          title: "Provider priority and fallback rules",
          bullets: [
            "Optimization narrative prioritizes 0G Compute when the active network credentials are configured.",
            "If the compute provider is unavailable, the app still produces a deterministic narrative so the UX does not collapse.",
            "Integrity Auditor stays deterministic so guardrail behavior does not depend on another model call.",
            "This fallback behavior is intentional and is surfaced honestly in the UI.",
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
  "integrityAudit": {
    "status": "APPROVED",
    "score": 100,
    "source": "deterministic-logic-guardrail"
  },
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
        { label: "Live Now", value: "Mainnet proof, Judge Mode, Agent NFTs, marketplace", tone: "teal" },
        { label: "Current Boundary", value: "Recommendation and proof, not autonomous fund execution", tone: "amber" },
        { label: "Next Frontier", value: "Deeper execution safety and Proof-of-Optimization", tone: "green" },
      ],
      quickLinks: pageQuickLinks("0g-integration", "architecture", "faq"),
      sections: [
        {
          id: "live-now",
          title: "What is live now",
          bullets: [
            "A polished multi-surface workspace with dashboard, Boost, History, analytics, and docs.",
            "Wallet connection and watch mode flow inside the sidebar.",
            "Optimization requests with Integrity Auditor and stored result hydration.",
            "0G Storage upload path plus ProofRegistry contract anchoring on the configured default network.",
            "Judge Mode with mainnet/testnet switching and ChainScan links.",
            "Strategy Agent NFT minting through YieldStrategyINFT.",
            "Marketplace listing/adoption view for proof-backed Strategy NFTs.",
          ],
        },
        {
          id: "known-limitations",
          title: "Known limitations",
          bullets: [
            "Proof persistence depends on environment configuration; without the right envs, proof storage fails honestly.",
            "The portfolio snapshot currently focuses on native balance retrieval plus the latest proof-derived portfolio total rather than a deep multi-asset on-chain portfolio engine.",
            "The optimization engine recommends and proves strategies, but it is not a production autonomous trading executor.",
            "The on-chain INFT `verified` flag is reserved for the attestation oracle path, so proof-backed NFTs can exist even when that flag is false.",
          ],
          callout: {
            tone: "amber",
            title: "Production-ready next step",
            body:
              "The strongest next milestone is adding execution simulation and stronger risk checks while preserving the current proof-first, auditor-gated product story.",
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
              title: "Deepen Proof-of-Optimization",
              body:
                "Turn repeated high-quality optimization events into richer scoring, reward, and marketplace signals for future $YA0G mechanics.",
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
