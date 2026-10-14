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
          <footer className="border-t border-[#292d30] bg-black py-8 text-center text-xs text-[#a1a4a5] font-mono">
            <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[#a1a4a5]">
                AgentSettle v1.0.0 <span className="text-[#464a4d]">/</span> Autonomous Agentic Commerce SLA Protocol
              </p>
              <p className="text-[#6e727a]">
                Powered by GenLayer Intelligent Contracts on Studionet (Chain 61999)
              </p>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
