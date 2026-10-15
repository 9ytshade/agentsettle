import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type {
  TaskRecord,
  DisputeRecord,
  DisputeRulingRecord,
  AgentProfileRecord,
} from "../types/agentsettle";

export const STUDIONET_RPC =
  process.env.NEXT_PUBLIC_STUDIONET_RPC || "https://studio.genlayer.com/api";

export const STUDIONET_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_STUDIONET_CHAIN_ID || 61999
);

export const DEPLOYED_CONTRACT_ADDRESS = "0x2E479f3E98cDd6B6cF32bE3E563207Fa90578642";

export const CONTRACT_ADDRESS: `0x${string}` =
  ((process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    DEPLOYED_CONTRACT_ADDRESS).trim()) as `0x${string}`;


let globalReadClient: ReturnType<typeof createClient> | null = null;

export function getReadClient() {
  if (!globalReadClient) {
    globalReadClient = createClient({
      chain: studionet,
      endpoint: STUDIONET_RPC,
    });
  }
  return globalReadClient;
}

export function parseContractAddress(): string {
  return CONTRACT_ADDRESS;
}

export async function fetchContractVersion(): Promise<string> {
  const client = getReadClient();
  const res = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_contract_version",
    args: [],
  });
  return String(res);
}

export interface TotalTasksResult {
  count: number;
  isRpcError: boolean;
  errorMessage?: string;
}

export async function fetchTotalTasksDetailed(): Promise<TotalTasksResult> {
  const client = getReadClient();
  try {
    const res = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_total_tasks",
      args: [],
    });
    return { count: Number(res), isRpcError: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { count: 0, isRpcError: true, errorMessage: msg };
  }
}

export async function fetchTotalTasks(): Promise<number> {
  const res = await fetchTotalTasksDetailed();
  return res.count;
}

function normalizeTask(raw: Record<string, unknown>): TaskRecord {
  return {
    id: Number(raw.id ?? 0),
    creator: String(raw.creator ?? ""),
    worker: String(raw.worker ?? ""),
    title: String(raw.title ?? ""),
    category: (String(raw.category ?? "General")) as TaskRecord["category"],
    sla_specification: String(raw.sla_specification ?? ""),
    expected_format: (String(raw.expected_format ?? "json")) as TaskRecord["expected_format"],
    escrow_amount: String(raw.escrow_amount ?? "0"),
    worker_bond: String(raw.worker_bond ?? "0"),
    dispute_deposit: String(raw.dispute_deposit ?? "0"),
    status: (String(raw.status ?? "open")) as TaskRecord["status"],
    deliverable_url: String(raw.deliverable_url ?? ""),
    artifact_payload: String(raw.artifact_payload ?? ""),
    evidence_hash: String(raw.evidence_hash ?? ""),
    created_at: Number(raw.created_at ?? 0),
    deadline: Number(raw.deadline ?? 0),
    review_window: Number(raw.review_window ?? 0),
    review_deadline: Number(raw.review_deadline ?? 0),
    defense_window: Number(raw.defense_window ?? 0),
    defense_deadline: Number(raw.defense_deadline ?? 0),
    attempt_count: Number(raw.attempt_count ?? 0),
    last_attempt_at: Number(raw.last_attempt_at ?? 0),
  };
}

export interface DetailedTaskResult {
  task: TaskRecord | null;
  isRpcError: boolean;
  errorMessage?: string;
}

export async function fetchTaskDetailed(taskId: number): Promise<DetailedTaskResult> {
  const client = getReadClient();
  try {
    const raw = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_task",
      args: [taskId],
    })) as Record<string, unknown>;
    if (!raw || Object.keys(raw).length === 0) return { task: null, isRpcError: false };
    return { task: normalizeTask(raw), isRpcError: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { task: null, isRpcError: true, errorMessage: msg };
  }
}

export async function fetchTask(taskId: number): Promise<TaskRecord | null> {
  const res = await fetchTaskDetailed(taskId);
  return res.task;
}

export async function fetchTasksByStatus(
  status: string,
  offset = 0,
  limit = 30
): Promise<TaskRecord[]> {
  const client = getReadClient();
  try {
    const list = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_tasks_by_status",
      args: [status, offset, limit],
    })) as Record<string, unknown>[];
    if (!Array.isArray(list)) return [];
    return list.map(normalizeTask);
  } catch {
    return [];
  }
}

export interface DetailedDiscoveryResult {
  tasks: TaskRecord[];
  failedIds: number[];
  totalCount: number;
  isRpcError: boolean;
  isFallback: boolean;
  errorMessage?: string;
}

