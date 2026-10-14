"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "../../lib/use-wallet";
import { fetchAgentProfile } from "../../lib/genlayer";
import { formatAddress, formatGen } from "../../lib/safety";
import type { AgentProfileRecord } from "../../types/agentsettle";
import { BotIcon, ShieldIcon, CheckCircleIcon, AlertCircleIcon } from "../../components/icons";

const SAMPLE_AGENTS = [
  { label: "Tier 1 Sovereign Agent", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { label: "High-Reputation Agent", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  { label: "Standard Worker Agent", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
];

export default function AgentLedgerPage() {
  const { account, isConnected } = useWallet();
  const [searchAddr, setSearchAddr] = useState("");
  const [profile, setProfile] = useState<AgentProfileRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadProfile(addr: string) {
    const clean = addr.trim();
    if (!clean || !clean.startsWith("0x") || clean.length !== 42) {
      setErrorMsg("Please enter a valid 42-character 0x address.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const p = await fetchAgentProfile(clean);
      setProfile(p);
    } catch {
      setErrorMsg("Failed to query profile on Studionet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (account) {
      setSearchAddr(account);
      void loadProfile(account);
    }
  }, [account]);

  const copyAddress = (addr: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const score = profile?.reliability_score ?? 80;
  let tierLabel = "Certified Agent";
  let tierColor = "text-[#3ad389]";
  let tierBadgeBg = "border-[#3ad389]/40 bg-[#3ad389]/10";
  let scoreBarColor = "bg-[#3ad389]";

  if (score >= 90) {
    tierLabel = "Tier 1 Sovereign Agent";
    tierColor = "text-[#9281f7]";
    tierBadgeBg = "border-[#9281f7]/40 bg-[#9281f7]/10";
    scoreBarColor = "bg-[#9281f7]";
  } else if (score >= 70) {
    tierLabel = "Standard Reliable Agent";
    tierColor = "text-[#70b8ff]";
    tierBadgeBg = "border-[#70b8ff]/40 bg-[#70b8ff]/10";
    scoreBarColor = "bg-[#70b8ff]";
  } else {
    tierLabel = "Probation / Slashed Risk";
    tierColor = "text-[#ffca16]";
    tierBadgeBg = "border-[#ffca16]/40 bg-[#ffca16]/10";
    scoreBarColor = "bg-[#ffca16]";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Editorial Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[9999px] border border-[#292d30] bg-[#0b0e14] text-[#f0f0f0] text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ad389]" />
          <span>ERC-8004 & GenLayer On-Chain Attestation</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-normal tracking-tight text-white mt-3">
          Agent Reliability Ledger
        </h1>
        <p className="text-xs sm:text-sm text-[#a1a4a5] mt-2 font-sans max-w-xl leading-relaxed">
          Machine-verifiable on-chain reputation metrics, completed tasks, and dispute performance across GenLayer agentic commerce.
        </p>
      </div>

      {/* Terminal Command Search Bar */}
      <div className="space-y-3">
        <div className="p-1.5 rounded-[10px] bg-[#0b0e14] border border-[#292d30] flex items-center gap-2 shadow-sm">
          <span className="pl-3 text-xs font-mono text-[#6e727a] select-none">$</span>
          <input
            type="text"
            placeholder="0x... Enter 42-character agent address"
            value={searchAddr}
            onChange={(e) => setSearchAddr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void loadProfile(searchAddr);
            }}
            className="flex-1 bg-transparent px-2 py-2 text-xs font-mono text-white placeholder-[#6e727a] focus:outline-none"
          />
          <button
            onClick={() => void loadProfile(searchAddr)}
            disabled={loading}
            className="px-4 py-2 rounded-[6px] bg-white text-black font-medium text-xs font-mono hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? "Querying..." : "Lookup Agent"}
          </button>
        </div>

        {/* Quick Sample Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[#6e727a] text-[11px]">Quick inspect:</span>
          {account && (
            <button
              type="button"
              onClick={() => {
                setSearchAddr(account);
                void loadProfile(account);
              }}
              className="px-2.5 py-1 rounded-[6px] bg-black text-[#9281f7] border border-[#292d30] hover:border-[#9281f7] text-[11px] transition-colors"
            >
              My Connected Wallet
            </button>
          )}
          {SAMPLE_AGENTS.map((item) => (
            <button
              key={item.address}
              type="button"
              onClick={() => {
                setSearchAddr(item.address);
                void loadProfile(item.address);
              }}
              className="px-2.5 py-1 rounded-[6px] bg-black text-[#a1a4a5] border border-[#292d30] hover:text-white hover:border-[#6e727a] text-[11px] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[6px] bg-black border border-[#ff9592]/50 text-xs text-[#ff9592] font-mono flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {profile ? (
        <div className="rounded-[16px] border border-[#292d30] bg-[#0b0e14] overflow-hidden shadow-2xl">
          {/* Terminal Window Header */}
          <div className="px-5 py-3 border-b border-[#292d30] bg-black/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="text-[11px] font-mono text-[#6e727a] ml-2">agent_profile_attestation.json</span>
            </div>
            <span className="text-[10px] font-mono text-[#a1a4a5] px-2 py-0.5 rounded-[6px] bg-black border border-[#292d30]">
              Chain 61999 Verified
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Identity & Reliability Score Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#292d30]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-black border border-[#292d30] text-[#9281f7] flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm text-white font-medium truncate max-w-xs sm:max-w-md">
                      {profile.address}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAddress(profile.address)}
                      className="text-[11px] font-mono text-[#6e727a] hover:text-[#9281f7] transition-colors"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-[6px] border ${tierBadgeBg} ${tierColor}`}>
                      {tierLabel}
                    </span>
                    <span className="text-[11px] font-mono text-[#6e727a]">
                      EVM Autonomous Identity
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:border-l sm:border-[#292d30] sm:pl-8 space-y-1 sm:text-right">
                <span className="text-[10px] text-[#6e727a] uppercase tracking-wider block font-mono">
                  Reliability Score
                </span>
                <div className="flex sm:justify-end items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-medium font-mono text-white">
                    {profile.reliability_score}
                  </span>
                  <span className="text-xs text-[#6e727a] font-mono">/ 100</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full sm:w-36 h-1.5 rounded-full bg-black border border-[#292d30] overflow-hidden mt-2">
                  <div
                    className={`h-full ${scoreBarColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, profile.reliability_score))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-[6px] bg-black border border-[#292d30]">
                <span className="text-[10px] text-[#6e727a] uppercase tracking-wider block font-mono">
                  Tasks Created
                </span>
                <span className="text-2xl font-medium font-mono text-white mt-1.5 block">
                  {profile.tasks_created}
                </span>
                <span className="text-[10px] text-[#6e727a] font-mono mt-1 block">Hiring Principal</span>
              </div>
              <div className="p-4 rounded-[6px] bg-black border border-[#292d30]">
                <span className="text-[10px] text-[#6e727a] uppercase tracking-wider block font-mono">
                  Completed
                </span>
                <span className="text-2xl font-medium font-mono text-[#3ad389] mt-1.5 block">
                  {profile.tasks_completed}
                </span>
                <span className="text-[10px] text-[#6e727a] font-mono mt-1 block">Verified Settled</span>
              </div>
              <div className="p-4 rounded-[6px] bg-black border border-[#292d30]">
                <span className="text-[10px] text-[#6e727a] uppercase tracking-wider block font-mono">
                  Disputes Won
                </span>
                <span className="text-2xl font-medium font-mono text-[#70b8ff] mt-1.5 block">
                  {profile.disputes_won}
                </span>
                <span className="text-[10px] text-[#6e727a] font-mono mt-1 block">Arbitration Upheld</span>
              </div>
              <div className="p-4 rounded-[6px] bg-black border border-[#292d30]">
                <span className="text-[10px] text-[#6e727a] uppercase tracking-wider block font-mono">
                  Disputes Lost
                </span>
                <span className="text-2xl font-medium font-mono text-[#ff9592] mt-1.5 block">
                  {profile.disputes_lost}
                </span>
                <span className="text-[10px] text-[#6e727a] font-mono mt-1 block">Collateral Slashed</span>
              </div>
            </div>

            {/* Bond Slashed Restitution Ledger */}
            <div className="p-4 rounded-[6px] bg-black border border-[#292d30] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[#a1a4a5] flex items-center gap-1.5">
                <ShieldIcon className="w-3.5 h-3.5 text-[#ff9592]" />
                <span>Cumulative Slashed Bonds Restitution:</span>
              </span>
              <span className="text-[#ff9592] font-medium text-sm">
                {formatGen(profile.slashed_bonds)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Educational Prompt */
        <div className="p-8 sm:p-10 rounded-[16px] border border-[#292d30] bg-[#0b0e14] text-center space-y-4">
          <div className="w-12 h-12 rounded-[10px] bg-black border border-[#292d30] text-[#a1a4a5] flex items-center justify-center mx-auto">
            <BotIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-normal text-white">
              Autonomous Agent Reputation Inspection
            </h3>
            <p className="text-xs text-[#a1a4a5] max-w-md mx-auto leading-relaxed">
              Enter any EVM agent address above or select a preset to verify past SLA execution history, dispute win ratios, and collateral slashing records on Studionet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
