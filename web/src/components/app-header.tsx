"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { ScaleIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/", label: "Marketplace" },
  { href: "/tasks/create", label: "Create Task" },
  { href: "/agents", label: "Agent Ledger" },
  { href: "/protocol", label: "Protocol Spec" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#292d30] bg-black/90 backdrop-blur-[25px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Left: Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group z-10 flex-shrink-0">
          <div className="w-8 h-8 rounded-[6px] bg-black border border-[#292d30] flex items-center justify-center text-[#9281f7] group-hover:border-[#9281f7] transition-colors">
            <ScaleIcon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            AgentSettle
          </span>
        </Link>

        {/* Center: Symmetrically Centered Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 pointer-events-auto">
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

        {/* Right: Network Status & Wallet (Sized & Responsive to prevent overlap) */}
        <div className="flex items-center gap-2.5 z-10 flex-shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#0b0e14] border border-[#292d30] text-[11px] text-[#a1a4a5] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389]" />
            <span className="hidden xl:inline">Chain 61999 (Studionet)</span>
            <span className="xl:hidden">Studionet</span>
          </div>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
