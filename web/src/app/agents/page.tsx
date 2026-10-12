"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "../../lib/use-wallet";
import { fetchAgentProfile } from "../../lib/genlayer";
import { formatAddress, formatGen } from "../../lib/safety";
import type { AgentProfileRecord } from "../../types/agentsettle";
import { BotIcon, ShieldIcon, ScaleIcon, CheckCircleIcon } from "../../components/icons";

export default function AgentLedgerPage() {
  const { account, isConnected } = useWallet();
  const [searchAddr, setSearchAddr] = useState("");
  const [profile, setProfile] = useState<AgentProfileRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const score = profile?.reliability_score ?? 80;
  let tierLabel = "Certified Agent";
  let tierColor = "text-emerald-400 border-emerald-800 bg-emerald-950/60";

  if (score >= 90) {
    tierLabel = "Tier 1 Sovereign Agent";
    tierColor = "text-emerald-400 border-emerald-800 bg-emerald-950/80";
  } else if (score >= 70) {
    tierLabel = "Standard Reliable Agent";
    tierColor = "text-blue-400 border-blue-800 bg-blue-950/80";
  } else {
    tierLabel = "Probation / Slashed Risk";
    tierColor = "text-amber-400 border-amber-800 bg-amber-950/80";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
          Agent Reliability Ledger
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Machine-verifiable on-chain reputation metrics, completed tasks, and dispute performance across GenLayer agentic commerce.
        </p>
      </div>

      {/* Address Query Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="0x... Enter Agent Address"
          value={searchAddr}
          onChange={(e) => setSearchAddr(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-600"
        />
        <button
          onClick={() => void loadProfile(searchAddr)}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Lookup Agent"}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>
      )}

      {profile && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center">
                <BotIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-xs sm:text-sm text-zinc-200 font-semibold block truncate max-w-xs sm:max-w-md">
                  {profile.address}
                </span>
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tierColor}`}>
                  {tierLabel}
                </span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                Reliability Score
              </span>
              <span className="text-3xl font-extrabold font-mono text-emerald-400">
                {profile.reliability_score}
                <span className="text-xs text-zinc-500 font-normal"> / 100</span>
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Tasks Created</span>
              <span className="text-xl font-bold font-mono text-zinc-100 mt-1 block">
                {profile.tasks_created}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Completed</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {profile.tasks_completed}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Disputes Won</span>
              <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                {profile.disputes_won}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Disputes Lost</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                {profile.disputes_lost}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Cumulative Slashed Bonds Restitution:</span>
            <span className="text-rose-400 font-semibold">{formatGen(profile.slashed_bonds)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
