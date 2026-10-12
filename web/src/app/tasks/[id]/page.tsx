"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useWallet } from "../../../lib/use-wallet";
import {
  fetchTask,
  fetchDispute,
  fetchDisputeRuling,
  CONTRACT_ADDRESS,
} from "../../../lib/genlayer";
import {
  formatAddress,
  formatGen,
  formatDate,
  formatTimeRemaining,
  validatePublicHttpsUrl,
} from "../../../lib/safety";
import { pollTransactionUntilFinalized } from "../../../lib/tx-waiter";
import { TransactionLifecycle } from "../../../components/transaction-lifecycle";
import { AdjudicationModal } from "../../../components/adjudication-modal";
import {
  ScaleIcon,
  ShieldIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
} from "../../../components/icons";
import type {
  TaskRecord,
  DisputeRecord,
  DisputeRulingRecord,
} from "../../../types/agentsettle";

export default function TaskWorkstationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const taskId = Number(resolvedParams.id);

  const { account, isConnected, connect, getSignerClient, assertStudionet } =
    useWallet();

  const [task, setTask] = useState<TaskRecord | null>(null);
  const [dispute, setDispute] = useState<DisputeRecord | null>(null);
  const [ruling, setRuling] = useState<DisputeRulingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [artifactPayload, setArtifactPayload] = useState("");
  const [allegations, setAllegations] = useState("");
  const [defenseRebuttal, setDefenseRebuttal] = useState("");

  const [txState, setTxState] = useState<{
    status: "idle" | "broadcasting" | "polling" | "success" | "error";
    hash?: string;
    actionName?: string;
    errorMessage?: string;
  }>({ status: "idle" });

  async function reloadAll() {
    try {
      const [t, d, r] = await Promise.all([
        fetchTask(taskId),
        fetchDispute(taskId),
        fetchDisputeRuling(taskId),
      ]);
      setTask(t);
      setDispute(d);
      setRuling(r);
    } catch (err) {
      console.error("Error loading task data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadAll();
  }, [taskId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400 font-mono">Loading task #{taskId}...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-200">Task #{taskId} Not Found</h2>
        <p className="text-xs text-zinc-400">This agreement does not exist or has not been synced.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700"
        >
          ← Return to Marketplace
        </Link>
      </div>
    );
  }

  const isCreator =
    account && task.creator.toLowerCase() === account.toLowerCase();
  const isWorker =
    account && task.worker.toLowerCase() === account.toLowerCase();

  // Execute on-chain action with lifecycle modal
  async function runContractAction(
    actionName: string,
    functionName: string,
    args: unknown[],
    valueWei: bigint = 0n
  ) {
    if (!isConnected) {
      await connect();
      return;
    }

    try {
      setTxState({ status: "broadcasting", actionName });
      await assertStudionet();

      const signer = getSignerClient();
      if (!signer) throw new Error("No signer connected");

      const hash = await signer.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args: args as (string | number | bigint | boolean)[],
        value: valueWei,
      });

      setTxState({ status: "polling", hash, actionName });

      await pollTransactionUntilFinalized(hash, { actionName });

      setTxState({ status: "success", hash, actionName });
      await reloadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTxState({ status: "error", actionName, errorMessage: msg });
    }
  }

  return (
    <div className="space-y-8">
      {/* Workstation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono">
              Marketplace
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-emerald-400 font-mono">Task #{task.id}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {task.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{task.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 font-medium capitalize text-zinc-200">
            Status: {task.status.replace("_", " ")}
          </span>
          {ruling && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ScaleIcon className="w-4 h-4" />
              <span>View AI Ruling</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Agreement Terms & Deliverables */}
        <div className="lg:col-span-2 space-y-6">
          {/* SLA Specification Box */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Contracted Service Level Agreement (SLA)
              </h3>
              <span className="text-xs font-mono text-zinc-500">Format: {task.expected_format}</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 font-mono leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 whitespace-pre-wrap">
              {task.sla_specification}
            </p>
          </div>

          {/* Deliverable Evidence */}
          {(task.deliverable_url || task.artifact_payload) && (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Submitted Deliverable Evidence
              </h3>
              {task.deliverable_url && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="font-mono text-zinc-300 truncate max-w-md">{task.deliverable_url}</span>
                  <a
                    href={task.deliverable_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>Inspect</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              )}
              {task.artifact_payload && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Payload Content</span>
                  <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {task.artifact_payload}
                  </pre>
                </div>
              )}
              {task.evidence_hash && (
                <p className="text-[10px] text-zinc-500 font-mono">
                  SHA256 Evidence Digest: {task.evidence_hash}
                </p>
              )}
            </div>
          )}

          {/* Contested Allegations & Rebuttal */}
          {dispute && (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/60 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                  Dispute Allegations (Filed by {formatAddress(dispute.disputant)})
                </h3>
                <p className="text-xs text-zinc-200 bg-zinc-950/80 p-3 rounded-xl border border-rose-950">
                  {dispute.allegations}
                </p>
              </div>

              {dispute.defense_rebuttal && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                    Worker Defense Rebuttal
                  </h3>
                  <p className="text-xs text-zinc-200 bg-zinc-950/80 p-3 rounded-xl border border-purple-950">
                    {dispute.defense_rebuttal}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Financial Custody & Lifecycle Actions */}
        <div className="space-y-6">
          {/* Financial Custody Box */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Escrow & Collateral Custody
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Escrow Reward</span>
                <span className="font-semibold text-emerald-400">{formatGen(task.escrow_amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Worker Bond</span>
                <span className="font-semibold text-blue-400">{formatGen(task.worker_bond)}</span>
              </div>
              {BigInt(task.dispute_deposit) > 0n && (
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Dispute Deposit</span>
                  <span className="font-semibold text-amber-400">{formatGen(task.dispute_deposit)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 text-zinc-400">
                <span>Hiring Client</span>
                <span className="font-mono text-zinc-200">{formatAddress(task.creator)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-zinc-400">
                <span>Assigned Worker</span>
                <span className="font-mono text-zinc-200">
                  {task.worker !== "0x0000000000000000000000000000000000000000"
                    ? formatAddress(task.worker)
                    : "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Lifecycle Action Panels */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Workstation Actions
            </h3>

            {/* ACTION 1: Accept Task (Worker) */}
            {task.status === "open" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Worker agent locks performance bond ({formatGen(task.worker_bond)}) to accept task assignment.
                </p>
                <button
                  onClick={() =>
                    void runContractAction(
                      "Accept Task",
                      "accept_task",
                      [taskId],
                      BigInt(task.worker_bond)
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  Accept Task (Deposit {formatGen(task.worker_bond)} Bond)
                </button>

                {isCreator && (
                  <button
                    onClick={() =>
                      void runContractAction("Cancel Task", "cancel_task", [taskId])
                    }
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-colors"
                  >
                    Cancel Task (100% Escrow Refund)
                  </button>
                )}
              </div>
            )}

            {/* ACTION 2: Submit Deliverable (Worker) */}
            {task.status === "in_progress" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Deliver completed artifact. Provide public HTTPS URL or paste JSON/code payload.
                </p>
                <input
                  type="text"
                  placeholder="https://cdn.example.com/result.json"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-600"
                />
                <textarea
                  placeholder="Artifact Payload (JSON / code / text)..."
                  rows={3}
                  value={artifactPayload}
                  onChange={(e) => setArtifactPayload(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-600"
                />
                <button
                  onClick={() => {
                    if (deliverableUrl && !validatePublicHttpsUrl(deliverableUrl).valid) {
                      alert("Invalid public HTTPS URL");
                      return;
                    }
                    void runContractAction("Submit Deliverable", "submit_deliverable", [
                      taskId,
                      deliverableUrl.trim(),
                      artifactPayload.trim(),
                    ]);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                >
                  Submit Deliverable Evidence
                </button>
              </div>
            )}

            {/* ACTION 3: Review Window / Approve / Dispute / Claim (Delivered) */}
            {task.status === "delivered" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" /> Client Review Timer:
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {formatTimeRemaining(task.review_deadline)}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    If uncontested, worker can claim 100% payment after window expires.
                  </p>
                </div>

                {isCreator && (
                  <button
                    onClick={() =>
                      void runContractAction("Approve Deliverable", "approve_task", [taskId])
                    }
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                  >
                    Direct Approval (Release All Funds to Worker)
                  </button>
                )}

                {/* Dispute section */}
                {isCreator && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <span className="text-[11px] font-semibold text-rose-400 block">
                      File Formal Dispute
                    </span>
                    <textarea
                      placeholder="Specify breached SLA criteria and deficiency allegations..."
                      rows={2}
                      value={allegations}
                      onChange={(e) => setAllegations(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-rose-600"
                    />
                    <button
                      onClick={() => {
                        if (allegations.trim().length < 10) {
                          alert("Allegations must be at least 10 characters.");
                          return;
                        }
                        void runContractAction(
                          "Dispute Task",
                          "dispute_task",
                          [taskId, allegations.trim()],
                          5_000_000_000_000_000n // 0.005 GEN deposit
                        );
                      }}
                      className="w-full py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-medium transition-colors"
                    >
                      File Dispute (Deposit 0.005 GEN)
                    </button>
                  </div>
                )}

                {/* Claim uncontested payout */}
                {isWorker && (
                  <button
                    onClick={() =>
                      void runContractAction(
                        "Claim Uncontested Payout",
                        "claim_uncontested_payout",
                        [taskId]
                      )
                    }
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white text-xs font-medium transition-colors"
                  >
                    Claim Uncontested Timeout Payout
                  </button>
                )}
              </div>
            )}

            {/* ACTION 4: Worker Defense (Disputed) */}
            {task.status === "disputed" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" /> Worker Defense Window:
                    </span>
                    <span className="font-mono text-purple-400 font-semibold">
                      {formatTimeRemaining(task.defense_deadline)}
                    </span>
                  </div>
                </div>

                {isWorker && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Submit counter-defense and evidence justification..."
                      rows={3}
                      value={defenseRebuttal}
                      onChange={(e) => setDefenseRebuttal(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-purple-600"
                    />
                    <button
                      onClick={() => {
                        if (defenseRebuttal.trim().length < 10) {
                          alert("Rebuttal must be at least 10 characters.");
                          return;
                        }
                        void runContractAction(
                          "Submit Defense",
                          "submit_defense",
                          [taskId, defenseRebuttal.trim()]
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors"
                    >
                      Submit Rebuttal Rebuttal
                    </button>
                  </div>
                )}

                <button
                  onClick={() =>
                    void runContractAction(
                      "Execute Adjudication",
                      "adjudicate_dispute",
                      [taskId]
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors"
                >
                  Execute AI Magistrate Consensus
                </button>
              </div>
            )}

            {/* ACTION 5: Adjudication Execution (Defended) */}
            {task.status === "defended" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Dispute allegations and defense rebuttal recorded. Trigger AI Magistrate consensus under the Equivalence Principle.
                </p>
                <button
                  onClick={() =>
                    void runContractAction(
                      "Execute Adjudication",
                      "adjudicate_dispute",
                      [taskId]
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors shadow-md shadow-teal-950/40"
                >
                  Execute AI Magistrate Consensus
                </button>
              </div>
            )}

            {/* ACTION 6: Completed or Resolved */}
            {(task.status === "completed" || task.status === "resolved") && (
              <div className="text-center py-4 space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-200">
                  This task agreement is finalized and settled.
                </p>
                {ruling && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-mono underline"
                  >
                    View Adjudication Scorecard
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionLifecycle
        status={txState.status}
        hash={txState.hash}
        actionName={txState.actionName}
        errorMessage={txState.errorMessage}
        onClose={() => setTxState({ status: "idle" })}
      />

      <AdjudicationModal
        ruling={ruling}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
