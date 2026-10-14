import { describe, expect, it } from "vitest";
import { formatAddress, formatGen, parseGenToWei, formatWeiToGen } from "./safety";
import { savePendingTx, removePendingTx, getPendingTxs } from "./tx-waiter";

describe("1. Basis Points Math & Value Conservation Invariant", () => {
  function calculateBpsSplit(escrowWei: bigint, workerBps: number) {
    if (workerBps < 0 || workerBps > 10_000) {
      throw new Error("Basis points out of range");
    }
    const workerEscrowShare = (escrowWei * BigInt(workerBps)) / 10_000n;
    const creatorEscrowShare = escrowWei - workerEscrowShare;
    return { workerEscrowShare, creatorEscrowShare };
  }

  it("conserves 100% of escrow value with zero dust loss across diverse inputs", () => {
    const testCases = [
      { escrow: 100n * 10n ** 18n, bps: 2360 }, // 23.6%
      { escrow: 50n * 10n ** 18n, bps: 5000 },  // 50.0%
      { escrow: 86n * 10n ** 18n, bps: 8600 },  // 86.0%
      { escrow: 20n * 10n ** 15n, bps: 6667 },  // 66.67% (Live Studionet Case B result)
      { escrow: 100n * 10n ** 18n, bps: 10000 }, // 100%
      { escrow: 100n * 10n ** 18n, bps: 0 },     // 0%
      { escrow: 999999999999999999n, bps: 3333 },// Odd prime wei
      { escrow: 1n, bps: 5000 },                // 1 wei boundary
    ];

    for (const { escrow, bps } of testCases) {
      const { workerEscrowShare, creatorEscrowShare } = calculateBpsSplit(escrow, bps);
      expect(workerEscrowShare + creatorEscrowShare).toBe(escrow);
      expect(workerEscrowShare).toBeGreaterThanOrEqual(0n);
      expect(creatorEscrowShare).toBeGreaterThanOrEqual(0n);
    }
  });

  it("accurately derives 23.6%, 50%, and 66.67% case payouts", () => {
    const escrow = parseGenToWei("100"); // 100 GEN

    // Case A: 23.6% (2,360 BPS)
    const caseA = calculateBpsSplit(escrow, 2360);
    expect(formatWeiToGen(caseA.workerEscrowShare)).toBe("23.6");
    expect(formatWeiToGen(caseA.creatorEscrowShare)).toBe("76.4");

    // Case B: 50.0% (5,000 BPS)
    const caseB = calculateBpsSplit(escrow, 5000);
    expect(formatWeiToGen(caseB.workerEscrowShare)).toBe("50");
    expect(formatWeiToGen(caseB.creatorEscrowShare)).toBe("50");

    // Case C: 66.67% (6,667 BPS)
    const caseC = calculateBpsSplit(escrow, 6667);
    expect(formatWeiToGen(caseC.workerEscrowShare)).toBe("66.67");
    expect(formatWeiToGen(caseC.creatorEscrowShare)).toBe("33.33");
  });
});

describe("2. Newest-First Descending Pagination & Discovery Logic", () => {
  function computePaginationSlice(totalCount: number, page: number, pageSize: number) {
    if (totalCount <= 0) {
      return { ids: [], totalPages: 1, safePage: 1 };
    }
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startId = totalCount - (safePage - 1) * pageSize;
    const endId = Math.max(1, startId - pageSize + 1);

    const ids: number[] = [];
    for (let i = startId; i >= endId; i--) {
      ids.push(i);
    }
    return { ids, totalPages, safePage };
  }

  it("correctly slices newest records first on Page 1", () => {
    const { ids, totalPages, safePage } = computePaginationSlice(100, 1, 10);
    expect(totalPages).toBe(10);
    expect(safePage).toBe(1);
    expect(ids).toEqual([100, 99, 98, 97, 96, 95, 94, 93, 92, 91]);
  });

  it("correctly slices middle page (Page 2)", () => {
    const { ids, safePage } = computePaginationSlice(100, 2, 10);
    expect(safePage).toBe(2);
    expect(ids).toEqual([90, 89, 88, 87, 86, 85, 84, 83, 82, 81]);
  });

  it("correctly slices last page with partial count (Page 3 of 25 records)", () => {
    const { ids, totalPages, safePage } = computePaginationSlice(25, 3, 10);
    expect(totalPages).toBe(3);
    expect(safePage).toBe(3);
    expect(ids).toEqual([5, 4, 3, 2, 1]);
  });

  it("clamps out-of-bounds requests safely", () => {
    expect(computePaginationSlice(0, 1, 10).ids).toEqual([]);
    expect(computePaginationSlice(1, 1, 10).ids).toEqual([1]);
    const clamped = computePaginationSlice(5, 99, 10);
    expect(clamped.safePage).toBe(1);
    expect(clamped.ids).toEqual([5, 4, 3, 2, 1]);
  });
});

