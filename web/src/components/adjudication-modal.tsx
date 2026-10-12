"use client";

import React, { useState } from "react";
import type { DisputeRulingRecord } from "../types/agentsettle";
import { formatGen, formatDate } from "../lib/safety";
import { ScaleIcon, CheckCircleIcon, AlertCircleIcon } from "./icons";

interface AdjudicationModalProps {
  ruling: DisputeRulingRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerAdjudicate?: () => Promise<void>;
  isSubmitting?: boolean;
}

export function AdjudicationModal({
  ruling,
  isOpen,
  onClose,
  onTriggerAdjudicate,
  isSubmitting = false,
}: AdjudicationModalProps) {
  if (!isOpen) return null;

  let parsedCriteria: { criterion: string; result: string }[] = [];
  if (ruling?.criteria_results) {
    try {
      parsedCriteria = JSON.parse(ruling.criteria_results);
    } catch {
      // Fallback
    }
  }

  const workerBps = ruling?.worker_bps ?? 0;
  const workerPercent = (workerBps / 100).toFixed(1);
  const clientPercent = ((10000 - workerBps) / 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100">AI Magistrate Adjudication</h3>
              <p className="text-xs text-zinc-400 font-mono">GenLayer Equivalence Principle Consensus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-sm font-mono p-1"
          >
            ✕
          </button>
        </div>

        {ruling ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Binding Verdict</span>
                <span className="font-bold text-base text-zinc-100">{ruling.verdict}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Settled At</span>
                <span className="font-mono text-xs text-zinc-400">{formatDate(ruling.ruled_at)}</span>
              </div>
            </div>

            {/* Basis points settlement visualizer bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400">Worker Share: {workerPercent}%</span>
                <span className="text-blue-400">Client Refund: {clientPercent}%</span>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${workerPercent}%` }}
                />
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${clientPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-500 text-[10px] block">Worker Disbursement</span>
                  <span className="font-semibold text-zinc-200">{formatGen(ruling.worker_payout)}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-500 text-[10px] block">Client Restitution</span>
                  <span className="font-semibold text-zinc-200">{formatGen(ruling.creator_refund)}</span>
                </div>
              </div>
            </div>

            {/* Itemized Criteria Results */}
            {parsedCriteria.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                  Decomposed SLA Criteria Scorecard
                </h4>
                <div className="space-y-2">
                  {parsedCriteria.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-300 font-medium">{c.criterion}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                          c.result === "PASS"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                            : "bg-rose-950/60 text-rose-400 border-rose-800/80"
                        }`}
                      >
                        {c.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Magistrate Reasoning */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                Consensus Reasoning
              </h4>
              <p className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans">
                {ruling.reasoning}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Execute independent multi-validator LLM jury evaluation to decompose the contracted SLA terms, inspect delivered evidence, and award continuous Basis Points compensation.
            </p>
            {onTriggerAdjudicate && (
              <button
                onClick={() => void onTriggerAdjudicate()}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
              >
                {isSubmitting ? "Broadcasting Consensus..." : "Execute Magistrate Adjudication"}
              </button>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
