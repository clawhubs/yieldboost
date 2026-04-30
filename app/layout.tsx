import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Barlow_Condensed } from "next/font/google";
import { AppDataProvider } from "@/components/providers/AppDataProvider";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const condensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yieldboost-ai.vercel.app"),
  title: "YieldBoost AI",
  description: "Mainnet-first verifiable AI yield optimization on 0G, with judge-friendly proof review and Agent NFT minting.",
  icons: {
    icon: "/ya-icon.png",
    shortcut: "/ya-icon.png",
    apple: "/ya-icon.png",
  },
  openGraph: {
    title: "YieldBoost AI",
    description: "Mainnet-first verifiable AI yield optimization on 0G, with judge-friendly proof review and Agent NFT minting.",
    url: "https://yieldboost-ai.vercel.app",
    siteName: "YieldBoost AI",
    images: [
      {
        url: "/readme/branding/banner.png",
        width: 1817,
        height: 606,
        alt: "YieldBoost AI banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YieldBoost AI",
    description: "Mainnet-first verifiable AI yield optimization on 0G, with judge-friendly proof review and Agent NFT minting.",
    images: ["/readme/branding/banner.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#071017",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${display.variable} ${body.variable} ${condensed.variable} min-h-screen bg-[#030609] font-sans text-[var(--text-primary)] antialiased`}
      >
        <AppDataProvider>
          <div className="ambient-bg" aria-hidden="true" />
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
