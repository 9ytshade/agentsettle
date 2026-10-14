"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { TaskRecord } from "../types/agentsettle";
import { formatAddress, formatGen, formatTimeRemaining } from "../lib/safety";
import { ExternalLinkIcon } from "./icons";

interface TaskPreviewModalProps {
  task: TaskRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string }
> = {
  open: { label: "Open for Assignment", dotColor: "bg-[#ffca16]" },
  in_progress: { label: "In Progress", dotColor: "bg-[#3b9eff]" },
  delivered: { label: "Delivered (In Review)", dotColor: "bg-[#70b8ff]" },
  completed: { label: "Completed & Settled", dotColor: "bg-[#3ad389]" },
  disputed: { label: "Contested / Disputed", dotColor: "bg-[#ff9592]" },
  defended: { label: "Defended (Arbitration Ready)", dotColor: "bg-[#baa7ff]" },
  resolved: { label: "Arbitrated & Resolved", dotColor: "bg-[#3ad389]" },
  cancelled: { label: "Cancelled", dotColor: "bg-[#6e727a]" },
};

export function TaskPreviewModal({ task, isOpen, onClose }: TaskPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const statusInfo = STATUS_CONFIG[task.status] || {
    label: task.status,
    dotColor: "bg-[#a1a4a5]",
  };

  const copySla = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(task.sla_specification);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[16px] border border-[#292d30] bg-[#0b0e14] p-6 sm:p-8 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#292d30]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#6e727a]">Task #{task.id}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-black text-[#a1a4a5] border border-[#292d30] font-mono">
                {task.category}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-black border border-[#292d30] text-[11px] font-mono text-[#f0f0f0]">
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                <span>{statusInfo.label}</span>
              </div>
            </div>
            <h2 className="text-xl font-normal text-white tracking-tight mt-1">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#a1a4a5] hover:text-white text-sm font-mono p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 scrollbar-none">
          {/* Financial Collateral Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
              <span className="text-[10px] text-[#6e727a] uppercase font-mono block">Escrow Reward</span>
              <span className="font-mono text-white text-sm font-medium mt-0.5 block">{formatGen(task.escrow_amount)}</span>
            </div>
            <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
              <span className="text-[10px] text-[#6e727a] uppercase font-mono block">Worker Bond</span>
              <span className="font-mono text-[#a1a4a5] text-sm mt-0.5 block">{formatGen(task.worker_bond)}</span>
            </div>
            <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
              <span className="text-[10px] text-[#6e727a] uppercase font-mono block">Delivery Deadline</span>
              <span className="font-mono text-[#9281f7] text-xs mt-0.5 block">{formatTimeRemaining(task.deadline)}</span>
            </div>
            <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
              <span className="text-[10px] text-[#6e727a] uppercase font-mono block">Deliverable Format</span>
              <span className="font-mono text-[#f0f0f0] text-xs mt-0.5 block">{task.expected_format}</span>
            </div>
          </div>

          {/* SLA Specification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#6e727a]">
                Contracted SLA Specification
              </h4>
              <button
                type="button"
                onClick={copySla}
                className="text-[11px] font-mono text-[#9281f7] hover:text-[#baa7ff] transition-colors"
              >
                {copied ? "Copied" : "Copy SLA"}
              </button>
            </div>
            <div className="p-4 rounded-[6px] bg-black border border-[#292d30] text-xs font-mono text-[#f0f0f0] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {task.sla_specification}
            </div>
          </div>

          {/* Counterparties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
              <span className="text-[10px] text-[#6e727a] uppercase block mb-1">Hiring Client Address</span>
              <span className="text-[#f0f0f0] truncate block">{task.creator}</span>
            </div>
            <div className="p-3.5 rounded-[6px] bg-black border border-[#292d30]">
              <span className="text-[10px] text-[#6e727a] uppercase block mb-1">Assigned Worker Address</span>
              <span className="text-[#f0f0f0] truncate block">
                {task.worker !== "0x0000000000000000000000000000000000000000" ? task.worker : "Unassigned (Open)"}
              </span>
            </div>
          </div>

          {/* Evidence Preview if submitted */}
          {(task.deliverable_url || task.artifact_payload) && (
            <div className="space-y-2 p-4 rounded-[6px] bg-black border border-[#292d30] text-xs">
              <span className="text-[10px] text-[#6e727a] uppercase font-mono block">Submitted Evidence</span>
              {task.deliverable_url && (
                <div className="flex items-center justify-between font-mono pt-1">
                  <span className="text-[#9281f7] truncate max-w-sm">{task.deliverable_url}</span>
                  <a
                    href={task.deliverable_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#9281f7] hover:text-[#baa7ff] flex items-center gap-1 text-[11px]"
                  >
                    <span>Inspect</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              )}
              {task.artifact_payload && (
                <pre className="p-2.5 rounded-[6px] bg-[#0b0e14] border border-[#292d30] text-[11px] font-mono text-[#a1a4a5] max-h-24 overflow-y-auto whitespace-pre-wrap mt-2">
                  {task.artifact_payload}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#292d30] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-medium transition-colors"
          >
            Close
          </button>
          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-black hover:bg-[#1a1f26] text-white text-xs font-medium transition-colors"
          >
            <span>Enter Full Workstation</span>
            <span className="text-[#9281f7]">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
