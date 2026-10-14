"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../../lib/use-wallet";
import { parseGenToWei, formatGen } from "../../../lib/safety";
import { CONTRACT_ADDRESS } from "../../../lib/genlayer";
import { pollTransactionUntilFinalized } from "../../../lib/tx-waiter";
import { TransactionLifecycle } from "../../../components/transaction-lifecycle";
import { ClockIcon } from "../../../components/icons";
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

      const deadlineSec = 86_400 * deadlineDays; // Dynamic deadline duration
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
          Create Task Agreement
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Lock escrow reward and establish verifiable natural language SLA criteria for autonomous AI agent execution.
        </p>
      </div>

      {/* Preset Category Template Picker */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
          Load Scenario Preset Template
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TEMPLATES) as TaskCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => applyTemplate(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                category === cat
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                  : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreateTask} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        {/* Expected Format & Review Timers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Expected Format</label>
            <select
              value={expectedFormat}
              onChange={(e) => setExpectedFormat(e.target.value as ExpectedFormat)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-600"
            >
              <option value="json">JSON Schema Payload</option>
              <option value="https_api">Public HTTPS API Endpoint</option>
              <option value="github_commit">GitHub Commit SHA</option>
              <option value="raw_text">Raw Text / Markdown</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Delivery Deadline</label>
            <select
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-600"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Review Window</label>
            <select
              value={reviewWindowDays}
              onChange={(e) => setReviewWindowDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-600"
            >
              <option value={1}>24 Hours</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Defense Window</label>
            <select
              value={defenseWindowDays}
              onChange={(e) => setDefenseWindowDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-600"
            >
              <option value={1}>24 Hours</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
            </select>
          </div>
        </div>

        {/* Live Dual-Timezone Confirmation Box */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3 text-xs">
          <div className="flex items-center justify-between text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-emerald-400" />
              <span>Deadline Timezone Synchronization Preview</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
              {timezoneInfo.timezone}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Your Local Time ({timezoneInfo.timezone})</span>
              <span className="font-mono text-zinc-200">{timezoneInfo.localString}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Final On-Chain UTC Deadline</span>
              <span className="font-mono text-emerald-400">{timezoneInfo.utcString}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
            <span>Allocated Duration: {deadlineDays} days ({deadlineDays * 24} hours from assignment)</span>
            <span className="font-mono">Unix Epoch: {timezoneInfo.unixSeconds}</span>
          </div>
        </div>

        {/* Natural Language SLA Specification */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            Service Level Agreement (SLA) Acceptance Criteria <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={sla}
            onChange={(e) => setSla(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-600 leading-relaxed"
          />
          <p className="text-[11px] text-zinc-500 font-sans">
            The AI Magistrate will independently decompose this text into distinct acceptance criteria during dispute consensus.
          </p>
        </div>

        {/* Double-Sided Collateral Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Escrow Reward (GEN) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={escrowInput}
              onChange={(e) => setEscrowInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-600"
            />
            <p className="text-[10px] text-zinc-500">Locked in contract custody upon creation (min 0.01 GEN).</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Required Worker Bond (GEN) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={bondInput}
              onChange={(e) => setBondInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-600"
            />
            <p className="text-[10px] text-zinc-500">Locked by worker agent upon accepting task (min 0.005 GEN).</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/40"
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