export interface ResilientDiscoveryResult {
  tasks: TaskRecord[];
  failedIds: number[];
  totalCount: number;
  isRpcError?: boolean;
}

export async function fetchTasksDetailed(
  status: string,
  offset = 0,
  limit = 50
): Promise<DetailedDiscoveryResult> {
  const client = getReadClient();
  const totalRes = await fetchTotalTasksDetailed();

  if (totalRes.isRpcError) {
    return {
      tasks: [],
      failedIds: [],
      totalCount: 0,
      isRpcError: true,
      isFallback: false,
      errorMessage: totalRes.errorMessage,
    };
  }

  const totalCount = totalRes.count;

  // Genuine empty state on-chain
  if (totalCount <= 0) {
    return {
      tasks: [],
      failedIds: [],
      totalCount: 0,
      isRpcError: false,
      isFallback: false,
    };
  }

  try {
    const list = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_tasks_by_status",
      args: [status, offset, limit],
    })) as Record<string, unknown>[];
    if (Array.isArray(list)) {
      return {
        tasks: list.map(normalizeTask),
        failedIds: [],
        totalCount,
        isRpcError: false,
        isFallback: false,
      };
    }
  } catch (err) {
    console.warn("Bulk get_tasks_by_status failed, attempting individual discovery:", err);
  }

  // Fallback: Individual ID fetching with failedIds tracking
  const tasks: TaskRecord[] = [];
  const failedIds: number[] = [];
  const startId = Math.max(1, totalCount - offset);
  const endId = Math.max(1, startId - limit + 1);

  for (let i = startId; i >= endId; i--) {
    try {
      const task = await fetchTask(i);
      if (task) {
        if (status === "all" || task.status === status) {
          tasks.push(task);
        }
      } else {
        failedIds.push(i);
      }
    } catch {
      failedIds.push(i);
    }
  }

  return {
    tasks,
    failedIds,
    totalCount,
    isRpcError: false,
    isFallback: true,
  };
}

export async function fetchTasksResilient(
  status: string,
  offset = 0,
  limit = 50
): Promise<ResilientDiscoveryResult> {
  const detailed = await fetchTasksDetailed(status, offset, limit);
  return {
    tasks: detailed.tasks,
    failedIds: detailed.failedIds,
    totalCount: detailed.totalCount,
    isRpcError: detailed.isRpcError,
  };
}

export async function fetchDispute(taskId: number): Promise<DisputeRecord | null> {
  const client = getReadClient();
  try {
    const raw = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_dispute",
      args: [taskId],
    })) as Record<string, unknown>;
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      task_id: Number(raw.task_id ?? taskId),
      disputant: String(raw.disputant ?? ""),
      allegations: String(raw.allegations ?? ""),
      defense_rebuttal: String(raw.defense_rebuttal ?? ""),
      disputed_at: Number(raw.disputed_at ?? 0),
      defended_at: Number(raw.defended_at ?? 0),
    };
  } catch {
    return null;
  }
}

export async function fetchDisputeRuling(
  taskId: number
): Promise<DisputeRulingRecord | null> {
  const client = getReadClient();
  try {
    const raw = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_dispute_ruling",
      args: [taskId],
    })) as Record<string, unknown>;
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      task_id: Number(raw.task_id ?? taskId),
      verdict: (String(raw.verdict ?? "UNDETERMINED")) as DisputeRulingRecord["verdict"],
      worker_bps: Number(raw.worker_bps ?? 0),
      worker_payout: String(raw.worker_payout ?? "0"),
      creator_refund: String(raw.creator_refund ?? "0"),
      criteria_results: String(raw.criteria_results ?? "[]"),
      reasoning: String(raw.reasoning ?? ""),
      ruled_at: Number(raw.ruled_at ?? 0),
    };
  } catch {
    return null;
  }
}

export async function fetchAgentProfile(
  address: string
): Promise<AgentProfileRecord | null> {
  const client = getReadClient();
  try {
    const raw = (await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_agent_profile",
      args: [address],
    })) as Record<string, unknown>;
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      address: String(raw.address ?? address),
      tasks_created: Number(raw.tasks_created ?? 0),
      tasks_completed: Number(raw.tasks_completed ?? 0),
      disputes_won: Number(raw.disputes_won ?? 0),
      disputes_lost: Number(raw.disputes_lost ?? 0),
      slashed_bonds: String(raw.slashed_bonds ?? "0"),
      reliability_score: Number(raw.reliability_score ?? 80),
    };
  } catch {
    return null;
  }
}
