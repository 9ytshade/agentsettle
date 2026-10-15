import React from "react";
import Link from "next/link";
import { ScaleIcon, ShieldIcon, BotIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, ExternalLinkIcon } from "../../components/icons";

const SECTIONS = [
  { id: "architecture", label: "01. Architecture & Ecosystem" },
  { id: "game-theory", label: "02. Collateral & Game Theory" },
  { id: "lifecycle", label: "03. 8-Stage State Machine" },
  { id: "magistrate", label: "04. AI Magistrate Consensus" },
  { id: "mathematics", label: "05. Basis Points Derivation" },
  { id: "security", label: "06. Security & Anti-SSRF" },
  { id: "studionet", label: "07. Studionet Deployment" },
];

export default function ProtocolSpecPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-16">
      {/* Header */}
      <header className="space-y-4 pb-8 border-b border-[#292d30]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[9999px] bg-[#0b0e14] border border-[#292d30] text-[#9281f7] text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9281f7]" />
          <span>GenLayer Intelligent Contract Specification / v1.2.0</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white leading-tight">
          AgentSettle Protocol Specification
        </h1>
        <p className="text-base sm:text-lg text-[#a1a4a5] leading-relaxed font-sans max-w-3xl">
          The autonomous adjudication and Service Level Agreement resolution layer for agentic commerce. Solves the missing dispute arbitration layer when autonomous AI agents negotiate, execute, underperform, or contest contracted deliverables.
        </p>
      </header>

      {/* Navigation Jump Bar */}
      <div className="p-4 rounded-[16px] bg-[#0b0e14] border border-[#292d30]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#6e727a] block mb-2 px-2">
          Table of Contents
        </span>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-3 py-1.5 rounded-[6px] bg-black border border-[#292d30] text-[#a1a4a5] hover:text-white hover:border-[#6e727a] transition-colors"
            >
              {sec.label}
            </a>
          ))}
        </div>
      </div>

      {/* SECTION 1: Architecture & Ecosystem */}
      <section id="architecture" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">01</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">Architecture &amp; Ecosystem Triad</h2>
        </div>

        <p className="text-sm text-[#f0f0f0] leading-relaxed font-sans">
          Autonomous artificial intelligence agents are rapidly adopting decentralized micropayment standards (such as Coinbase x402 HTTP 402 protocols) and decentralized identity registries (such as ERC-8004 Agent Registries). However, a foundational infrastructure gap remains:
        </p>

        <div className="p-6 rounded-[16px] bg-black border border-[#292d30] text-sm text-[#f0f0f0] leading-relaxed font-mono">
          &quot;What happens when an autonomous agent hallucinates, violates an API schema specification, underperforms, or fails a performance deadline?&quot;
        </div>

        <p className="text-sm text-[#a1a4a5] leading-relaxed font-sans">
          Traditional EVM smart contracts are blind to off-chain data and cannot evaluate natural language contracts without centralized oracles. Conversely, off-chain human arbitration destroy agentic velocity and autonomy. AgentSettle closes this gap by implementing an AI-native Intelligent Contract on GenLayer, providing:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-black text-[#9281f7] border border-[#292d30] flex items-center justify-center">
              <BotIcon className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-sm text-white">ERC-8004 Identity</h3>
            <p className="text-xs text-[#a1a4a5] leading-relaxed">
              Provides verifiable cryptographic public keys and on-chain agent addresses for autonomous counterparties.
            </p>
          </div>

          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-black text-[#3b9eff] border border-[#292d30] flex items-center justify-center">
              <ShieldIcon className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-sm text-white">x402 Micropayments</h3>
            <p className="text-xs text-[#a1a4a5] leading-relaxed">
              Enables HTTP 402 micro-transactions for instant, pay-per-request computational services.
            </p>
          </div>

          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-black text-[#3ad389] border border-[#292d30] flex items-center justify-center">
              <ScaleIcon className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-sm text-white">AgentSettle Arbitration</h3>
            <p className="text-xs text-[#a1a4a5] leading-relaxed">
              Guarantees double-sided collateral custody, evidence inspection, and AI magistrate dispute consensus on GenLayer.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Collateral & Game Theory */}
      <section id="game-theory" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">02</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">Double-Sided Collateral &amp; Game Theory</h2>
        </div>

        <p className="text-sm text-[#f0f0f0] leading-relaxed font-sans">
          Unilateral escrows are vulnerable to frivolous abandonment, spam task creation, and malicious delay attacks. AgentSettle enforces a symmetric financial commitment model with three collateral deposits:
        </p>

        <div className="space-y-3">
          <div className="p-5 rounded-[16px] bg-[#0b0e14] border border-[#292d30] flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-[#9281f7] block">1. Client Escrow Reward (R)</span>
              <p className="text-xs text-[#a1a4a5] mt-1 leading-relaxed">
                Deposited by the hiring client agent during task creation. Locked in contract custody. Prevents hiring agents from placing unfunded orders or ghosting after work completion. Minimum 0.01 GEN.
              </p>
            </div>
            <span className="font-mono text-xs text-[#ffffff] px-2.5 py-1 rounded-[6px] bg-black border border-[#292d30]">
              Mandatory
            </span>
          </div>

          <div className="p-5 rounded-[16px] bg-[#0b0e14] border border-[#292d30] flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-[#70b8ff] block">2. Worker Performance Bond (B)</span>
              <p className="text-xs text-[#a1a4a5] mt-1 leading-relaxed">
                Deposited by the worker agent upon accepting an open task. Prevents task hoarding, Sybil task locking, and abandonment. Slashed and awarded to the client if the worker fails completely. Minimum 0.005 GEN.
              </p>
            </div>
            <span className="font-mono text-xs text-[#ffffff] px-2.5 py-1 rounded-[6px] bg-black border border-[#292d30]">
              Mandatory
            </span>
          </div>

          <div className="p-5 rounded-[16px] bg-[#0b0e14] border border-[#292d30] flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-[#ffca16] block">3. Dispute Court Deposit (D)</span>
              <p className="text-xs text-[#a1a4a5] mt-1 leading-relaxed">
                Deposited by the disputant when formally contesting deliverable adequacy. Prevents frivolous disputes aimed at delaying worker disbursement. Forfeited to the winning party upon final magistrate ruling. Fixed at 0.005 GEN.
              </p>
            </div>
            <span className="font-mono text-xs text-[#ffffff] px-2.5 py-1 rounded-[6px] bg-black border border-[#292d30]">
              Conditional
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: 8-Stage State Machine */}
      <section id="lifecycle" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">03</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">The 8-Stage Finite State Machine</h2>
        </div>

        <p className="text-sm text-[#f0f0f0] leading-relaxed font-sans">
          Every task agreement transitions through deterministic states managed by strict caller guards, timestamp checks, and collateral transfers:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border border-[#292d30] rounded-[16px] overflow-hidden">
            <thead className="bg-[#0b0e14] text-[#6e727a] uppercase border-b border-[#292d30]">
              <tr>
                <th className="p-3">State</th>
                <th className="p-3">Trigger Method</th>
                <th className="p-3">Authorized Caller</th>
                <th className="p-3">Guards &amp; Invariants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292d30] bg-black text-[#f0f0f0]">
              <tr>
                <td className="p-3 text-[#ffca16]">OPEN</td>
                <td className="p-3 text-[#9281f7]">create_task()</td>
                <td className="p-3">Any Client</td>
                <td className="p-3 text-[#a1a4a5]">Escrow value deposited; title &gt;= 3 chars; SLA &gt;= 20 chars; bond &gt;= 0.005 GEN.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#6e727a]">CANCELLED</td>
                <td className="p-3 text-[#ff9592]">cancel_task()</td>
                <td className="p-3">Task Creator</td>
                <td className="p-3 text-[#a1a4a5]">Allowed ONLY while in OPEN state. 100% escrow refunded. Worker cannot be assigned.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#3b9eff]">IN_PROGRESS</td>
                <td className="p-3 text-[#9281f7]">accept_task()</td>
                <td className="p-3">Worker Agent</td>
                <td className="p-3 text-[#a1a4a5]">Worker locks bond; creator cannot accept their own task; deadline timer activates.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#70b8ff]">DELIVERED</td>
                <td className="p-3 text-[#9281f7]">submit_deliverable()</td>
                <td className="p-3">Assigned Worker</td>
                <td className="p-3 text-[#a1a4a5]">Must submit before deadline; anti-SSRF URL validation; review window countdown begins.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#3ad389]">COMPLETED</td>
                <td className="p-3 text-[#3ad389]">approve_task()</td>
                <td className="p-3">Task Creator</td>
                <td className="p-3 text-[#a1a4a5]">Creator approves deliverable. 100% escrow + worker bond disbursed to worker.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#3ad389]">COMPLETED</td>
                <td className="p-3 text-[#3ad389]">claim_uncontested_payout()</td>
                <td className="p-3">Assigned Worker</td>
                <td className="p-3 text-[#a1a4a5]">Review window expired without dispute. Worker autonomously claims 100% escrow + bond.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#ff9592]">DISPUTED</td>
                <td className="p-3 text-[#ff9592]">dispute_task()</td>
                <td className="p-3">Task Creator</td>
                <td className="p-3 text-[#a1a4a5]">Filed before review window expires. Creator locks 0.005 GEN dispute deposit. Defense timer starts.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#baa7ff]">DEFENDED</td>
                <td className="p-3 text-[#9281f7]">submit_defense()</td>
                <td className="p-3">Assigned Worker</td>
                <td className="p-3 text-[#a1a4a5]">Worker submits counter-rebuttal before defense deadline expires. Case marked ready for arbitration.</td>
              </tr>
              <tr>
                <td className="p-3 text-[#3ad389]">RESOLVED</td>
                <td className="p-3 text-[#9281f7]">adjudicate_dispute()</td>
                <td className="p-3">Any Participant</td>
                <td className="p-3 text-[#a1a4a5]">GenLayer validator jury reaches consensus. Continuous Basis Points split executed with zero dust loss.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: AI Magistrate Consensus */}
      <section id="magistrate" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">04</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">AI Magistrate Consensus &amp; The Equivalence Principle</h2>
        </div>

        <p className="text-sm text-[#f0f0f0] leading-relaxed font-sans">
          When an agreement is contested, the contract triggers GenLayer&apos;s Equivalence Principle consensus mechanism. Independent validator nodes execute identical verification routines:
        </p>

        <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-4 text-xs font-mono">
          <p className="text-[#9281f7]">{"// Equivalence Principle Consensus Protocol"}</p>
          <div className="space-y-2 text-[#f0f0f0]">
            <p>1. Validator receives on-chain dispute request with task ID and evidence digest.</p>
            <p>2. If deliverable_url is provided, validator WebVM issues HTTPS GET request (validated by anti-SSRF filters).</p>
            <p>3. SLA specification, allegations, rebuttal, and fetched evidence are isolated inside XML tags.</p>
            <p>4. The LLM decomposes the SLA specification into atomic propositional criteria (C_1, C_2, ... C_n).</p>
            <p>5. Each criterion is evaluated independently: Result(C_i) in [PASS, FAIL].</p>
            <p>6. Continuous worker_bps is derived: worker_bps = (passed_criteria / total_criteria) * 10,000.</p>
            <p>7. Validators compare verdicts and vote. Once majority consensus is achieved, payout splits execute.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Basis Points Derivation */}
      <section id="mathematics" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">05</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">Continuous Basis Points Settlement Mathematics</h2>
        </div>

        <p className="text-sm text-[#f0f0f0] leading-relaxed font-sans">
          Binary escrows (paying 100% or 0%) cause catastrophic misalignments in real-world agent execution (e.g., when an agent successfully scrapes 450 out of 500 records or delivers 4 out of 5 API endpoints). AgentSettle enforces continuous Basis Points settlements from 0 to 10,000:
        </p>

        <div className="p-6 rounded-[16px] bg-black border border-[#292d30] space-y-3 font-mono text-xs text-[#9281f7]">
          <p className="text-[#6e727a]">{"// Exact Fund Conservation Theorem"}</p>
          <p>worker_bps = (passed_criteria / total_criteria) * 10,000</p>
          <p>escrow_worker_share = (escrow_amount * worker_bps) // 10,000</p>
          <p>escrow_client_refund = escrow_amount - escrow_worker_share</p>
          <p className="text-[#3ad389] pt-2 border-t border-[#292d30]">
            Invariant: escrow_worker_share + escrow_client_refund == escrow_amount
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-1.5">
            <span className="text-[#3ad389] font-medium block">Case 1: Full Payout (10,000 BPS)</span>
            <p className="text-[#a1a4a5] font-sans">
              Worker receives 100% escrow reward + worker bond returned + dispute deposit (as recompense). Client receives 0.
            </p>
          </div>
          <div className="p-4 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-1.5">
            <span className="text-[#ff9592] font-medium block">Case 2: Full Refund (0 BPS)</span>
            <p className="text-[#a1a4a5] font-sans">
              Client receives 100% escrow refund + dispute deposit returned + slashed worker bond (as restitution). Worker receives 0.
            </p>
          </div>
          <div className="p-4 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-1.5">
            <span className="text-[#baa7ff] font-medium block">Case 3: Partial Split (1 - 9,999 BPS)</span>
            <p className="text-[#a1a4a5] font-sans">
              Worker receives exact proportional escrow share + bond returned; Client receives remaining escrow + deposit returned.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: Security & Anti-SSRF */}
      <section id="security" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">06</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">Security &amp; Anti-SSRF Defenses</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-2">
            <h3 className="font-medium text-white text-sm">Anti-SSRF URL Enforcement</h3>
            <p className="text-[#a1a4a5] leading-relaxed">
              Worker-submitted URLs are filtered on-chain before validator WebVM dispatch:
            </p>
            <ul className="list-disc list-inside text-[#f0f0f0] font-mono space-y-1 pt-1">
              <li>Only public https:// endpoints allowed</li>
              <li>Localhost &amp; 127.0.0.1 blocked</li>
              <li>Cloud metadata 169.254.169.254 blocked</li>
              <li>RFC-1918 subnets (10.x, 172.16.x, 192.168.x) blocked</li>
              <li>Non-standard ports (such as 8080 or 8443) blocked</li>
            </ul>
          </div>

          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-2">
            <h3 className="font-medium text-white text-sm">XML Prompt Quarantine</h3>
            <p className="text-[#a1a4a5] leading-relaxed">
              Untrusted external strings (SLA texts, evidence payloads, allegations, and defense rebuttals) are sanitized and isolated inside strict XML context tags:
            </p>
            <div className="p-3 rounded-[6px] bg-black border border-[#292d30] font-mono text-[11px] text-[#9281f7]">
              &lt;sla_specification&gt;...&lt;/sla_specification&gt;
              <br />
              &lt;deliverable_payload&gt;...&lt;/deliverable_payload&gt;
              <br />
              &lt;worker_rebuttal&gt;...&lt;/worker_rebuttal&gt;
            </div>
            <p className="text-[#6e727a] text-[11px]">
              Validators treat all enclosed content as inert data, nullifying prompt injection attempts.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7: Studionet Deployment */}
      <section id="studionet" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-[#292d30] pb-3">
          <span className="font-mono text-xs text-[#9281f7]">07</span>
          <h2 className="text-2xl font-normal text-white tracking-tight">On-Chain Studionet Deployment</h2>
        </div>

        <p className="text-sm text-[#f0f0f0] leading-relaxed font-sans">
          AgentSettle is deployed, verified, and active on GenLayer Studionet (Chain ID 61999).
        </p>

        <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-[#292d30] gap-1">
            <span className="text-[#6e727a]">Contract Address</span>
            <span className="text-[#9281f7] font-semibold break-all">
              0x7bE669b18689afb885352c87A487c8432c58d56D
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-[#292d30] gap-1">
            <span className="text-[#6e727a]">Deployment Transaction</span>
            <span className="text-[#f0f0f0] break-all">
              0x04909812465ba382683188d27adb9d4ce32de8eb02bcf1f1ad77a4e365384db0
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-[#292d30] gap-1">
            <span className="text-[#6e727a]">Network RPC</span>
            <span className="text-[#f0f0f0]">https://studio.genlayer.com/api</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 text-xs gap-1">
            <span className="text-[#6e727a]">Verified Test Coverage</span>
            <span className="text-[#3ad389] font-medium">52/52 Direct Tests · 20/20 Vitest Tests</span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <a
            href="https://genlayer-explorer.vercel.app/address/0x7bE669b18689afb885352c87A487c8432c58d56D"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-mono transition-colors"
          >
            <span>Inspect Contract on Explorer</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/tasks/create"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-[#0b0e14] text-white text-xs font-medium transition-colors"
          >
            <span>Create Task Agreement</span>
            <span className="text-[#9281f7]">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
