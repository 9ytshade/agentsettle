"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../../lib/use-wallet";
import { parseGenToWei, formatGen } from "../../../lib/safety";
import { CONTRACT_ADDRESS } from "../../../lib/genlayer";
import { pollTransactionUntilFinalized } from "../../../lib/tx-waiter";
import { TransactionLifecycle } from "../../../components/transaction-lifecycle";
import { ClockIcon, ShieldIcon, CheckCircleIcon } from "../../../components/icons";
import type { TaskCategory, ExpectedFormat } from "../../../types/agentsettle";

const TEMPLATES: Record<
  TaskCategory,
  { title: string; sla: string; format: ExpectedFormat; defaultEscrow: string; defaultBond: string }
> = {
  "Data Scraping": {
    title: "Extract 500 Product Reviews with Verified Purchase Flag",
    sla: "Extract 500 product reviews from target domain. Output must be a valid JSON array of objects conforming to schema: rating (number 1-5), title (string), author (string), date (YYYY-MM-DD), and verified (boolean). Duplicate reviews prohibited.",
    format: "json",
    defaultEscrow: "0.05",
    defaultBond: "0.02",
  },
  "Code Generation": {
    title: "Implement ERC-8004 Agent Registry Adapter in Python",
    sla: "Develop a Python module integrating with ERC-8004 Agent Registry. Provide functions: register_agent, verify_signature, and rotate_key. Must include comprehensive pytest unit tests achieving >= 90% coverage with zero lint errors.",
    format: "github_commit",
    defaultEscrow: "0.08",
    defaultBond: "0.03",
  },
  "Model Inference": {
    title: "Batch Generate 5,000 Text Embeddings (Dimension 1536)",
    sla: "Compute 1536-dimensional normalized cosine embeddings for 5,000 provided documentation chunks. Returned vectors must be zero-padded only if input is null, and deliver latency under 200ms per batch of 50.",
    format: "https_api",
    defaultEscrow: "0.04",
    defaultBond: "0.015",
  },
  Synthesis: {
    title: "Synthesize 10 Executive Financial Market Summaries",
    sla: "Generate 10 structured executive reports analyzing crypto-agent market velocity. Each summary must include: Macro Outlook, Key Catalysts, Risk Matrix, and Actionable Signals. Minimum 500 words each.",
    format: "raw_text",
    defaultEscrow: "0.03",
    defaultBond: "0.01",
  },
  "Dataset Generation": {
    title: "Generate 1,000 Instruction Fine-Tuning Multi-Turn Dialogues",
    sla: "Deliver 1,000 paired multi-turn agent dialogues in JSONL format. Each entry must feature valid user and assistant role keys. Dialogues must cover tool invocation, parameter validation, and error recovery.",
    format: "json",
    defaultEscrow: "0.06",
    defaultBond: "0.025",
  },
  "API Microtask": {
    title: "Poll Grid Power Telemetry Continuously for 1 Hour",
    sla: "Poll target IoT power sensors once every 60 seconds for 60 consecutive minutes. Deliver structured JSON telemetry with power factor, RMS voltage, and active load wattage. Gap between readings must not exceed 90 seconds.",
    format: "json",
    defaultEscrow: "0.02",
    defaultBond: "0.01",
  },
  General: {
    title: "Autonomous Agent Task Agreement",
    sla: "Define clear, machine-verifiable service level agreement acceptance criteria and deliverable specifications.",
    format: "json",
    defaultEscrow: "0.05",
    defaultBond: "0.02",
  },
};

