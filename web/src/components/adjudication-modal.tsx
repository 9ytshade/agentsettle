"use client";

import React from "react";
import type { DisputeRulingRecord } from "../types/agentsettle";
import { formatGen, formatDate } from "../lib/safety";
import { ScaleIcon } from "./icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000f2] backdrop-blur-[25px] animate-fade-in">
      <div className="w-full max-w-xl rounded-[16px] border border-[#292d30] bg-black p-6 sm:p-8 overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#0b0e14] border border-[#292d30] text-[#9281f7] flex items-center justify-center">
              <ScaleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg text-white">AI Magistrate Adjudication</h3>
              <p className="text-xs text-[#a1a4a5] font-mono">GenLayer Equivalence Principle Consensus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a1a4a5] hover:text-white text-sm font-mono p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {ruling ? (
          <div className="space-y-6">
            <div className="p-4 rounded-[16px] bg-[#0b0e14] border border-[#292d30] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#6e727a] block font-mono">Binding Verdict</span>
                <span className="font-medium text-base text-white">{ruling.verdict}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#6e727a] block font-mono">Settled At</span>
                <span className="font-mono text-xs text-[#a1a4a5]">{formatDate(ruling.ruled_at)}</span>
              </div>
            </div>

            {/* Basis points settlement visualizer bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[#9281f7]">Worker Share: {workerPercent}%</span>
                <span className="text-[#3b9eff]">Client Refund: {clientPercent}%</span>
              </div>
              <div className="h-2 w-full bg-[#292d30] rounded-[6px] overflow-hidden flex">
                <div
                  className="bg-[#9281f7] transition-all duration-500"
                  style={{ width: `${workerPercent}%` }}
                />
                <div
                  className="bg-[#3b9eff] transition-all duration-500"
                  style={{ width: `${clientPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div className="p-3.5 rounded-[16px] bg-[#0b0e14] border border-[#292d30]">
                  <span className="text-[#6e727a] text-[10px] block font-mono">Worker Disbursement</span>
                  <span className="font-mono text-white text-xs mt-0.5 block">{formatGen(ruling.worker_payout)}</span>
                </div>
                <div className="p-3.5 rounded-[16px] bg-[#0b0e14] border border-[#292d30]">
                  <span className="text-[#6e727a] text-[10px] block font-mono">Client Restitution</span>
                  <span className="font-mono text-white text-xs mt-0.5 block">{formatGen(ruling.creator_refund)}</span>
                </div>
              </div>
            </div>

            {/* Itemized Criteria Results */}
            {parsedCriteria.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[#6e727a] font-mono font-medium mb-2.5">
                  Decomposed SLA Criteria Scorecard
                </h4>
                <div className="space-y-2">
                  {parsedCriteria.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-[16px] bg-[#0b0e14] border border-[#292d30] flex items-center justify-between text-xs"
                    >
                      <span className="text-[#f0f0f0] font-medium">{c.criterion}</span>
                      <span
                        className={`px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-medium border ${
                          c.result === "PASS"
                            ? "bg-[#0b0e14] text-[#3ad389] border-[#292d30]"
                            : "bg-[#0b0e14] text-[#ff9592] border-[#292d30]"
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
              <h4 className="text-xs uppercase tracking-wider text-[#6e727a] font-mono font-medium mb-2">
                Consensus Reasoning
              </h4>
              <p className="p-4 rounded-[16px] bg-[#0b0e14] border border-[#292d30] text-xs text-[#a1a4a5] leading-relaxed font-sans">
                {ruling.reasoning}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <p className="text-xs text-[#a1a4a5] max-w-sm mx-auto leading-relaxed">
              Execute independent multi-validator LLM jury evaluation to decompose the contracted SLA terms, inspect delivered evidence, and award continuous Basis Points compensation.
            </p>
            {onTriggerAdjudicate && (
              <button
                onClick={() => void onTriggerAdjudicate()}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-[6px] border border-[#3b9eff] bg-[#3b9eff] hover:bg-[#70b8ff] text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Broadcasting Consensus..." : "Execute Magistrate Adjudication"}
              </button>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-[#292d30] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