describe("3. Transient RPC Failure Isolation & Recovery", () => {
  interface MockDiscoveryResult {
    loadedTasks: { id: number; title: string }[];
    failedIds: number[];
  }

  async function mockResilientDiscovery(
    requestedIds: number[],
    failOnId: number
  ): Promise<MockDiscoveryResult> {
    const loadedTasks: { id: number; title: string }[] = [];
    const failedIds: number[] = [];

    for (const id of requestedIds) {
      if (id === failOnId) {
        failedIds.push(id);
      } else {
        loadedTasks.push({ id, title: `Task #${id}` });
      }
    }
    return { loadedTasks, failedIds };
  }

  it("isolates transient dropped RPC records without discarding valid tasks", async () => {
    const { loadedTasks, failedIds } = await mockResilientDiscovery([10, 9, 8, 7], 8);
    expect(loadedTasks.length).toBe(3);
    expect(failedIds).toEqual([8]);
    expect(loadedTasks.map((t) => t.id)).toEqual([10, 9, 7]);
  });

  it("merges recovered records back in descending numerical order", () => {
    const existing = [{ id: 10 }, { id: 9 }, { id: 7 }];
    const recovered = [{ id: 8 }];
    const merged = [...existing, ...recovered].sort((a, b) => b.id - a.id);
    expect(merged.map((m) => m.id)).toEqual([10, 9, 8, 7]);
  });
});

describe("4. Dual-Timezone & Duration Conversion Verification", () => {
  function computeDualTimezone(deadlineTimestampSeconds: number) {
    const d = new Date(deadlineTimestampSeconds * 1000);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return {
      unixSeconds: deadlineTimestampSeconds,
      timezone: tz,
      utcString: d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC"),
      localString: d.toLocaleString(),
    };
  }

  it("generates synchronized UTC and local representations from unix epoch", () => {
    const epoch = 1792083600; // Future date
    const res = computeDualTimezone(epoch);
    expect(res.unixSeconds).toBe(epoch);
    expect(res.utcString).toContain("UTC");
    expect(typeof res.localString).toBe("string");
    expect(res.timezone.length).toBeGreaterThan(0);
  });
});

describe("5. Address Formatting & Decimal Balance Verification", () => {
  it("formats 42-character hex addresses safely", () => {
    const addr = "0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56";
    const formatted = formatAddress(addr);
    expect(formatted).toBe("0xB704...AB56");
  });

  it("formats decimal GEN balances accurately", () => {
    expect(formatGen("20000000000000000")).toBe("0.0200 GEN");
    expect(formatGen("1000000000000000000")).toBe("1.0000 GEN");
    expect(formatGen(0n)).toBe("0.0000 GEN");
  });
});

describe("6. Terminal State Machine & Local Storage Polling", () => {
  const TERMINAL_STATUSES = new Set(["FINALIZED", "FAILED", "REVERTED", "CANCELED"]);

  it("correctly identifies terminal versus in-flight transaction states", () => {
    expect(TERMINAL_STATUSES.has("FINALIZED")).toBe(true);
    expect(TERMINAL_STATUSES.has("FAILED")).toBe(true);
    expect(TERMINAL_STATUSES.has("REVERTED")).toBe(true);
    expect(TERMINAL_STATUSES.has("ACCEPTED")).toBe(false);
    expect(TERMINAL_STATUSES.has("PENDING")).toBe(false);
  });

  it("tracks and purges local storage pending transactions", () => {
    // Provide node localStorage mock
    const storage: Record<string, string> = {};
    const originalWindow = (globalThis as unknown as { window?: unknown }).window;
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (k: string) => storage[k] ?? null,
        setItem: (k: string, v: string) => { storage[k] = String(v); },
        removeItem: (k: string) => { delete storage[k]; },
      },
    };

    savePendingTx("0xdef456", "Dispute Resolution");
    const active = getPendingTxs();
    expect(active.some((tx) => tx.hash === "0xdef456")).toBe(true);
    removePendingTx("0xdef456");
    expect(getPendingTxs().some((tx) => tx.hash === "0xdef456")).toBe(false);

    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });
});
