import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YieldBoost AI Developer Portal",
  description:
    "Developer docs and founder console for the YieldBoost AI Integrity API and the live 10-layer TITAN PROTOCOL stack.",
  metadataBase: new URL("https://dev.yieldboostai.xyz"),
  alternates: {
    canonical: "https://dev.yieldboostai.xyz",
  },
  openGraph: {
    title: "YieldBoost AI Developer Portal",
    description:
      "Developer docs and founder console for the YieldBoost AI Integrity API and the live 10-layer TITAN PROTOCOL stack.",
    url: "https://dev.yieldboostai.xyz",
    siteName: "YieldBoost AI Developer Portal",
    type: "website",
  },
};

export default function DeveloperPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen">{children}</div>;
}
