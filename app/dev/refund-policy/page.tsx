import DevSimpleInfoView from "@/components/dev/DevSimpleInfoView";

export default function DeveloperRefundPolicyPage() {
  return (
    <DevSimpleInfoView
      eyebrow="Refund Policy"
      title="Straightforward policy for package activation and developer access."
      description="This page explains how YieldBoost AI Protocol handles plan activation, billing posture, and refund expectations for the developer store."
      sections={[
        {
          title: "Store purchases",
          body: "Developer packages are activated after wallet verification and successful checkout recording. Because access is provisioned digitally and scoped immediately, completed package activations are generally treated as non-returnable service purchases.",
        },
        {
          title: "Failed activation cases",
          body: "If a checkout is signed but the activation path fails because of a platform-side issue, the correct next step is support review, re-issuance, or manual correction rather than silent loss of access.",
        },
        {
          title: "Free and demo surfaces",
          body: "The free package, the 1-Click showcase, the audit console, the vault challenge, and the faucet flow are demonstration surfaces. They do not carry refund eligibility because they are not subscription purchases.",
        },
        {
          title: "Support path",
          body: "If a team believes a package was activated incorrectly, the support review should include wallet address, package name, transaction hash, and any related integrity hash or checkout record so the issue can be reconciled quickly.",
        },
      ]}
    />
  );
}
