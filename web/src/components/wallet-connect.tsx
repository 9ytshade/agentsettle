"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "../lib/use-wallet";
import { formatCompactGen, formatCommaGen } from "../lib/safety";
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  RefreshIcon,
  LogoutIcon,
  BotIcon,
} from "./icons";

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
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopy = () => {
    if (!account) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (reloading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#292d30] bg-[#0b0e14] text-xs text-[#a1a4a5] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9281f7] animate-ping" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => void connect()}
        disabled={isConnecting}
        className="px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isConnecting ? "Connecting..." : "Connect Agent Wallet"}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => void switchNetwork()}
        className="px-3 py-1.5 rounded-[6px] border border-[#ffca16] bg-[#0b0e14] text-[#ffca16] text-xs font-mono font-medium hover:bg-[#ffca16]/10 transition-colors cursor-pointer"
      >
        Switch to Studionet
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button with Compact Balance */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#292d30] bg-[#0b0e14] hover:border-[#6e727a] text-xs text-[#f0f0f0] transition-colors font-mono max-w-[240px] cursor-pointer"
        title={`${account} | ${balance}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389] flex-shrink-0" />
        <span className="text-[#9281f7] flex-shrink-0">{formatAddress(account)}</span>
        <span className="text-[#464a4d] flex-shrink-0">|</span>
        <span className="text-[#a1a4a5] truncate max-w-[85px]">{formatCompactGen(balance)}</span>
        <svg
          className={`w-3 h-3 text-[#6e727a] transition-transform duration-150 flex-shrink-0 ${
            menuOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Elevated Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-84 rounded-[16px] border border-[#292d30] bg-[#0b0e14] shadow-2xl p-4 z-50 text-xs space-y-4 animate-fade-in">
          {/* Top Network Status */}
          <div className="flex items-center justify-between pb-3 border-b border-[#292d30]">
            <span className="text-[10px] text-[#6e727a] uppercase tracking-wider font-mono">
              Agent Identity
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-black border border-[#292d30] text-[10px] font-mono text-[#3ad389]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389] animate-pulse" />
              <span>Studionet (61999)</span>
            </div>
          </div>

          {/* Account Card */}
          <div className="p-3.5 rounded-[10px] bg-black border border-[#292d30] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6e727a] uppercase tracking-wider font-mono">
                Connected Address
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-mono text-[#9281f7] hover:text-[#baa7ff] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-3 h-3 text-[#3ad389]" />
                    <span className="text-[#3ad389]">Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-[#f0f0f0] text-xs break-all leading-relaxed select-all">
              {account}
            </p>
            <div className="pt-1 flex items-center justify-end">
              <a
                href={`https://genlayer-explorer.vercel.app/address/${account}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-[#6e727a] hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Treasury Balance Card */}
          <div className="p-3.5 rounded-[10px] bg-black border border-[#292d30] space-y-1">
            <span className="text-[10px] text-[#6e727a] uppercase tracking-wider font-mono block">
              Treasury Balance
            </span>
            <p className="text-sm font-medium font-mono text-white break-words">
              {formatCommaGen(balance)}
            </p>
            <p className="text-[11px] font-mono text-[#9281f7]">
              Compact: {formatCompactGen(balance)}
            </p>
          </div>

          {/* Action List */}
          <div className="space-y-1 pt-1 border-t border-[#292d30]">
            <Link
              href="/agents"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-black text-[#f0f0f0] hover:text-white text-xs font-mono transition-colors"
            >
              <BotIcon className="w-4 h-4 text-[#9281f7]" />
              <div className="flex-1">
                <span>View in Agent Ledger</span>
              </div>
            </Link>

            <button
              onClick={() => {
                setMenuOpen(false);
                void changeAccount();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-black text-[#f0f0f0] hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              <RefreshIcon className="w-4 h-4 text-[#70b8ff]" />
              <div className="flex-1 text-left">
                <span>Switch Account</span>
              </div>
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                void disconnect();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#ff9592]/10 text-[#ff9592] text-xs font-mono transition-colors cursor-pointer"
            >
              <LogoutIcon className="w-4 h-4 text-[#ff9592]" />
              <div className="flex-1 text-left">
                <span>Disconnect Wallet</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