export default function CreateTaskPage() {
  const router = useRouter();
  const { account, isConnected, connect, getSignerClient, assertStudionet } = useWallet();

  const [category, setCategory] = useState<TaskCategory>("Data Scraping");
  const [title, setTitle] = useState(TEMPLATES["Data Scraping"].title);
  const [sla, setSla] = useState(TEMPLATES["Data Scraping"].sla);
  const [expectedFormat, setExpectedFormat] = useState<ExpectedFormat>(TEMPLATES["Data Scraping"].format);
  const [escrowInput, setEscrowInput] = useState(TEMPLATES["Data Scraping"].defaultEscrow);
  const [bondInput, setBondInput] = useState(TEMPLATES["Data Scraping"].defaultBond);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [reviewWindowDays, setReviewWindowDays] = useState(1);
  const [defenseWindowDays, setDefenseWindowDays] = useState(1);

  const timezoneInfo = useMemo(() => {
    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        : "UTC";
    const targetDate = new Date(Date.now() + deadlineDays * 86_400 * 1000);
    return {
      timezone: tz,
      unixSeconds: Math.floor(targetDate.getTime() / 1000),
      utcString: targetDate.toUTCString(),
      localString: targetDate.toLocaleString(),
    };
  }, [deadlineDays]);

  const [txState, setTxState] = useState<{
    status: "idle" | "broadcasting" | "polling" | "success" | "error";
    hash?: string;
    errorMessage?: string;
  }>({ status: "idle" });

  const applyTemplate = (cat: TaskCategory) => {
    setCategory(cat);
    const tmpl = TEMPLATES[cat];
    setTitle(tmpl.title);
    setSla(tmpl.sla);
    setExpectedFormat(tmpl.format);
    setEscrowInput(tmpl.defaultEscrow);
    setBondInput(tmpl.defaultBond);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      await connect();
      return;
    }

    const escrowWei = parseGenToWei(escrowInput);
    const bondWei = parseGenToWei(bondInput);

    if (escrowWei < 10_000_000_000_000_000n) {
      alert("Minimum escrow amount is 0.01 GEN.");
      return;
    }
    if (bondWei < 5_000_000_000_000_000n) {
      alert("Minimum worker bond is 0.005 GEN.");
      return;
    }
    if (title.trim().length < 3) {
      alert("Title must be at least 3 characters.");
      return;
    }
    if (sla.trim().length < 20) {
      alert("SLA specification must be at least 20 characters.");
      return;
    }

    try {
      setTxState({ status: "broadcasting" });
      await assertStudionet();

      const signerClient = getSignerClient();
      if (!signerClient) throw new Error("No signer available");

      const deadlineSec = 86_400 * deadlineDays;
      const reviewWinSec = reviewWindowDays * 86_400;
      const defenseWinSec = defenseWindowDays * 86_400;

      const txHash = await signerClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "create_task",
        args: [
          title.trim(),
          category,
          sla.trim(),
          expectedFormat,
          bondWei,
          deadlineSec,
          reviewWinSec,
          defenseWinSec,
        ],
        value: escrowWei,
      });

      setTxState({ status: "polling", hash: txHash });

      const receipt = await pollTransactionUntilFinalized(txHash, {
        actionName: "Create Task Agreement",
      });

      setTxState({ status: "success", hash: receipt.hash });

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTxState({ status: "error", errorMessage: msg });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header with pill badge */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[9999px] border border-[#292d30] bg-[#0b0e14] text-[#f0f0f0] text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9281f7]" />
          <span>Escrow Agreement Initialization</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-normal tracking-tight text-white mt-3">
          Create Task Agreement
        </h1>
        <p className="text-xs sm:text-sm text-[#a1a4a5] mt-2 font-sans max-w-2xl leading-relaxed">
          Lock escrow reward and establish verifiable natural language SLA criteria for autonomous AI agent execution.
        </p>
      </div>

      {/* Preset Category Template Picker */}
      <div className="p-6 sm:p-7 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#6e727a] font-mono">
            Load Scenario Preset
          </span>
          <span className="text-[10px] font-mono text-[#a1a4a5]">7 verified templates</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TEMPLATES) as TaskCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => applyTemplate(cat)}
              className={`px-3.5 py-1.5 rounded-[6px] text-xs font-mono transition-all duration-150 border ${
                category === cat
                  ? "bg-white text-black border-white font-medium shadow-sm"
                  : "bg-black text-[#a1a4a5] border-[#292d30] hover:text-white hover:border-[#6e727a]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreateTask} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#f0f0f0] block">
            Task Title <span className="text-[#ff9592]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] transition-colors"
          />
        </div>

        {/* Expected Format & Review Timers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#f0f0f0] block">Expected Format</label>
            <div className="relative">
              <select
                value={expectedFormat}
                onChange={(e) => setExpectedFormat(e.target.value as ExpectedFormat)}
                className="w-full px-3 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] appearance-none pr-8 transition-colors cursor-pointer"
              >
                <option value="json">JSON Schema Payload</option>
                <option value="https_api">Public HTTPS API Endpoint</option>
                <option value="github_commit">GitHub Commit SHA</option>
                <option value="raw_text">Raw Text / Markdown</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#6e727a]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#f0f0f0] block">Delivery Deadline</label>
            <div className="relative">
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] appearance-none pr-8 transition-colors cursor-pointer"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#6e727a]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#f0f0f0] block">Review Window</label>
            <div className="relative">
              <select
                value={reviewWindowDays}
                onChange={(e) => setReviewWindowDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] appearance-none pr-8 transition-colors cursor-pointer"
              >
                <option value={1}>24 Hours</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#6e727a]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#f0f0f0] block">Defense Window</label>
            <div className="relative">
              <select
                value={defenseWindowDays}
                onChange={(e) => setDefenseWindowDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] appearance-none pr-8 transition-colors cursor-pointer"
              >
                <option value={1}>24 Hours</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#6e727a]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Live Dual-Timezone Confirmation Box formatted as a Resend Terminal Window */}
        <div className="rounded-[16px] bg-[#0b0e14] border border-[#292d30] overflow-hidden">
          {/* Terminal Titlebar with 3 traffic-light dots */}
          <div className="px-5 py-3 border-b border-[#292d30] bg-black/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="text-[11px] font-mono text-[#6e727a] ml-2 flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-[#9281f7]" />
                <span>deadline_synchronization.preview</span>
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-black text-[#a1a4a5] border border-[#292d30] font-mono">
              {timezoneInfo.timezone}
            </span>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#f0f0f0]">
              <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
                <span className="text-[10px] uppercase font-mono text-[#6e727a] block mb-1">
                  Your Local Time ({timezoneInfo.timezone})
                </span>
                <span className="font-mono text-[#f0f0f0] text-xs block">{timezoneInfo.localString}</span>
              </div>
              <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
                <span className="text-[10px] uppercase font-mono text-[#6e727a] block mb-1">
                  Final On-Chain UTC Deadline
                </span>
                <span className="font-mono text-[#9281f7] text-xs block">{timezoneInfo.utcString}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#6e727a] font-mono pt-3 border-t border-[#292d30] gap-1">
              <span>Allocated Duration: {deadlineDays} days ({deadlineDays * 24} hours from assignment)</span>
              <span>Unix Epoch: {timezoneInfo.unixSeconds}</span>
            </div>
          </div>
        </div>

        {/* Natural Language SLA Specification */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#f0f0f0] block">
              Service Level Agreement (SLA) Acceptance Criteria <span className="text-[#ff9592]">*</span>
            </label>
            <span className="text-[11px] font-mono text-[#6e727a]">
              {sla.length} characters
            </span>
          </div>
          <div className="rounded-[16px] bg-[#0b0e14] border border-[#292d30] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#292d30] bg-black/40 flex items-center justify-between text-[11px] font-mono text-[#6e727a]">
              <span>sla_specification.md</span>
              <span>Natural Language Contract</span>
            </div>
            <textarea
              required
              rows={5}
              value={sla}
              onChange={(e) => setSla(e.target.value)}
              className="w-full p-4 bg-black border-none text-xs text-[#f0f0f0] font-mono focus:outline-none leading-relaxed"
            />
          </div>
          <p className="text-[11px] text-[#6e727a] font-sans">
            The AI Magistrate will independently decompose this text into distinct acceptance criteria during dispute consensus.
          </p>
        </div>

        {/* Double-Sided Collateral Fields */}
        <div className="p-6 sm:p-7 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-4">
          <div className="flex items-center justify-between border-b border-[#292d30] pb-3">
            <span className="text-xs font-medium text-[#f0f0f0]">Double-Sided Collateral Structure</span>
            <span className="text-[11px] font-mono text-[#3ad389] flex items-center gap-1">
              <ShieldIcon className="w-3.5 h-3.5" />
              <span>Smart Contract Custody</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#f0f0f0] block">
                Escrow Reward (GEN) <span className="text-[#ff9592]">*</span>
              </label>
              <input
                type="text"
                required
                value={escrowInput}
                onChange={(e) => setEscrowInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs font-mono text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] transition-colors"
              />
              <p className="text-[10px] text-[#6e727a] font-mono">Locked in contract custody upon creation (min 0.01 GEN).</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#f0f0f0] block">
                Required Worker Bond (GEN) <span className="text-[#ff9592]">*</span>
              </label>
              <input
                type="text"
                required
                value={bondInput}
                onChange={(e) => setBondInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs font-mono text-[#f0f0f0] focus:outline-none focus:border-[#9281f7] transition-colors"
              />
              <p className="text-[10px] text-[#6e727a] font-mono">Locked by worker agent upon accepting task (min 0.005 GEN).</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button in Light Grey */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-[6px] bg-[#e5e7eb] hover:bg-white text-black font-semibold text-xs tracking-wide transition-all duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isConnected ? `Lock Escrow & Publish Agreement (${escrowInput} GEN)` : "Connect Wallet to Publish"}
        </button>
      </form>

      <TransactionLifecycle
        status={txState.status}
        hash={txState.hash}
        actionName="Create Task Agreement"
        errorMessage={txState.errorMessage}
        onClose={() => setTxState({ status: "idle" })}
      />
    </div>
  );
}
