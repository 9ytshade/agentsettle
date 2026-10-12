export type TaskStatus =
  | "open"
  | "in_progress"
  | "delivered"
  | "completed"
  | "disputed"
  | "defended"
  | "resolved"
  | "cancelled";

export type TaskCategory =
  | "Data Scraping"
  | "Code Generation"
  | "Model Inference"
  | "Synthesis"
  | "Dataset Generation"
  | "API Microtask"
  | "General";

export type ExpectedFormat =
  | "json"
  | "https_api"
  | "github_commit"
  | "raw_text";

export type DisputeVerdict =
  | "FULL_PAYOUT_WORKER"
  | "PARTIAL_SETTLEMENT"
  | "FULL_REFUND_CLIENT"
  | "UNDETERMINED";

export interface CriterionResult {
  criterion: string;
  result: "PASS" | "FAIL" | "UNDETERMINED";
}

export interface TaskRecord {
  id: number;
  creator: string;
  worker: string;
  title: string;
  category: TaskCategory;
  sla_specification: string;
  expected_format: ExpectedFormat;
  escrow_amount: string; // in wei
  worker_bond: string;   // in wei
  dispute_deposit: string;
  status: TaskStatus;
  deliverable_url: string;
  artifact_payload: string;
  evidence_hash: string;
  created_at: number;
  deadline: number;
  review_window: number;
  review_deadline: number;
  defense_window: number;
  defense_deadline: number;
  attempt_count: number;
  last_attempt_at: number;
}

export interface DisputeRecord {
  task_id: number;
  disputant: string;
  allegations: string;
  defense_rebuttal: string;
  disputed_at: number;
  defended_at: number;
}

export interface DisputeRulingRecord {
  task_id: number;
  verdict: DisputeVerdict;
  worker_bps: number;
  worker_payout: string;
  creator_refund: string;
  criteria_results: string;
  reasoning: string;
  ruled_at: number;
}

export interface AgentProfileRecord {
  address: string;
  tasks_created: number;
  tasks_completed: number;
  disputes_won: number;
  disputes_lost: number;
  slashed_bonds: string;
  reliability_score: number;
}
