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
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-[#292d30] border-t-[#9281f7] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#a1a4a5] font-mono">Loading task #{taskId}...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-xl font-normal text-white">Task #{taskId} Not Found</h2>
        <p className="text-xs text-[#a1a4a5] font-sans">This agreement does not exist or has not been synced.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-xs text-[#f0f0f0] transition-colors"
        >
          Return to Marketplace
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
    <div className="space-y-10">
      {/* Workstation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#292d30]">
        <div>
          <div className="flex items-center gap-2 mb-2 font-mono text-xs">
            <Link href="/" className="text-[#6e727a] hover:text-white transition-colors">
              Marketplace
            </Link>
            <span className="text-[#464a4d]">/</span>
            <span className="text-[#9281f7]">Task #{task.id}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-[#0b0e14] text-[#a1a4a5] border border-[#292d30]">
              {task.category}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white">{task.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-[6px] border border-[#292d30] bg-[#0b0e14] font-mono text-[#f0f0f0]">
            Status: {task.status.replace("_", " ")}
          </span>
          {ruling && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#0b0e14] hover:bg-black text-[#9281f7] border border-[#9281f7]/50 text-xs font-mono flex items-center gap-1.5 transition-colors"
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
          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[#6e727a] font-mono">
                Contracted Service Level Agreement (SLA)
              </h3>
              <span className="text-xs font-mono text-[#a1a4a5]">Format: {task.expected_format}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#f0f0f0] font-mono leading-relaxed bg-black p-4 rounded-[6px] border border-[#292d30] whitespace-pre-wrap">
              {task.sla_specification}
            </p>
          </div>

          {/* Deliverable Evidence */}
          {(task.deliverable_url || task.artifact_payload) && (
            <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[#6e727a] font-mono">
                Submitted Deliverable Evidence
              </h3>
              {task.deliverable_url && (
                <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-black border border-[#292d30] text-xs">
                  <span className="font-mono text-[#9281f7] truncate max-w-md">{task.deliverable_url}</span>
                  <a
                    href={task.deliverable_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#9281f7] hover:text-[#baa7ff] flex items-center gap-1 font-mono text-[11px] transition-colors"
                  >
                    <span>Inspect</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              )}
              {task.artifact_payload && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#6e727a] font-mono">Payload Content</span>
                  <pre className="p-3.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#a1a4a5] font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {task.artifact_payload}
                  </pre>
                </div>
              )}
              {task.evidence_hash && (
                <p className="text-[10px] text-[#6e727a] font-mono">
                  SHA256 Evidence Digest: <span className="text-[#a1a4a5]">{task.evidence_hash}</span>
                </p>
              )}
            </div>
          )}

          {/* Contested Allegations & Rebuttal */}
          {dispute && (
            <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#ff9592]/30 space-y-4">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#ff9592] font-mono mb-2">
                  Dispute Allegations (Filed by {formatAddress(dispute.disputant)})
                </h3>
                <p className="text-xs text-[#f0f0f0] bg-black p-3.5 rounded-[6px] border border-[#292d30]">
                  {dispute.allegations}
                </p>
              </div>

              {dispute.defense_rebuttal && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-[#baa7ff] font-mono mb-2">
                    Worker Defense Rebuttal
                  </h3>
                  <p className="text-xs text-[#f0f0f0] bg-black p-3.5 rounded-[6px] border border-[#292d30]">
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
          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#6e727a] font-mono">
              Escrow & Collateral Custody
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[#292d30]">
                <span className="text-[#a1a4a5]">Escrow Reward</span>
                <span className="font-mono text-white font-medium">{formatGen(task.escrow_amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#292d30]">
                <span className="text-[#a1a4a5]">Worker Bond</span>
                <span className="font-mono text-[#a1a4a5]">{formatGen(task.worker_bond)}</span>
              </div>
              {BigInt(task.dispute_deposit) > 0n && (
                <div className="flex justify-between items-center py-2 border-b border-[#292d30]">
                  <span className="text-[#a1a4a5]">Dispute Deposit</span>
                  <span className="font-mono text-[#ffca16]">{formatGen(task.dispute_deposit)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 text-[#a1a4a5] border-b border-[#292d30]">
                <span>Hiring Client</span>
                <span className="font-mono text-[#f0f0f0]">{formatAddress(task.creator)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-[#a1a4a5]">
                <span>Assigned Worker</span>
                <span className="font-mono text-[#f0f0f0]">
                  {task.worker !== "0x0000000000000000000000000000000000000000"
                    ? formatAddress(task.worker)
                    : "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Lifecycle Action Panels */}
          <div className="p-6 rounded-[16px] bg-[#0b0e14] border border-[#292d30] space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#6e727a] font-mono">
              Workstation Actions
            </h3>

            {/* ACTION 1: Accept Task (Worker) */}
            {task.status === "open" && (
              <div className="space-y-3">
                <p className="text-xs text-[#a1a4a5]">
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
                  className="w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs transition-colors"
                >
                  Accept Task (Deposit {formatGen(task.worker_bond)} Bond)
                </button>

                {isCreator && (
                  <button
                    onClick={() =>
                      void runContractAction("Cancel Task", "cancel_task", [taskId])
                    }
                    className="w-full py-2 rounded-[6px] border border-[#292d30] hover:border-[#ff9592] bg-transparent text-[#ff9592] text-xs font-medium transition-colors"
                  >
                    Cancel Task (100% Escrow Refund)
                  </button>
                )}
              </div>
            )}

            {/* ACTION 2: Submit Deliverable (Worker) */}
            {task.status === "in_progress" && (
              <div className="space-y-3">
                <p className="text-xs text-[#a1a4a5]">
                  Deliver completed artifact. Provide public HTTPS URL or paste JSON/code payload.
                </p>
                <input
                  type="text"
                  placeholder="https://cdn.example.com/result.json"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs font-mono text-[#f0f0f0] focus:outline-none focus:border-[#9281f7]"
                />
                <textarea
                  placeholder="Artifact Payload (JSON / code / text)..."
                  rows={3}
                  value={artifactPayload}
                  onChange={(e) => setArtifactPayload(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs font-mono text-[#f0f0f0] focus:outline-none focus:border-[#9281f7]"
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
                  className="w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs transition-colors"
                >
                  Submit Deliverable Evidence
                </button>
              </div>
            )}

            {/* ACTION 3: Review Window / Approve / Dispute / Claim (Delivered) */}
            {task.status === "delivered" && (
              <div className="space-y-4">
                <div className="p-3 rounded-[6px] bg-black border border-[#292d30] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#a1a4a5]">
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-[#9281f7]" /> Client Review Timer:
                    </span>
                    <span className="font-mono text-[#3ad389] font-medium">
                      {formatTimeRemaining(task.review_deadline)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6e727a] font-mono">
                    If uncontested, worker can claim 100% payment after window expires.
                  </p>
                </div>

                {isCreator && (
                  <button
                    onClick={() =>
                      void runContractAction("Approve Deliverable", "approve_task", [taskId])
                    }
                    className="w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-[#3ad389] bg-transparent text-[#ffffff] hover:text-[#3ad389] font-medium text-xs transition-colors"
                  >
                    Direct Approval (Release All Funds to Worker)
                  </button>
                )}

                {/* Dispute section */}
                {isCreator && (
                  <div className="space-y-2 pt-3 border-t border-[#292d30]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#ff9592] block">
                      File Formal Dispute
                    </span>
                    <textarea
                      placeholder="Specify breached SLA criteria and deficiency allegations..."
                      rows={2}
                      value={allegations}
                      onChange={(e) => setAllegations(e.target.value)}
                      className="w-full p-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#ff9592]"
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
                      className="w-full py-2 rounded-[6px] border border-[#ff9592]/40 hover:border-[#ff9592] bg-transparent text-[#ff9592] text-xs font-mono transition-colors"
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
                    className="w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] text-xs font-medium transition-colors"
                  >
                    Claim Uncontested Timeout Payout
                  </button>
                )}
              </div>
            )}

            {/* ACTION 4: Worker Defense (Disputed) */}
            {task.status === "disputed" && (
              <div className="space-y-3">
                <div className="p-3 rounded-[6px] bg-black border border-[#292d30] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#a1a4a5]">
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-[#baa7ff]" /> Worker Defense Window:
                    </span>
                    <span className="font-mono text-[#baa7ff] font-medium">
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
                      className="w-full p-2.5 rounded-[6px] bg-black border border-[#292d30] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#baa7ff]"
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
                      className="w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs transition-colors"
                    >
                      Submit Defense Rebuttal
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
                  className="w-full py-2.5 rounded-[6px] border border-[#3b9eff] bg-[#3b9eff] hover:bg-[#70b8ff] text-white font-medium text-xs transition-colors"
                >
                  Execute AI Magistrate Consensus
                </button>
              </div>
            )}

            {/* ACTION 5: Adjudication Execution (Defended) */}
            {task.status === "defended" && (
              <div className="space-y-3">
                <p className="text-xs text-[#a1a4a5] leading-relaxed">
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
                  className="w-full py-2.5 rounded-[6px] border border-[#3b9eff] bg-[#3b9eff] hover:bg-[#70b8ff] text-white font-medium text-xs transition-colors"
                >
                  Execute AI Magistrate Consensus
                </button>
              </div>
            )}

            {/* ACTION 6: Completed or Resolved */}
            {(task.status === "completed" || task.status === "resolved") && (
              <div className="text-center py-4 space-y-2">
                <div className="w-8 h-8 rounded-[6px] bg-black border border-[#292d30] text-[#3ad389] flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-white">
                  This task agreement is finalized and settled.
                </p>
                {ruling && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-xs text-[#9281f7] hover:text-[#baa7ff] font-mono transition-colors block mx-auto pt-1"
                  >
                    View Adjudication Scorecard &gt;
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
