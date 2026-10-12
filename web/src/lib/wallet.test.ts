import { describe, it, expect, beforeEach, vi } from "vitest";
import { refreshPage } from "./use-wallet";

describe("wallet auto-refresh logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules page reload without crashing in node or browser", () => {
    expect(() => refreshPage(10)).not.toThrow();
  });
});
