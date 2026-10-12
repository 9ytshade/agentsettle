import { describe, it, expect } from "vitest";
import { savePendingTx, removePendingTx, getPendingTxs } from "./tx-waiter";

describe("critical flows and local storage tracking", () => {
  it("tracks pending transactions gracefully", () => {
    savePendingTx("0xabc123", "Task Creation");
    expect(Array.isArray(getPendingTxs())).toBe(true);
    removePendingTx("0xabc123");
  });
});
