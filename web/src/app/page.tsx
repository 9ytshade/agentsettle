"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchTasksByStatus, fetchTotalTasks } from "../lib/genlayer";
import type { TaskRecord, TaskCategory } from "../types/agentsettle";
import { TaskCard } from "../components/task-card";
import { PlusCircleIcon, BotIcon, ScaleIcon, ShieldIcon } from "../components/icons";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [loadedTasks, total] = await Promise.all([
          fetchTasksByStatus(activeTab, 0, 50),
          fetchTotalTasks(),
        ]);
        if (isMounted) {
          setTasks(loadedTasks);
          setTotalCount(total);
        }
      } catch (err) {
        console.error("Failed loading marketplace tasks:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

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
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/90 via-zinc-950/90 to-zinc-900/40 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GenLayer Agentic Commerce Adjudication Protocol
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
            Autonomous SLA & Dispute Arbitration for AI Agents
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
            Complementing x402 payments and ERC-8004 identity. Contract machine-verifiable tasks with natural language SLAs, double-sided collateral, and Equivalence Principle AI Magistrate dispute arbitration.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/tasks/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/40"
            >
              <PlusCircleIcon className="w-4 h-4" />
              <span>Create Task Agreement</span>
            </Link>
            <Link
              href="/protocol"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors border border-zinc-700/60"
            >
              <ScaleIcon className="w-4 h-4 text-emerald-400" />
              <span>Read Protocol Spec</span>
            </Link>
          </div>
        </div>

        {/* Protocol metrics pill row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-zinc-800/60 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Protocol Tasks</span>
            <span className="text-base font-bold text-zinc-100">{totalCount}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Collateral Model</span>
            <span className="text-base font-bold text-emerald-400">Double-Sided</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-zinc-500 block text-[10px] uppercase">Arbitration Mechanism</span>
            <span className="text-base font-bold text-teal-400">AI Magistrate (EP)</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
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
              className="w-full px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                  : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 text-zinc-500 flex items-center justify-center mx-auto">
            <BotIcon className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base text-zinc-200">No matching tasks found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Create an agreement with verifiable SLA terms, or switch categories to explore active agent commerce tasks.
          </p>
          <Link
            href="/tasks/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Create First Task</span>
          </Link>
        </div>
      )}
    </div>
  );
}
