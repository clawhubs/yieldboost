import DevSimpleInfoView from "@/components/dev/DevSimpleInfoView";

export default function DeveloperAboutPage() {
  return (
    <DevSimpleInfoView
      eyebrow="About YieldBoost AI Protocol"
      title="Built as a commercial trust layer for secure Web3 AI products."
      description="YieldBoost AI is the company. YieldBoost AI Protocol is the platform. TITAN X is the flagship full-stack product sold through the store."
      sections={[
        {
          title: "What the company sells",
          body: "YieldBoost AI sells modular trust infrastructure: the TITAN X full 10-layer API, anti-sybil controls, fortress modules, partner wrappers, and the supporting verification surfaces that make those claims reviewable.",
        },
        {
          title: "Why the store matters",
          body: "The store is the commercial front door. It turns the protocol into something buyers can price, evaluate, package, and integrate without reverse-engineering one showcase app.",
        },
        {
          title: "Why TITAN X exists",
          body: "TITAN X is the flagship full-stack product. It packages the 10-layer path into one product-grade endpoint for teams that want the whole integrity engine instead of assembling layers one by one.",
        },
        {
          title: "Why the proof surfaces remain visible",
          body: "The 1-Click App, audit console, vault, and faucet stay visible because enterprise buyers adopt faster when the protocol is demonstrated under live conditions instead of only described in slides.",
        },
      ]}
    />
  );
}
