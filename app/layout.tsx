import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Barlow_Condensed } from "next/font/google";
import { AppDataProvider } from "@/components/providers/AppDataProvider";
import Sidebar from "@/components/layout/Sidebar";
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
  title: "YiledBoost Ai",
  description: "Autonomous AI-powered DeFi yield optimization dashboard on 0G.",
  icons: {
    icon: "/ya-icon.png",
    shortcut: "/ya-icon.png",
    apple: "/ya-icon.png",
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
    <html lang="en" className="dark">
      <body
        className={`${display.variable} ${body.variable} ${condensed.variable} min-h-screen bg-[#04070a] font-sans text-[var(--text-primary)] antialiased`}
      >
        <AppDataProvider>
          <div className="relative min-h-screen md:flex md:h-screen">
            <Sidebar />
            <main className="relative min-w-0 flex-1 overflow-x-hidden md:h-screen md:overflow-y-auto">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,201,177,0.07),transparent_18%),linear-gradient(180deg,#060b10_0%,#04070a_42%,#04070a_100%)]" />
              {children}
            </main>
          </div>
        </AppDataProvider>
      </body>
    </html>
  );
}
