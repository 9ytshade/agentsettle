"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { ThemeToggle } from "./theme-toggle";
import { ScaleIcon, BotIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/", label: "Marketplace" },
  { href: "/tasks/create", label: "Create Task" },
  { href: "/agents", label: "Agent Ledger" },
  { href: "/protocol", label: "Protocol Spec" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/30 group-hover:scale-105 transition-transform">
              <ScaleIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-100 flex items-center gap-1.5">
                AgentSettle
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
                  v1.0
                </span>
              </span>
              <p className="text-[10px] text-zinc-400 font-mono tracking-tight -mt-0.5">
                Autonomous SLA & Dispute Protocol
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            GenLayer Studionet (61999)
          </div>
          <ThemeToggle />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
