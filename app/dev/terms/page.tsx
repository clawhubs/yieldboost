import DevSimpleInfoView from "@/components/dev/DevSimpleInfoView";

export default function DeveloperTermsPage() {
  return (
    <DevSimpleInfoView
      eyebrow="Terms of Service"
      title="Use the store, keys, and proof surfaces with clear operational boundaries."
      description="These terms summarize how YieldBoost AI Protocol is intended to be used across the store, SDK access, verification surfaces, and wallet-bound product flows."
      sections={[
        {
          title: "Developer responsibility",
          body: "Each managed API key represents one developer app or integration context. Teams are responsible for keeping raw keys in a secret manager and for revoking and reissuing keys when compromise is suspected.",
        },
        {
          title: "Wallet-bound actions",
          body: "Store activation, integrity ownership, and certain proof paths are intentionally wallet-bound. A team should not assume that a reused transaction or third-party wallet can impersonate another owner inside the platform.",
        },
        {
          title: "Public demonstration surfaces",
          body: "The 1-Click App, audit console, vault challenge, and faucet flow are live product surfaces. They exist to demonstrate and stress protocol behavior, but they should not be misrepresented as custom legal commitments outside the store packages themselves.",
        },
        {
          title: "Service posture",
          body: "YieldBoost AI Protocol is sold as technical infrastructure. Availability, package scope, and proof visibility may evolve as the platform expands, but the operational goal remains stable: secure, proof-backed Web3 AI system infrastructure.",
        },
      ]}
    />
  );
}
