"use client";

import React from "react";
import Link from "next/link";
import type { TaskRecord } from "../types/agentsettle";
import { formatAddress, formatGen } from "../lib/safety";

interface TaskCardProps {
  task: TaskRecord;
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

export function TaskCard({ task }: TaskCardProps) {
  const statusInfo = STATUS_CONFIG[task.status] || {
    label: task.status,
    dotColor: "bg-[#a1a4a5]",
  };

  return (
    <div className="rounded-[16px] border border-[#292d30] bg-black hover:border-[#6e727a] transition-all duration-150 ease-out p-6 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#6e727a]">#{task.id}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-[#0b0e14] text-[#a1a4a5] border border-[#292d30] font-mono">
              {task.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#0b0e14] border border-[#292d30] text-[11px] font-mono text-[#f0f0f0]">
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            <span>{statusInfo.label}</span>
          </div>
        </div>

        <h3 className="font-medium text-base text-white group-hover:text-[#9281f7] transition-colors line-clamp-1 mb-2">
          {task.title}
        </h3>

        <p className="text-xs text-[#a1a4a5] line-clamp-2 leading-relaxed mb-5">
          {task.sla_specification}
        </p>
      </div>

      <div className="border-t border-[#292d30] pt-4 mt-2">
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <span className="text-[#6e727a] block text-[10px] uppercase tracking-wider font-mono">Escrow Reward</span>
            <span className="font-mono text-[#ffffff] font-medium">{formatGen(task.escrow_amount)}</span>
          </div>
          <div>
            <span className="text-[#6e727a] block text-[10px] uppercase tracking-wider font-mono">Worker Bond</span>
            <span className="font-mono text-[#a1a4a5]">{formatGen(task.worker_bond)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6e727a] font-mono mb-4">
          <span>Client: <span className="text-[#a1a4a5]">{formatAddress(task.creator)}</span></span>
          <span>Format: <span className="text-[#a1a4a5]">{task.expected_format}</span></span>
        </div>

        <Link
          href={`/tasks/${task.id}`}
          className="w-full py-2 px-3 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Open Workstation</span>
          <span className="text-[#9281f7] group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}
