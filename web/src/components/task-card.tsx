"use client";

import React from "react";
import Link from "next/link";
import type { TaskRecord } from "../types/agentsettle";
import { formatAddress, formatGen, formatDate } from "../lib/safety";

interface TaskCardProps {
  task: TaskRecord;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  open: { label: "Open for Assignment", badgeClass: "bg-emerald-950/60 text-emerald-400 border-emerald-800/80" },
  in_progress: { label: "In Progress", badgeClass: "bg-blue-950/60 text-blue-400 border-blue-800/80" },
  delivered: { label: "Delivered (In Review)", badgeClass: "bg-amber-950/60 text-amber-400 border-amber-800/80" },
  completed: { label: "Completed & Settled", badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  disputed: { label: "Contested / Disputed", badgeClass: "bg-rose-950/60 text-rose-400 border-rose-800/80" },
  defended: { label: "Defended (Arbitration Ready)", badgeClass: "bg-purple-950/60 text-purple-400 border-purple-800/80" },
  resolved: { label: "Arbitrated & Resolved", badgeClass: "bg-teal-950/60 text-teal-400 border-teal-800/80" },
  cancelled: { label: "Cancelled", badgeClass: "bg-zinc-900 text-zinc-500 border-zinc-800" },
};

export function TaskCard({ task }: TaskCardProps) {
  const statusInfo = STATUS_CONFIG[task.status] || {
    label: task.status,
    badgeClass: "bg-zinc-900 text-zinc-400 border-zinc-800",
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700/80 transition-all p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500">#{task.id}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
              {task.category}
            </span>
          </div>
          <span
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <h3 className="font-semibold text-base text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
          {task.title}
        </h3>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {task.sla_specification}
        </p>
      </div>

      <div className="border-t border-zinc-800/80 pt-4 mt-2">
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Escrow Reward</span>
            <span className="font-semibold text-zinc-200">{formatGen(task.escrow_amount)}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Worker Bond</span>
            <span className="font-mono text-zinc-300">{formatGen(task.worker_bond)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mb-3">
          <span>Client: {formatAddress(task.creator)}</span>
          <span>Format: {task.expected_format}</span>
        </div>

        <Link
          href={`/tasks/${task.id}`}
          className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white font-medium text-xs text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <span>Open Workstation</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}
