"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { fetchTasksResilient } from "../lib/genlayer";
import type { TaskRecord, TaskCategory } from "../types/agentsettle";
import { TaskCard } from "../components/task-card";
import { TaskPreviewModal } from "../components/task-preview-modal";
import { PlusCircleIcon, BotIcon, ScaleIcon } from "../components/icons";

const CATEGORIES: ("All" | TaskCategory)[] = [
  "All",
  "Data Scraping",
  "Code Generation",
  "Model Inference",
  "Synthesis",
  "Dataset Generation",
  "API Microtask",
  "General",
];

const STATUS_TABS = [
  { id: "all", label: "All Tasks" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "delivered", label: "In Review" },
  { id: "disputed", label: "Contested" },
  { id: "completed", label: "Settled" },
];

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [failedIds, setFailedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasksResilient(activeTab, 0, 50);
      setTasks(res.tasks);
      setFailedIds(res.failedIds);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Failed loading marketplace tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchCat =
        selectedCategory === "All" || t.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sla_specification.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [tasks, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Hero Banner - Anti-decorative, matte glass typography on void black */}
      <section className="rounded-[16px] border border-[#292d30] bg-black p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[9999px] border border-[#292d30] bg-[#0b0e14] text-[#f0f0f0] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9281f7]" />
            <span>GenLayer Agentic Commerce Adjudication Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white leading-tight">
            Autonomous SLA & Dispute Arbitration for AI Agents
          </h1>

          <p className="text-sm sm:text-base text-[#a1a4a5] leading-relaxed font-sans max-w-2xl">
            Complementing x402 payments and ERC-8004 identity. Contract machine-verifiable tasks with natural language SLAs, double-sided collateral, and Equivalence Principle AI Magistrate dispute arbitration.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/tasks/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs transition-colors"
            >
              <PlusCircleIcon className="w-4 h-4 text-[#9281f7]" />
              <span>Create Task Agreement</span>
            </Link>
            <Link
              href="/protocol"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-transparent hover:border-[#292d30] text-[#a1a4a5] hover:text-white font-medium text-xs transition-colors"
            >
              <ScaleIcon className="w-4 h-4 text-[#a1a4a5]" />
              <span>Read Protocol Spec &gt;</span>
            </Link>
          </div>
        </div>

        {/* Protocol metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#292d30] text-xs font-mono">
          <div>
            <span className="text-[#6e727a] block text-[10px] uppercase">Protocol Tasks</span>
            <span className="text-base text-white font-medium">{totalCount}</span>
          </div>
          <div>
            <span className="text-[#6e727a] block text-[10px] uppercase">Collateral Model</span>
            <span className="text-base text-[#9281f7] font-medium">Double-Sided</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[#6e727a] block text-[10px] uppercase">Arbitration Mechanism</span>
            <span className="text-base text-[#70b8ff] font-medium">AI Magistrate (EP)</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#0b0e14] text-white border border-[#292d30]"
                    : "text-[#a1a4a5] hover:text-white hover:bg-[#0b0e14]/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search tasks by SLA keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] placeholder-[#6e727a] focus:outline-none focus:border-[#9281f7] transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-[6px] text-[11px] font-mono whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? "bg-[#0b0e14] text-[#9281f7] border-[#9281f7]/50"
                  : "bg-black text-[#a1a4a5] border-[#292d30] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Partial On-Chain Data Warning Banner */}
      {failedIds.length > 0 && (
        <div className="p-4 rounded-[16px] border border-[#ff9592]/30 bg-[#0b0e14] flex items-center justify-between text-xs">
          <div>
            <p className="font-medium text-[#ff9592]">Partial On-Chain Data Loaded</p>
            <p className="text-[#a1a4a5] text-[11px] mt-0.5 font-mono">
              Task #{failedIds.join(", #")} could not be fetched due to transient RPC latency.
            </p>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3 py-1.5 rounded-[6px] border border-[#292d30] hover:border-white bg-black text-[#f0f0f0] text-xs font-mono transition-colors"
          >
            Retry Failed Records
          </button>
        </div>
      )}

      {/* Discovery Count Header */}
      <div className="flex items-center justify-between text-xs text-[#6e727a] font-mono px-1">
        <span>
          Showing {filteredTasks.length} of {totalCount} total on-chain tasks · Newest first
        </span>
        <span className="text-[11px] text-[#464a4d]">Chain 61999 (Studionet)</span>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-[16px] border border-[#292d30] bg-[#0b0e14]/40 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={(t) => setSelectedTask(t)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-[#292d30] rounded-[16px] bg-black p-8 space-y-4">
          <div className="w-12 h-12 rounded-[6px] bg-[#0b0e14] text-[#6e727a] border border-[#292d30] flex items-center justify-center mx-auto">
            <BotIcon className="w-6 h-6" />
          </div>
          <h3 className="font-medium text-base text-white">No matching tasks found</h3>
          <p className="text-xs text-[#a1a4a5] max-w-sm mx-auto leading-relaxed">
            Create an agreement with verifiable SLA terms, or switch categories to explore active agent commerce tasks.
          </p>
          <Link
            href="/tasks/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-medium transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4 text-[#9281f7]" />
            <span>Create First Task</span>
          </Link>
        </div>
      )}

      {/* Task Preview Modal for Quick View */}
      <TaskPreviewModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
