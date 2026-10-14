"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { AgentSettleLogo } from "./icons";

const NAV_ITEMS = [
  { href: "/", label: "Marketplace" },
  { href: "/tasks/create", label: "Create Task" },
  { href: "/agents", label: "Agent Ledger" },
  { href: "/protocol", label: "Protocol Spec" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#292d30] bg-black/90 backdrop-blur-[25px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Left: Brand Logo & Name */}
        <div className="flex items-center justify-start">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-[6px] bg-black border border-[#292d30] flex items-center justify-center text-[#9281f7] group-hover:border-[#9281f7] transition-colors">
              <AgentSettleLogo className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight text-white">
              AgentSettle
            </span>
          </Link>
        </div>

        {/* Center: Symmetrically Centered Navigation Menu */}
        <nav className="hidden md:flex items-center justify-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#0b0e14] text-white border border-[#292d30]"
                    : "text-[#a1a4a5] hover:text-white hover:bg-[#0b0e14]/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Double-line Network Status & Wallet */}
        <div className="flex items-center justify-end gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#0b0e14] border border-[#292d30] font-mono flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389] flex-shrink-0 animate-pulse" />
            <div className="flex flex-col text-left leading-none space-y-0.5">
              <span className="text-[10px] text-[#f0f0f0] font-medium tracking-tight">Chain 61999</span>
              <span className="text-[9px] text-[#a1a4a5]">Studionet</span>
            </div>
          </div>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}

export { AppHeader };
