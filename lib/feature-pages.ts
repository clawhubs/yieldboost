import type { FeaturePageConfig } from "@/components/ui/FeaturePageView";
import {
  BellRing,
  Blocks,
  Bot,
  CandlestickChart,
  ChartColumnIncreasing,
  CircleDollarSign,
  Clock3,
  Compass,
  Database,
  Fingerprint,
  Goal,
  Layers3,
  NotebookTabs,
  Radar,
  Route,
  ScanEye,
  SearchCheck,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  WalletCards,
  Waypoints,
} from "lucide-react";

export const featurePageConfigs: Record<string, FeaturePageConfig> = {
  portfolio: {
    badge: "Portfolio",
    title: "Portfolio Control Center",
    description:
      "Track allocation drift, idle balances, and 0G Network-backed sync health from a single operational surface.",
    actions: [
      { label: "Open AI Agent", href: "/agent", tone: "primary" },
      { label: "Back to Dashboard", href: "/", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Total Portfolio", value: "$24,570.25", helper: "↑ 5.34% in the last 24h" },
      { label: "Idle Capital", value: "$4,180", helper: "2 pockets ready for optimization", tone: "green" },
      { label: "0G Network Sync", value: "98.4%", helper: "Archival snapshot every 2 seconds", tone: "teal" },
      { label: "Tracked Positions", value: "12", helper: "Across 6 protocols and 3 wallets" },
    ],
    highlight: {
      title: "Allocation Drift & Idle Capital",
      description:
        "YieldBoost highlights where balance is underused before moving capital into a safer, higher-yield route.",
      icon: Layers3,
      visual: "bars",
      rows: [
        { label: "USDC", value: "50.7%", helper: "Largest idle allocation", tone: "green" },
        { label: "0G Token", value: "17.0%", helper: "Core ecosystem exposure", tone: "teal" },
        { label: "SAUCE", value: "12.0%", helper: "Momentum-driven opportunity", tone: "white" },
        { label: "BONZO", value: "9.8%", helper: "Needs risk trim before next epoch", tone: "white" },
      ],
      footer: "Snapshot anchored to 0G Storage and refreshed for reviewer demo flow.",
    },
    table: {
      title: "Tracked Wallet Positions",
      subtitle: "Live wallet positions, protocol routes, and current posture.",
      columns: ["Asset", "Protocol", "Current APY", "Exposure"],
      rows: [
        { cells: ["USDC", "SaucerSwap LP", "12.38%", "Medium"], badge: "idle" },
        { cells: ["0G Token", "0G Network Vault", "18.65%", "Low"], badge: "healthy" },
        { cells: ["SAUCE", "Reward Pool", "14.22%", "Medium"], badge: "watch" },
        { cells: ["BONZO", "Lending Loop", "9.51%", "High"], badge: "trim" },
      ],
      footnote: "Rows stay aligned with wallet positions and API status without changing the layout.",
    },
    sideCards: [
      {
        title: "Portfolio Health",
        icon: Shield,
        accent: "green",
        items: [
          { label: "Diversification", value: "Healthy across 4 major buckets", tone: "green" },
          { label: "Slippage Budget", value: "0.8% max for auto execution", tone: "white" },
          { label: "Risk Profile", value: "Moderate with capital preservation bias", tone: "teal" },
        ],
        footer: "Guardrails already line up with the dashboard narrative and the future backend model.",
      },
      {
        title: "Reviewer Demo Notes",
        icon: NotebookTabs,
        accent: "teal",
        items: [
          { label: "Sync Status", value: "Wallet snapshot mirrored to 0G Storage", tone: "teal" },
          { label: "Next Trigger", value: "Optimize once idle capital exceeds $2,500", tone: "green" },
          { label: "Proof Mode", value: "Explorer-ready record after execution", tone: "white" },
        ],
        footer: "Useful as a live summary now, and ready for deeper backend jobs.",
        cta: { label: "See History", href: "/history", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "AI Notes",
        icon: Bot,
        points: [
          "USDC is still the cleanest source of immediate APY lift.",
          "0G exposure should stay present for ecosystem-aligned strategies.",
          "BONZO needs smaller sizing before the next optimization run.",
        ],
        footer: "These notes can later be replaced with streamed model reasoning.",
      },
      {
        title: "Storage Behavior",
        icon: Database,
        points: [
          "Portfolio snapshots are versioned for replay and proof review.",
          "Balance snapshots follow the same cadence as current storage writes.",
          "The UI is ready for CID and timestamp injection from backend.",
        ],
        footer: "Designed to support hackathon demos that need a credible storage story.",
      },
      {
        title: "Next Action",
        icon: Goal,
        points: [
          "Open AI Agent and simulate a rebalance.",
          "Review ranked opportunities before execution.",
          "Confirm proof entry appears in History after completion.",
        ],
        footer: "This gives the demo a clear narrative from portfolio to execution.",
      },
    ],
  },
  strategies: {
    badge: "Strategies",
    title: "Strategy Studio",
    description:
      "Compose low-risk, multi-protocol strategies that mirror how the backend evaluates and executes routes.",
    actions: [
      { label: "Launch AI Agent", href: "/agent", tone: "primary" },
      { label: "Review Opportunities", href: "/opportunities", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Live Strategies", value: "12", helper: "8 active, 4 queued for review" },
      { label: "Avg Confidence", value: "96%", helper: "Across current strategy templates", tone: "green" },
      { label: "Simulated Routes", value: "128", helper: "Generated by the optimizer engine", tone: "teal" },
      { label: "Guardrails Active", value: "8", helper: "Risk, slippage, and proof conditions" },
    ],
    highlight: {
      title: "Active Strategy Stack",
      description:
        "Each strategy is shaped to explain what the backend scores, simulates, and executes.",
      icon: Route,
      visual: "grid",
      rows: [
        { label: "Stable LP Rotation", value: "24.18%", helper: "Best current APY target", tone: "green" },
        { label: "0G Yield Staking", value: "18.65%", helper: "Low-risk ecosystem exposure", tone: "teal" },
        { label: "BONZO Trim & Rebalance", value: "16.20%", helper: "Reduce downside concentration", tone: "white" },
        { label: "Execution Time", value: "8.42s", helper: "Expected wall-clock completion", tone: "white" },
      ],
      footer: "These cards are structured so backend data can slot in without redesign work.",
    },
    table: {
      title: "Strategy Templates",
      subtitle: "Strategy definitions for the engine and reviewer flow.",
      columns: ["Template", "Target", "Risk", "Trigger"],
      rows: [
        { cells: ["Idle Stable Sweep", "SaucerSwap LP", "Moderate", ">$2k idle USDC"], badge: "ready" },
        { cells: ["0G Core Hold", "0G Staking Vault", "Low", "Maintain baseline"], badge: "live" },
        { cells: ["Momentum Rotate", "SAUCE Pool", "Moderate", "Signal > 4.0"], badge: "watch" },
        { cells: ["Risk Compression", "BONZO Trim", "Low", "Exposure > 10%"], badge: "queued" },
      ],
      footnote: "Ready for richer strategy definitions returned by orchestration services.",
    },
    sideCards: [
      {
        title: "Execution Guardrails",
        icon: ShieldCheck,
        accent: "green",
        items: [
          { label: "Max Slippage", value: "0.8% per route", tone: "green" },
          { label: "Risk Escalation", value: "Blocked above moderate posture", tone: "white" },
          { label: "Proof Requirement", value: "Mandatory 0G explorer reference", tone: "teal" },
        ],
        footer: "The frontend now already communicates the risk system clearly for judges and users.",
      },
      {
        title: "Deployment Queue",
        icon: TimerReset,
        accent: "teal",
        items: [
          { label: "Queued Templates", value: "4 waiting for review", tone: "teal" },
          { label: "Auto-Eligible", value: "2 can run immediately", tone: "green" },
          { label: "Needs Manual Review", value: "2 due to volatility window", tone: "white" },
        ],
        footer: "A natural landing place later for backend orchestration status.",
        cta: { label: "Open History", href: "/history", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "Proof Policy",
        icon: Fingerprint,
        points: [
          "Every strategy should output a proof receipt after execution.",
          "0G explorer links remain first-class in the product story.",
          "The current structure already reserves space for CID and tx hash.",
        ],
        footer: "Perfect for the hackathon requirement around verifiable integration.",
      },
      {
        title: "AI Reasoning",
        icon: Sparkles,
        points: [
          "Templates favor low-risk yield before aggressive rotation.",
          "Stable capital gets routed first when idle pockets are detected.",
          "Confidence and trigger conditions stay visible to the user.",
        ],
        footer: "Later this can be streamed or generated by the live model layer.",
      },
      {
        title: "Reviewer Walkthrough",
        icon: Compass,
        points: [
          "Choose a strategy template.",
          "Inspect the trigger and risk controls.",
          "Move to Agent for execution and History for proof review.",
        ],
        footer: "This keeps the demo flow simple and believable.",
      },
    ],
  },
  opportunities: {
    badge: "Opportunities",
    title: "Opportunity Scanner",
    description:
      "Surface ranked yield opportunities with enough detail to support a strong hackathon demo even before live backend scoring arrives.",
    actions: [
      { label: "Run Optimization", href: "/agent", tone: "primary" },
      { label: "Back to Dashboard", href: "/", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Top Estimated APY", value: "24.18%", helper: "Current best low-risk route", tone: "green" },
      { label: "Signals Monitored", value: "37", helper: "Across liquidity, momentum, and slippage", tone: "teal" },
      { label: "Opportunities Ready", value: "9", helper: "Within current risk envelope" },
      { label: "Proof-Eligible", value: "100%", helper: "All shortlisted routes support verification" },
    ],
    highlight: {
      title: "Ranked by YieldBoost",
      description:
        "This ranking mirrors how the backend sorts routes by APY, risk, and proof readiness.",
      icon: SearchCheck,
      visual: "line",
      rows: [
        { label: "SaucerSwap LP", value: "24.18%", helper: "Best balance of yield and depth", tone: "green" },
        { label: "0G High-Yield Pool", value: "18.65%", helper: "Stable ecosystem-aligned option", tone: "teal" },
        { label: "BONZO Rebalance", value: "16.20%", helper: "Useful after exposure trim", tone: "white" },
        { label: "Momentum Confidence", value: "96%", helper: "Current model conviction", tone: "white" },
      ],
      footer: "Opportunity cards are now ready to receive backend scoring outputs later on.",
    },
    table: {
      title: "Opportunity Board",
      subtitle: "Routes ranked for the current frontend and execution flow.",
      columns: ["Route", "Est. APY", "Risk", "Liquidity"],
      rows: [
        { cells: ["USDC → SaucerSwap LP", "24.18%", "Moderate", "High"], badge: "best" },
        { cells: ["0G → Staking Vault", "18.65%", "Low", "High"], badge: "safe" },
        { cells: ["BONZO → Earn More", "16.20%", "Moderate", "Medium"], badge: "watch" },
        { cells: ["SAUCE Momentum Pool", "14.70%", "Moderate", "Medium"], badge: "rising" },
      ],
      footnote: "Backend nanti bisa mengisi skor, proof eligibility, dan live liquidity tanpa ubah desain ini.",
    },
    sideCards: [
      {
        title: "Selection Logic",
        icon: Radar,
        accent: "teal",
        items: [
          { label: "Momentum Weight", value: "High for short-term yield jumps", tone: "teal" },
          { label: "Risk Filter", value: "Rejects routes beyond moderate profile", tone: "white" },
          { label: "Proof Gate", value: "Must support 0G Network traceability", tone: "green" },
        ],
        footer: "Judges can already understand the optimizer logic from the UI alone.",
      },
      {
        title: "Execution Readiness",
        icon: Waypoints,
        accent: "green",
        items: [
          { label: "Auto-Executable", value: "5 routes ready right now", tone: "green" },
          { label: "Manual Review", value: "2 routes due to liquidity depth", tone: "white" },
          { label: "Slippage Window", value: "0.4% to 0.8% across shortlist", tone: "teal" },
        ],
        footer: "A clean bridge between opportunities and the agent execution panel.",
        cta: { label: "Open Agent", href: "/agent", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "0G Alignment",
        icon: ShieldCheck,
        points: [
          "Opportunity output is designed to be explorer-verifiable.",
          "Storage-ready notes can be persisted per selected route.",
          "The page reinforces the 0G integration narrative clearly.",
        ],
        footer: "Strong fit for the hackathon’s integration proof requirement.",
      },
      {
        title: "Market Readiness",
        icon: ChartColumnIncreasing,
        points: [
          "Best routes combine high APY with manageable slippage.",
          "Confidence stays visible so route quality still feels credible.",
          "The scan board can later be refreshed via backend cron jobs.",
        ],
        footer: "Designed for easy transition from static to live opportunities.",
      },
      {
        title: "Demo Path",
        icon: Goal,
        points: [
          "Inspect top route on Opportunities.",
          "Run execution from Agent.",
          "Show proof landing in History.",
        ],
        footer: "This creates a complete product loop for the presentation.",
      },
    ],
  },
  history: {
    badge: "History",
    title: "Execution History & Proof Ledger",
    description:
      "Show previous optimization runs, settlement context, and 0G Network proof references in a timeline-friendly review surface.",
    actions: [
      { label: "View AI Agent", href: "/agent", tone: "primary" },
      { label: "Open Dashboard", href: "/", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Optimization Runs", value: "48", helper: "Recent history retained for proof review" },
      { label: "Success Rate", value: "94%", helper: "Completed without breaking risk rules", tone: "green" },
      { label: "Proof Entries", value: "48", helper: "Every run reserves proof metadata", tone: "teal" },
      { label: "Value Routed", value: "$182k", helper: "Across recent execution windows" },
    ],
    highlight: {
      title: "Recent Execution Timeline",
      description:
        "This section previews how the backend can later stream real execution history into a proof-friendly UI.",
      icon: Clock3,
      visual: "line",
      rows: [
        { label: "10:32 AM", value: "Yield raised to 23.84%", helper: "Completed run", tone: "green" },
        { label: "10:31 AM", value: "Strategy execution started", helper: "Swapping + LP route", tone: "teal" },
        { label: "10:30 AM", value: "Portfolio analysis finished", helper: "Risk and slippage verified", tone: "white" },
        { label: "10:29 AM", value: "0G sync created", helper: "Snapshot archived for replay", tone: "white" },
      ],
      footer: "A reviewer can already see the execution story with the current proof-backed history flow.",
    },
    table: {
      title: "Proof Ledger",
      subtitle: "Execution table for tx hash, timestamps, and explorer trace state.",
      columns: ["Timestamp", "Action", "Proof CID", "Explorer"],
      rows: [
        { cells: ["10:32 AM", "Optimization settled", "bafy...e321", "0G Newton"], badge: "verified" },
        { cells: ["10:31 AM", "Liquidity added", "bafy...d182", "0G Newton"], badge: "stored" },
        { cells: ["10:30 AM", "Portfolio analyzed", "bafy...ab04", "0G Newton"], badge: "indexed" },
        { cells: ["10:29 AM", "Wallet snapshot", "bafy...901c", "0G Newton"], badge: "anchored" },
      ],
      footnote: "Backend nanti tinggal mengisi timestamp, CID, hash, dan explorer URL real.",
    },
    sideCards: [
      {
        title: "Latest Outcome",
        icon: CircleDollarSign,
        accent: "green",
        items: [
          { label: "Realized APY Lift", value: "+11.46%", tone: "green" },
          { label: "Annualized Gain", value: "+$2,356.41 projected", tone: "teal" },
          { label: "Execution Time", value: "8.42 seconds", tone: "white" },
        ],
        footer: "History becomes the best place to prove the optimizer is more than a static dashboard.",
      },
      {
        title: "Verification Notes",
        icon: Fingerprint,
        accent: "teal",
        items: [
          { label: "Explorer Source", value: "0G Newton reference path", tone: "teal" },
          { label: "Storage Anchor", value: "CID reserved for every recorded run", tone: "green" },
          { label: "Review Status", value: "Ready for judge walkthrough", tone: "white" },
        ],
        footer: "Perfect for later connecting to backend proof creation and indexing.",
        cta: { label: "Open Opportunities", href: "/opportunities", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "Settlement Channels",
        icon: WalletCards,
        points: [
          "History can separate analysis, execution, settlement, and proof storage.",
          "Wallet and explorer references already have clear UI destinations.",
          "This makes later backend event ingestion straightforward.",
        ],
        footer: "A clean frontend contract for event-driven history later.",
      },
      {
        title: "Reviewer Notes",
        icon: NotebookTabs,
        points: [
          "Show one completed optimization run.",
          "Open proof ledger row for verifiable references.",
          "Tie the history back to the original dashboard result.",
        ],
        footer: "Small detail that makes the demo feel complete and intentional.",
      },
      {
        title: "0G Proof Story",
        icon: Database,
        points: [
          "0G Storage anchors the record layer.",
          "0G Explorer links give visible verifiability.",
          "The page is ready for end-to-end proof flow once backend lands.",
        ],
        footer: "This directly supports the hackathon submission requirements.",
      },
    ],
  },
  analytics: {
    badge: "Analytics",
    title: "Performance Analytics",
    description:
      "Translate optimization outcomes into clear charts, throughput indicators, and reviewer-friendly summaries for the hackathon demo.",
    actions: [
      { label: "Inspect Dashboard", href: "/", tone: "primary" },
      { label: "See History", href: "/history", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Average APY Lift", value: "+23.61%", helper: "Across the latest model snapshots", tone: "green" },
      { label: "Avg Execution", value: "8.42s", helper: "Expected latency from analysis to completion", tone: "teal" },
      { label: "Compute Jobs", value: "184,392", helper: "0G-ready throughput narrative" },
      { label: "Uptime", value: "99.98%", helper: "Stable operational expectation" },
    ],
    highlight: {
      title: "Performance Overview",
      description:
        "A polished analytics surface now, with enough structure to absorb real backend metrics later without redesign.",
      icon: ChartColumnIncreasing,
      visual: "line",
      rows: [
        { label: "Gross Yield Lift", value: "+23.61%", helper: "Benchmark outperformance", tone: "green" },
        { label: "Net Gain After Fees", value: "+$47.23", helper: "Per cycle expectation", tone: "teal" },
        { label: "Risk Compression", value: "-18%", helper: "Reduced concentration pressure", tone: "white" },
        { label: "Proof Completion", value: "100%", helper: "Every run reserves proof state", tone: "white" },
      ],
      footer: "Charts and summaries are already organized like a production analytics workspace.",
    },
    table: {
      title: "Optimization Quality Matrix",
      subtitle: "Metrics for scorecards, model confidence, and execution consistency.",
      columns: ["Metric", "Current", "Benchmark", "Direction"],
      rows: [
        { cells: ["APY Improvement", "23.61%", "12.00%", "Up"], badge: "strong" },
        { cells: ["Execution Time", "8.42s", "12.50s", "Down"], badge: "better" },
        { cells: ["Proof Coverage", "100%", "90%", "Up"], badge: "clean" },
        { cells: ["Risk Deviation", "Low", "Moderate", "Down"], badge: "safe" },
      ],
      footnote: "This table can later accept live benchmark and model telemetry from backend analytics jobs.",
    },
    sideCards: [
      {
        title: "Resource Efficiency",
        icon: TimerReset,
        accent: "teal",
        items: [
          { label: "Compute Efficiency", value: "High throughput at low latency", tone: "teal" },
          { label: "Storage Footprint", value: "Compact proof-first snapshots", tone: "green" },
          { label: "Explorer Coverage", value: "Ready for end-to-end linking", tone: "white" },
        ],
        footer: "Strong analytics story for the 0G infra angle of the product.",
      },
      {
        title: "Model Confidence",
        icon: Sparkles,
        accent: "green",
        items: [
          { label: "Average Confidence", value: "96% on top-ranked actions", tone: "green" },
          { label: "Fallback Usage", value: "Minimal in current scenarios", tone: "white" },
          { label: "User Explainability", value: "Clear reasoning surfaces available", tone: "teal" },
        ],
        footer: "Later this can map directly to model telemetry and evaluation APIs.",
        cta: { label: "Open Strategies", href: "/strategies", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "Capital Rotation",
        icon: Compass,
        points: [
          "Analytics show where idle capital creates the most drag.",
          "Comparisons make the optimizer look intentional rather than decorative.",
          "The screen is ready for real chart series once backend exists.",
        ],
        footer: "Important for convincing demo storytelling.",
      },
      {
        title: "Proof Throughput",
        icon: Database,
        points: [
          "Proof generation should appear measurable, not hidden.",
          "Storage and explorer metrics stay visible to reinforce 0G usage.",
          "The frontend now has room for real proof stats.",
        ],
        footer: "A nice bridge between analytics and hackathon judging criteria.",
      },
      {
        title: "Risk Compression",
        icon: Shield,
        points: [
          "Analytics can explain not only gains, but safer portfolio posture.",
          "This helps position the product as verifiable finance, not only yield chasing.",
          "Later backend scores can map here directly.",
        ],
        footer: "Fits the verifiable finance track especially well.",
      },
    ],
  },
  watchlist: {
    badge: "Watchlist",
    title: "Protocol Watchlist",
    description:
      "Track pools, protocols, and asset signals before they become the next AI recommendation or automatic optimization trigger.",
    actions: [
      { label: "Browse Opportunities", href: "/opportunities", tone: "primary" },
      { label: "Open Dashboard", href: "/", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Watched Pools", value: "17", helper: "Protocols and positions under observation" },
      { label: "Hot Signals", value: "7", helper: "Momentum crossing the alert threshold", tone: "green" },
      { label: "Idle Candidates", value: "3", helper: "Assets likely to be optimized next", tone: "teal" },
      { label: "Alerts Today", value: "5", helper: "Notifications queued from current watch conditions" },
    ],
    highlight: {
      title: "Protocols Under Watch",
      description:
        "The watchlist becomes the pre-decision layer where the backend can later stream signals into the UI.",
      icon: Star,
      visual: "bars",
      rows: [
        { label: "SaucerSwap", value: "+4.7%", helper: "Momentum still accelerating", tone: "green" },
        { label: "0G Staking Vault", value: "Stable", helper: "Low-risk yield anchor", tone: "teal" },
        { label: "BONZO", value: "Trim", helper: "Exposure threshold approaching", tone: "white" },
        { label: "Stable LP Spread", value: "0.8%", helper: "Within safe trade window", tone: "white" },
      ],
      footer: "A polished watchlist helps explain how the optimizer discovers opportunities before execution.",
    },
    table: {
      title: "Alert Queue",
      subtitle: "Entries for asset alerts, APY movement, and next suggested action.",
      columns: ["Protocol", "Signal", "Action", "Priority"],
      rows: [
        { cells: ["SaucerSwap LP", "Yield up +4.7%", "Move idle USDC", "High"], badge: "new" },
        { cells: ["0G Vault", "Steady low-risk APY", "Maintain core hold", "Medium"], badge: "stable" },
        { cells: ["BONZO", "Exposure limit nearing", "Trim size", "High"], badge: "alert" },
        { cells: ["SAUCE Pool", "Volume rising", "Monitor depth", "Medium"], badge: "watch" },
      ],
      footnote: "Backend can later push watch alerts here from scheduled scanners or streaming pipelines.",
    },
    sideCards: [
      {
        title: "AI Watch Conditions",
        icon: ScanEye,
        accent: "teal",
        items: [
          { label: "Yield Delta", value: "Alert above +3.0% shift", tone: "teal" },
          { label: "Liquidity Guard", value: "Reject thin pools automatically", tone: "green" },
          { label: "Proof Preference", value: "Prioritize traceable destinations", tone: "white" },
        ],
        footer: "This explains the discovery layer in a way judges can quickly grasp.",
      },
      {
        title: "Quick Actions",
        icon: Sparkles,
        accent: "green",
        items: [
          { label: "Promote to Opportunity", value: "1 click once threshold is met", tone: "green" },
          { label: "Send to Agent", value: "Ready for manual execution", tone: "teal" },
          { label: "Archive Signal", value: "Keep the list clean for demos", tone: "white" },
        ],
        footer: "A useful place later for interactive backend-connected controls.",
        cta: { label: "Open Agent", href: "/agent", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "0G Feed Sync",
        icon: Database,
        points: [
          "Watch states are natural candidates for 0G Storage persistence.",
          "Signal history can later be replayed for model review.",
          "The frontend already leaves room for timestamps and CIDs.",
        ],
        footer: "Supports the long-memory story around future agent workflows.",
      },
      {
        title: "Top Movers",
        icon: CandlestickChart,
        points: [
          "SaucerSwap remains the strongest near-term route.",
          "0G staking acts as the stable ecosystem anchor.",
          "BONZO keeps showing reasons for cautious rebalancing.",
        ],
        footer: "Simple, readable, and good enough for the hackathon stage.",
      },
      {
        title: "Review Checklist",
        icon: NotebookTabs,
        points: [
          "Check alerts with the strongest APY movement.",
          "Send one route to Opportunities or Agent.",
          "Show how watch data supports smarter execution later.",
        ],
        footer: "Makes the watchlist feel like part of a real workflow.",
      },
    ],
  },
  settings: {
    badge: "Settings",
    title: "Workspace Settings",
    description:
      "Configure risk, notifications, explorer preferences, and autonomous execution boundaries for the current workspace.",
    actions: [
      { label: "Open AI Agent", href: "/agent", tone: "primary" },
      { label: "Back to Dashboard", href: "/", tone: "secondary" },
    ],
    heroMetrics: [
      { label: "Risk Profile", value: "Moderate", helper: "Current global execution posture" },
      { label: "Notification Rules", value: "8", helper: "Alert and proof update conditions", tone: "teal" },
      { label: "Explorer Default", value: "0G Newton", helper: "Primary verification surface", tone: "green" },
      { label: "Agent Mode", value: "Autonomous", helper: "Manual override still available" },
    ],
    highlight: {
      title: "Workspace Preferences",
      description:
        "Settings already look product-ready now, while remaining simple to bind to backend config later.",
      icon: Settings2,
      visual: "ring",
      rows: [
        { label: "Max Slippage", value: "0.8%", helper: "Hard cap for auto execution", tone: "green" },
        { label: "Proof Retention", value: "30 days", helper: "Demo-friendly storage window", tone: "teal" },
        { label: "Auto-Execute", value: "Enabled", helper: "For moderate and lower risk routes", tone: "white" },
        { label: "Notification Mode", value: "Realtime", helper: "Execution + proof updates", tone: "white" },
      ],
      footer: "A backend config service can later populate and persist these controls directly.",
    },
    table: {
      title: "Notification & Proof Rules",
      subtitle: "Settings matrix for the current workspace version.",
      columns: ["Rule", "Scope", "Current", "Effect"],
      rows: [
        { cells: ["Execution Complete", "Global", "Enabled", "Push update"], badge: "active" },
        { cells: ["High Slippage", "Trade", "Enabled", "Block run"], badge: "guard" },
        { cells: ["Proof Stored", "History", "Enabled", "Show CID"], badge: "active" },
        { cells: ["Volatility Spike", "Watchlist", "Enabled", "Alert only"], badge: "watch" },
      ],
      footnote: "Ready for real settings objects with persisted backend state.",
    },
    sideCards: [
      {
        title: "Security Controls",
        icon: ShieldCheck,
        accent: "green",
        items: [
          { label: "Wallet Access", value: "Read-only until execution confirmation", tone: "green" },
          { label: "Proof Visibility", value: "Always show explorer references", tone: "teal" },
          { label: "Manual Override", value: "Enabled for reviewer demo safety", tone: "white" },
        ],
        footer: "Important because settings is where trust and control become visible.",
      },
      {
        title: "Reviewer Demo Mode",
        icon: BellRing,
        accent: "teal",
        items: [
          { label: "Sample Notifications", value: "Enabled for walkthrough clarity", tone: "teal" },
          { label: "Explorer Shortcut", value: "Pinned to 0G Newton", tone: "green" },
          { label: "Auto Prefill", value: "Latest values on every route", tone: "white" },
        ],
        footer: "Lets this page stay useful now, not only after backend ships.",
        cta: { label: "Open History", href: "/history", tone: "secondary" },
      },
    ],
    bottomCards: [
      {
        title: "Connected Services",
        icon: Blocks,
        points: [
          "0G Storage is the primary persistence target.",
          "0G Explorer stays the default proof destination.",
          "AI agent execution remains the core action surface.",
        ],
        footer: "Great place later for environment and connector status.",
      },
      {
        title: "Execution Boundaries",
        icon: Shield,
        points: [
          "Only moderate or lower risk routes should auto-execute.",
          "Slippage and proof requirements stay non-negotiable.",
          "Users can still intervene before live settlement.",
        ],
        footer: "Makes the product feel safer and more mature.",
      },
      {
        title: "Team Notes",
        icon: NotebookTabs,
        points: [
          "This page is backend-connected and persistence-ready.",
          "Controls are intentionally visible for hackathon review.",
          "Future persistence can map one-to-one to current UI cards.",
        ],
        footer: "A practical staging ground before wiring real backend config.",
      },
    ],
  },
};
