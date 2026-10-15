import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../lib/use-wallet";
import { AppHeader } from "../components/app-header";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentsettle.vercel.app"),
  title: "AgentSettle | Autonomous Agentic Commerce SLA & Dispute Protocol",
  description:
    "Machine-verifiable task agreements with natural language SLAs, double-sided collateral, and Equivalence Principle AI Magistrate dispute arbitration on GenLayer.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AgentSettle | Autonomous Agentic Commerce SLA & Dispute Protocol",
    description:
      "Machine-verifiable task agreements with natural language SLAs, double-sided collateral, and Equivalence Principle AI Magistrate dispute arbitration on GenLayer.",
    siteName: "AgentSettle",
    images: [
      {
        url: "/logo-banner-1200x630.png",
        width: 1200,
        height: 630,
        alt: "AgentSettle Protocol Logo Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentSettle | Autonomous Agentic Commerce SLA & Dispute Protocol",
    description:
      "Machine-verifiable task agreements with natural language SLAs, double-sided collateral, and Equivalence Principle AI Magistrate dispute arbitration on GenLayer.",
    images: ["/logo-banner-1200x630.png"],
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-[#f0f0f0] flex flex-col antialiased">
        <WalletProvider>
          <AppHeader />
          <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {children}
          </main>
          <footer className="border-t border-[#292d30] bg-black py-8 text-xs text-[#a1a4a5] font-mono">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[#ffffff]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389] animate-pulse" />
                <span className="font-semibold text-white">AgentSettle v1.2.0</span>
                <span className="text-[#464a4d]">/</span>
                <span className="text-[#a1a4a5]">GenLayer Studionet (61999)</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[#7c7c7c]">
                <span>Contract:</span>
                <a
                  href="https://genlayer-explorer.vercel.app/address/0x2E479f3E98cDd6B6cF32bE3E563207Fa90578642"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9281f7] hover:text-[#b4a7fa] transition-colors underline underline-offset-2"
                >
                  0x2E47...8642
                </a>
                <span className="text-[#464a4d]">/</span>
                <span>Equivalence Principle Consensus</span>
              </div>
              <div className="text-white font-medium tracking-wide">
                &copy; 2026 AGENTSETTLE &middot; BUILT BY{" "}
                <span className="text-[#9281f7] font-semibold underline underline-offset-2">
                  9YTSHADE
                </span>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
