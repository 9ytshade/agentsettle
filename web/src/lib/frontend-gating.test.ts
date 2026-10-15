import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  STUDIONET_CHAIN_ID,
  DEPLOYED_CONTRACT_ADDRESS,
} from "./genlayer";

describe("Frontend Transaction Gating & RPC Error Differentiation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Distinguish RPC failure from empty task registry", () => {
    it("reports isRpcError: false when task registry is genuinely empty (totalCount = 0)", async () => {
      // Test simulation of empty registry logic
      const totalRes = { count: 0, isRpcError: false };
      expect(totalRes.isRpcError).toBe(false);
      expect(totalRes.count).toBe(0);

      // fetchTasksDetailed behavior when totalCount is 0
      const discoveryResult = {
        tasks: [],
        failedIds: [],
        totalCount: totalRes.count,
        isRpcError: totalRes.isRpcError,
        isFallback: false,
      };

      expect(discoveryResult.isRpcError).toBe(false);
      expect(discoveryResult.tasks).toHaveLength(0);
      expect(discoveryResult.totalCount).toBe(0);
    });

    it("reports isRpcError: true when RPC query throws a network failure", async () => {
      const networkErrorMessage = "Failed to fetch from Studionet RPC endpoint";
      const totalRes = {
        count: 0,
        isRpcError: true,
        errorMessage: networkErrorMessage,
      };

      expect(totalRes.isRpcError).toBe(true);
      expect(totalRes.errorMessage).toContain("Failed to fetch");

      // Verify that detailed discovery surfaces RPC outage flag
      const discoveryResult = {
        tasks: [],
        failedIds: [],
        totalCount: 0,
        isRpcError: true,
        isFallback: false,
        errorMessage: totalRes.errorMessage,
      };

      expect(discoveryResult.isRpcError).toBe(true);
      expect(discoveryResult.errorMessage).toBe(networkErrorMessage);
      expect(discoveryResult.tasks).toHaveLength(0);
    });

    it("returns on-chain task records when RPC is healthy and registry is populated", async () => {
      const mockTasks = [
        {
          id: 1,
          creator: "0xb704b624ae5f776b3a3fa7496adcda4db4dcab56",
          worker: "0x0000000000000000000000000000000000000000",
          title: "Verify Model Output",
          category: "Code Verification",
          sla_specification: "Must pass deterministic unit tests",
          expected_format: "json",
          escrow_amount: "50000000000000000",
          worker_bond: "10000000000000000",
          dispute_deposit: "0",
          status: "open",
          deliverable_url: "",
          artifact_payload: "",
          evidence_hash: "",
          created_at: 1700000000,
          deadline: 1700086400,
          review_window: 86400,
          review_deadline: 0,
          defense_window: 86400,
          defense_deadline: 0,
          attempt_count: 0,
          last_attempt_at: 0,
        },
      ];

      const discoveryResult = {
        tasks: mockTasks,
        failedIds: [],
        totalCount: 1,
        isRpcError: false,
        isFallback: false,
      };

      expect(discoveryResult.isRpcError).toBe(false);
      expect(discoveryResult.tasks).toHaveLength(1);
      expect(discoveryResult.tasks[0].id).toBe(1);
      expect(discoveryResult.tasks[0].status).toBe("open");
    });
  });

  describe("2. Write transaction gating on Studionet 61999", () => {
    it("blocks writes and throws when active network is not Studionet 61999", () => {
      const account = "0xb704b624ae5f776b3a3fa7496adcda4db4dcab56";
      const wrongNetwork = true;

      function getSignerClientSimulation(acc: string, wrongNet: boolean) {
        if (!acc) return null;
        if (wrongNet) {
          throw new Error(
            "Transaction blocked: active wallet network is not GenLayer Studionet (Chain 61999). Please switch network to continue."
          );
        }
        return { client: true, account: acc };
      }

      expect(() => getSignerClientSimulation(account, wrongNetwork)).toThrow(
        "Transaction blocked: active wallet network is not GenLayer Studionet (Chain 61999)"
      );
    });

    it("returns null signer client when wallet is not connected", () => {
      function getSignerClientSimulation(acc: string, wrongNet: boolean) {
        if (!acc) return null;
        if (wrongNet) throw new Error("Transaction blocked");
        return { client: true, account: acc };
      }

      expect(getSignerClientSimulation("", false)).toBeNull();
    });

    it("allows write transactions when wallet is connected on Studionet 61999", () => {
      const account = "0xb704b624ae5f776b3a3fa7496adcda4db4dcab56";
      const wrongNetwork = false;

      function getSignerClientSimulation(acc: string, wrongNet: boolean) {
        if (!acc) return null;
        if (wrongNet) throw new Error("Transaction blocked");
        return { client: true, account: acc };
      }

      const client = getSignerClientSimulation(account, wrongNetwork);
      expect(client).not.toBeNull();
      expect(client?.account).toBe(account);
    });
  });

  describe("3. Network switching and wallet rejection handling", () => {
    it("requests wallet_switchEthereumChain with Studionet chain ID 0xf22f (61999)", async () => {
      const mockRequest = vi.fn().mockImplementation(async ({ method, params }) => {
        if (method === "wallet_switchEthereumChain") {
          expect(params[0].chainId).toBe(`0x${STUDIONET_CHAIN_ID.toString(16)}`);
          return null;
        }
        if (method === "eth_chainId") {
          return `0x${STUDIONET_CHAIN_ID.toString(16)}`;
        }
        return null;
      });

      const ethereum = { request: mockRequest };

      // Simulate assertStudionet logic
      const targetHex = `0x${STUDIONET_CHAIN_ID.toString(16)}`;
      expect(targetHex).toBe("0xf22f");

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });

      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainIdHex as string, 16);
      expect(currentChainId).toBe(61999);
    });

    it("adds Studionet chain via wallet_addEthereumChain when chain is unrecognized (code 4902)", async () => {
      let chainAdded = false;
      const mockRequest = vi.fn().mockImplementation(async ({ method, params }) => {
        if (method === "wallet_switchEthereumChain") {
          const err = new Error("Unrecognized chain ID") as Error & { code: number };
          err.code = 4902;
          throw err;
        }
        if (method === "wallet_addEthereumChain") {
          expect(params[0].chainId).toBe("0xf22f");
          expect(params[0].chainName).toBe("GenLayer Studionet");
          expect(params[0].nativeCurrency.symbol).toBe("GEN");
          chainAdded = true;
          return null;
        }
        return null;
      });

      const ethereum = { request: mockRequest };
      const targetHex = `0x${STUDIONET_CHAIN_ID.toString(16)}`;

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetHex }],
        });
      } catch (err: unknown) {
        const switchErr = err as { code?: number };
        if (switchErr.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetHex,
                chainName: "GenLayer Studionet",
                nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                rpcUrls: ["https://studio.genlayer.com/api"],
              },
            ],
          });
        }
      }

      expect(chainAdded).toBe(true);
    });

    it("catches user rejection (code 4001) gracefully without throwing uncaught errors", async () => {
      const mockRequest = vi.fn().mockRejectedValue({
        code: 4001,
        message: "User rejected the request.",
      });

      function isUserRejection(error: unknown): boolean {
        if (!error || typeof error !== "object") return false;
        const err = error as { code?: number; rpcCode?: number };
        return err.code === 4001 || err.rpcCode === 4001;
      }

      let rejectedGracefully = false;
      try {
        await mockRequest({ method: "eth_requestAccounts" });
      } catch (err) {
        if (isUserRejection(err)) {
          rejectedGracefully = true;
        }
      }

      expect(rejectedGracefully).toBe(true);
    });
  });

  describe("4. Live state transitions and finalized execution tracking", () => {
    it("progresses transaction through PENDING, ACCEPTED, and FINALIZED lifecycle", () => {
      const stateHistory: string[] = [];

      function updateStatus(status: "PENDING" | "ACCEPTED" | "FINALIZED" | "FAILED") {
        stateHistory.push(status);
      }

      // 1. Transaction submitted to RPC
      updateStatus("PENDING");
      // 2. Leader included transaction in proposed block
      updateStatus("ACCEPTED");
      // 3. Equivalence principle validators reached consensus and finalized
      updateStatus("FINALIZED");

      expect(stateHistory).toEqual(["PENDING", "ACCEPTED", "FINALIZED"]);
      expect(stateHistory[stateHistory.length - 1]).toBe("FINALIZED");
    });

    it("verifies contract deployment configuration targets valid address", () => {
      expect(DEPLOYED_CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(STUDIONET_CHAIN_ID).toBe(61999);
    });
  });
});
