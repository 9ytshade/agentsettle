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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#292d30] bg-[#0b0e14] text-xs text-[#a1a4a5] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9281f7] animate-ping" />
        Syncing account...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => void connect()}
        disabled={isConnecting}
        className="px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isConnecting ? "Connecting..." : "Connect Agent Wallet"}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => void switchNetwork()}
        className="px-3 py-1.5 rounded-[6px] border border-[#ffca16] bg-[#0b0e14] text-[#ffca16] text-xs font-mono font-medium hover:bg-[#ffca16]/10 transition-colors"
      >
        Switch to Studionet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] border border-[#292d30] bg-[#0b0e14] hover:border-[#6e727a] text-xs text-[#f0f0f0] transition-colors font-mono"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389]" />
        <span className="text-[#9281f7]">{formatAddress(account)}</span>
        <span className="text-[#6e727a]">|</span>
        <span className="text-[#a1a4a5]">{balance}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-[16px] border border-[#292d30] bg-[#000000f2] backdrop-blur-[25px] p-2 z-50 text-xs">
          <div className="px-3 py-2 border-b border-[#292d30] mb-1">
            <p className="text-[10px] text-[#6e727a] uppercase tracking-wider font-mono">Connected Account</p>
            <p className="font-mono text-[#9281f7] truncate mt-0.5">{account}</p>
            <p className="text-[#f0f0f0] font-mono text-xs mt-1">{balance}</p>
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              void changeAccount();
            }}
            className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-[#0b0e14] text-[#f0f0f0] hover:text-white transition-colors"
          >
            Switch Account
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              void disconnect();
            }}
            className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-[#ff9592]/10 text-[#ff9592] transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
