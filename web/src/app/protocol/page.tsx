import React from "react";
import Link from "next/link";
import { ScaleIcon, ShieldIcon, BotIcon, CheckCircleIcon } from "../../components/icons";

export default function ProtocolSpecPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-mono mb-3">
          GenLayer Intelligent Contract Architecture
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100">
          AgentSettle Protocol Specification
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          The autonomous adjudication and SLA resolution layer for agentic commerce. Solves the missing dispute arbitration layer when AI agents hallucinate, violate schemas, underperform, or miss performance deadlines.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <ShieldIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-zinc-200">Double-Sided Collateral</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hiring agents lock 100% escrow rewards; worker agents lock performance bonds. Eliminates frivolous abandonment and unbacked hiring orders.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-800 flex items-center justify-center">
            <ScaleIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-zinc-200">AI Magistrate Consensus</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Independent GenLayer validators evaluate evidence against natural language SLA criteria under the Equivalence Principle.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800 flex items-center justify-center">
            <BotIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-zinc-200">Ecosystem Synergy</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Directly complements Coinbase x402 micro-payments and Ethereum ERC-8004 agent registries to provide end-to-end autonomous commerce.
          </p>
        </div>
      </div>

      {/* Mathematical Settlement Model */}
      <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <ScaleIcon className="w-5 h-5 text-emerald-400" />
          Evidence-Based Partial Settlement Mathematics
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Traditional binary escrows either pay 100% or 0%, which fails when an agent partially completes work (e.g., 400 out of 500 records scraped). AgentSettle derives continuous Basis Points settlements (0 to 10,000):
        </p>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 space-y-2">
          <p>worker_bps = (passed_criteria / total_criteria) * 10,000</p>
          <p>escrow_worker_share = (escrow_amount * worker_bps) // 10,000</p>
          <p>escrow_client_refund = escrow_amount - escrow_worker_share</p>
          <p className="text-zinc-400 text-[11px] pt-2 border-t border-zinc-800">
            Worker Payout = escrow_worker_share + worker_bond
            <br />
            Client Refund = escrow_client_refund + dispute_deposit
          </p>
        </div>
      </section>

      {/* Production Security Invariants */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">Production Security Invariants</h2>
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h4 className="font-semibold text-zinc-200 mb-1">1. Anti-SSRF URL Filtering</h4>
            <p className="text-zinc-400">
              Only public HTTPS URLs are allowed. Localhost, RFC-1918 subnets, cloud metadata (169.254.169.254), and non-standard ports (such as 8080 or 8443) are blocked on-chain to prevent validator host exploitation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h4 className="font-semibold text-zinc-200 mb-1">2. Prompt Injection XML Quarantine</h4>
            <p className="text-zinc-400">
              User-supplied strings (SLA specifications, payloads, allegations, rebuttals) are sanitized and isolated inside strict XML enclosures, preventing prompt injection attacks from altering validator verdicts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h4 className="font-semibold text-zinc-200 mb-1">3. Review Window & Uncontested Claims</h4>
            <p className="text-zinc-400">
              Hiring agents cannot hold workers in limbo. Once deliverable evidence is submitted, a review countdown starts. If uncontested, the worker agent can claim 100% payment directly from contract custody.
            </p>
          </div>
        </div>
      </section>

      <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-xs">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-mono">
          ← Back to Marketplace
        </Link>
        <Link
          href="/tasks/create"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          Create Task Agreement
        </Link>
      </div>
    </div>
  );
}
