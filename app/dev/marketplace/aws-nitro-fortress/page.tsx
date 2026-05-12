import type { Metadata } from "next";

import NitroFortressPlayground from "@/components/marketplace/NitroFortressPlayground";

export const metadata: Metadata = {
  title: "AWS Nitro Fortress SDK - YieldBoost Developer Portal",
  description:
    "Playground for the AWS Nitro Fortress SDK: Nitro enclave framing, 0G TEE badge evidence, and 0G Storage incident memory.",
};

export default function AwsNitroFortressPlaygroundPage() {
  return <NitroFortressPlayground />;
}
