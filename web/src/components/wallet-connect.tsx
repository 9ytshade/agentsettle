"use client";

import React, { useState } from "react";
import { useWallet } from "../lib/use-wallet";

export function WalletConnect() {
  const {
    account,
    balance,
    isConnected,
    isConnecting,
    wrongNetwork,
    reloading,
    connect,
    disconnect,
    changeAccount,
    switchNetwork,
    formatAddress,
  } = useWallet();

  const [menuOpen, setMenuOpen] = useState(false);

  if (reloading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs text-zinc-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Syncing account...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => void connect()}
        disabled={isConnecting}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-sm hover:shadow-emerald-900/20 disabled:opacity-50"
      >
        {isConnecting ? "Connecting..." : "Connect Agent Wallet"}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => void switchNetwork()}
        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold animate-pulse"
      >
        Switch to Studionet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/80 hover:bg-zinc-800 text-xs text-zinc-200 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="font-mono">{formatAddress(account)}</span>
        <span className="text-zinc-500 font-mono">| {balance}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-xl p-1 z-50 text-xs">
          <div className="px-3 py-2 border-b border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Connected Account</p>
            <p className="font-mono text-zinc-200 truncate mt-0.5">{account}</p>
            <p className="text-emerald-400 font-medium mt-1">{balance}</p>
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              void changeAccount();
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            Switch Account
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              void disconnect();
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
