import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YieldBoost AI Developer Portal",
  description:
    "Developer docs and founder console for YieldBoost AI Protocol, TITAN X, and the live verification surfaces.",
  metadataBase: new URL("https://dev.yieldboostai.xyz"),
  alternates: {
    canonical: "https://dev.yieldboostai.xyz",
  },
  openGraph: {
    title: "YieldBoost AI Developer Portal",
    description:
      "Developer docs and founder console for YieldBoost AI Protocol, TITAN X, and the live verification surfaces.",
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
