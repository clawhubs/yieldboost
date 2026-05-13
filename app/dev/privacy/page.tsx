import DevSimpleInfoView from "@/components/dev/DevSimpleInfoView";

export default function DeveloperPrivacyPage() {
  return (
    <DevSimpleInfoView
      eyebrow="Privacy Policy"
      title="Minimal collection, wallet-first identity, and proof-visible operations."
      description="YieldBoost AI Protocol is designed around wallet-based access and proof-backed infrastructure rather than broad personal profile collection."
      sections={[
        {
          title: "Portal identity",
          body: "The developer portal identifies accounts through wallet authentication rather than email-first signup. The wallet used for login becomes the basis for role resolution and dashboard access.",
        },
        {
          title: "API usage data",
          body: "The platform records operational data such as request paths, timestamps, latency, and package-scoped usage so teams can manage keys, quotas, and security posture. This is infrastructure telemetry, not a consumer ad profile.",
        },
        {
          title: "Integrity records",
          body: "Public product surfaces expose proof-oriented metadata and verification records, but they are designed to avoid leaking raw secret payload contents through normal metadata responses.",
        },
        {
          title: "Security and retention",
          body: "Managed API keys are stored as hashed representations after issuance. If a raw key is lost, the correct recovery path is revocation and reissuance rather than server-side revelation of the original secret.",
        },
      ]}
    />
  );
}
