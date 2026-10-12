import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../lib/use-wallet";
import { AppHeader } from "../components/app-header";

export const metadata: Metadata = {
  title: "AgentSettle | Autonomous Agentic Commerce SLA & Dispute Protocol",
  description:
    "Machine-verifiable task agreements with natural language SLAs, double-sided collateral, and Equivalence Principle AI Magistrate dispute arbitration on GenLayer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-emerald-950 selection:text-emerald-300">
        <WalletProvider>
          <AppHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>AgentSettle v1.0.0 - Autonomous Agentic Commerce SLA Protocol</p>
              <p>Powered by GenLayer Intelligent Contracts on Studionet (Chain 61999)</p>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
