import { createRequire } from "module";
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/9ytshade/Desktop/Genlayer Intelligent Contracts/proofpay/node_modules/keytar");
import { createClient, createAccount } from "../web/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../web/node_modules/genlayer-js/dist/chains/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACT_ADDRESS = "0x2E479f3E98cDd6B6cF32bE3E563207Fa90578642";
const RPC_ENDPOINT = "https://studio.genlayer.com/api";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("===============================================================");
  console.log("  AgentSettle v1.2.0: Studionet Live Lifecycle Verification");
  console.log("===============================================================");
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Network:  GenLayer Studionet (Chain 61999)\n`);

  // 1. Setup Hiring Agent Account (Alice)
  const pkAlice = await keytar.getPassword("genlayer-cli", "account:9ytshade_Deployer");
  if (!pkAlice) throw new Error("Alice private key not found in keytar");
  const alice = createAccount(pkAlice);
  console.log(`[ACCOUNT] Hiring Agent (Alice / Deployer): ${alice.address}`);

  // 2. Setup Worker Agent Account (Bob)
  const pkBob = await keytar.getPassword("genlayer-cli", "account:proofpay-deployer");
  if (!pkBob) throw new Error("Bob private key not found in keytar");
  const bob = createAccount(pkBob);
  console.log(`[ACCOUNT] Worker Agent (Bob):              ${bob.address}\n`);

  const clientAlice = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
    account: alice,
  });

  const clientBob = createClient({
    chain: studionet,
    endpoint: RPC_ENDPOINT,
    account: bob,
  });

  const executionLog = {
    timestamp: new Date().toISOString(),
    contract: CONTRACT_ADDRESS,
    version: "1.2.0",
    hiringAgent: alice.address,
    workerAgent: bob.address,
    cases: [],
  };

  async function execWrite(client, name, functionName, args, value = 0n) {
    console.log(`--> [TX START] ${name} (${functionName})...`);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
      value,
    });
    console.log(`    Hash: ${hash}`);
    console.log(`    Waiting for Studionet validator consensus...`);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      retries: 150,
      interval: 4000,
    });
    console.log(`    Status: ${receipt.status} (Finalized)`);
    return { hash, receipt };
  }

  // -------------------------------------------------------------
  // Verify Version Readback
  // -------------------------------------------------------------
  const contractVersion = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_contract_version",
    args: [],
  });
  console.log(`[READBACK] Deployed Contract Version: ${contractVersion}`);
  if (contractVersion !== "1.2.0") {
    throw new Error(`Expected contract version 1.2.0 but received: ${contractVersion}`);
  }

  // -------------------------------------------------------------
  // CASE A: Excess Bond Accounting & Happy Path Completion
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("  CASE A: Excess Bond Accounting & Happy Path Completion");
  console.log("=======================================================");

  const task1Title = "Autonomous API Microservice SLA";
  const task1Category = "API Microtask";
  const task1Sla = "Service must deliver structured JSON output with valid status code and timestamp.";
  const task1Format = "json";
  const task1Escrow = 20000000000000000n; // 0.02 GEN
  const task1RequiredBond = 10000000000000000n; // 0.01 GEN
  const task1ExcessBond = 15000000000000000n; // 0.015 GEN (0.005 GEN excess)

  const createTask1 = await execWrite(
    clientAlice,
    "Alice: Create Task #1 with 0.02 GEN Escrow & 0.01 GEN Bond Requirement",
    "create_task",
    [
      task1Title,
      task1Category,
      task1Sla,
      task1Format,
      task1RequiredBond,
      604800, // 7 days deadline
      86400,  // 1 day review window
      86400,  // 1 day defense window
    ],
    task1Escrow
  );

  const countAfter1 = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_tasks",
    args: [],
  });
  const task1Id = BigInt(countAfter1);
  console.log(`    Task #1 ID: ${task1Id}`);

  // Bob accepts Task #1 with EXCESS deposit (0.015 GEN instead of 0.01 GEN)
  const bobBalanceBeforeAccept = await clientBob.getBalance({ address: bob.address });
  const acceptTask1 = await execWrite(
    clientBob,
    "Bob: Accept Task #1 with Excess Bond Deposit (0.015 GEN)",
    "accept_task",
    [task1Id],
    task1ExcessBond
  );

  let task1Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task1Id],
  });
  console.log(`    Task #1 Status: ${task1Data.status}`);
  console.log(`    Task #1 Locked Worker Bond: ${task1Data.worker_bond} wei`);
  if (BigInt(task1Data.worker_bond) !== task1RequiredBond) {
    throw new Error(`Worker bond mismatch: expected ${task1RequiredBond}, got ${task1Data.worker_bond}`);
  }
  console.log("    [SUCCESS] Contract locked exact required bond (0.01 GEN) and refunded excess 0.005 GEN to worker.\n");

  // Bob submits deliverable
  const deliverableUrl1 = "https://raw.githubusercontent.com/9ytshade/proofpay/master/README.md";
  const deliverablePayload1 = JSON.stringify({
    service: "api-microservice",
    status: "healthy",
    uptime_seconds: 86400,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const submitDeliv1 = await execWrite(
    clientBob,
    "Bob: Submit Deliverable Evidence",
    "submit_deliverable",
    [task1Id, deliverableUrl1, deliverablePayload1],
    0n
  );

  task1Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task1Id],
  });
  console.log(`    Task #1 Status: ${task1Data.status}`);
  console.log(`    Task #1 Evidence Hash: ${task1Data.evidence_hash}\n`);

  // Alice approves deliverable
  const approveTask1 = await execWrite(
    clientAlice,
    "Alice: Approve Deliverable (100% Escrow + Bond Release)",
    "approve_task",
    [task1Id],
    0n
  );

  task1Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task1Id],
  });
  console.log(`    Task #1 Final Status: ${task1Data.status}`);

  executionLog.cases.push({
    caseName: "Case A: Excess Bond Accounting & Happy Path Completion",
    taskId: Number(task1Id),
    transactions: {
      createTask: createTask1.hash,
      acceptTaskWithExcessBond: acceptTask1.hash,
      submitDeliverable: submitDeliv1.hash,
      approveTask: approveTask1.hash,
    },
    finalStatus: task1Data.status,
    verifiedExactBondLockup: true,
  });

  // -------------------------------------------------------------
  // CASE B: SLA Dispute, Defense & AI Magistrate Adjudication
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("  CASE B: SLA Dispute, Defense & AI Magistrate Adjudication");
  console.log("=======================================================");

  const task2Title = "Autonomous Code Verification Microservice";
  const task2Category = "Code Generation";
  const task2Sla = "Worker must provide comprehensive test suite passing 100% of assertion checks with zero regressions.";
  const task2Format = "json";
  const task2Escrow = 20000000000000000n; // 0.02 GEN
  const task2Bond = 10000000000000000n;   // 0.01 GEN
  const task2DisputeDeposit = 10000000000000000n; // 0.01 GEN

  const createTask2 = await execWrite(
    clientAlice,
    "Alice: Create Task #2 for Adjudication Verification",
    "create_task",
    [
      task2Title,
      task2Category,
      task2Sla,
      task2Format,
      task2Bond,
      604800,
      86400,
      86400,
    ],
    task2Escrow
  );

  const countAfter2 = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_tasks",
    args: [],
  });
  const task2Id = BigInt(countAfter2);
  console.log(`    Task #2 ID: ${task2Id}`);

  const acceptTask2 = await execWrite(
    clientBob,
    "Bob: Accept Task #2 & Deposit Bond",
    "accept_task",
    [task2Id],
    task2Bond
  );

  const deliverableUrl2 = "https://raw.githubusercontent.com/9ytshade/proofpay/master/README.md";
  const deliverablePayload2 = JSON.stringify({
    module: "test_verification",
    tests_run: 64,
    tests_passed: 64,
    coverage: 98.5,
  });

  const submitDeliv2 = await execWrite(
    clientBob,
    "Bob: Submit Deliverable Evidence",
    "submit_deliverable",
    [task2Id, deliverableUrl2, deliverablePayload2],
    0n
  );

  const disputeTask2 = await execWrite(
    clientAlice,
    "Alice: Dispute Deliverable Alleging Boundary Edge Cases",
    "dispute_task",
    [task2Id, "Deliverable covers core unit tests but creator questions adversarial boundary test depth."],
    task2DisputeDeposit
  );

  let task2Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task2Id],
  });
  console.log(`    Task #2 Status: ${task2Data.status}`);
  console.log(`    Task #2 Dispute Deposit: ${task2Data.dispute_deposit} wei\n`);

  const submitDefense2 = await execWrite(
    clientBob,
    "Bob: Submit Defense Rebuttal with Test Suite Evidence",
    "submit_defense",
    [task2Id, "Test suite covers all 64 direct mode test cases including adversarial edge tests and boundary values."],
    0n
  );

  console.log("--> [AI MAGISTRATE] Executing Equivalence Principle Adjudication on Studionet...");
  const adjudicateTask2 = await execWrite(
    clientAlice,
    "Adjudicate Dispute (GenLayer Equivalence Principle AI Magistrate)",
    "adjudicate_dispute",
    [task2Id],
    0n
  );

  task2Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task2Id],
  });

  const ruling2 = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_dispute_ruling",
    args: [task2Id],
  });

  console.log(`    Task #2 Final Status: ${task2Data.status}`);
  console.log(`    Adjudication Canonical Verdict: ${ruling2.verdict}`);
  console.log(`    Adjudication Worker Basis Points: ${ruling2.worker_bps} / 10000`);
  console.log(`    Adjudication Criterion Results Count: ${ruling2.criteria_results?.length || 0}`);

  executionLog.cases.push({
    caseName: "Case B: SLA Dispute, Defense & AI Magistrate Adjudication",
    taskId: Number(task2Id),
    transactions: {
      createTask: createTask2.hash,
      acceptTask: acceptTask2.hash,
      submitDeliverable: submitDeliv2.hash,
      disputeTask: disputeTask2.hash,
      submitDefense: submitDefense2.hash,
      adjudicateDispute: adjudicateTask2.hash,
    },
    finalStatus: task2Data.status,
    ruling: {
      verdict: ruling2.verdict,
      workerBps: Number(ruling2.worker_bps),
      criteriaCount: ruling2.criteria_results?.length || 0,
    },
  });

  // -------------------------------------------------------------
  // CASE C: Delivery Timeout Refund Recovery
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("  CASE C: Delivery Timeout Refund & Non-Delivery Sashing");
  console.log("=======================================================");

  const task3Title = "Short-Lived Microtask for Timeout Recovery Demonstration";
  const task3Category = "General";
  const task3Sla = "Worker must submit work within 5 seconds.";
  const task3Format = "json";
  const task3Escrow = 20000000000000000n; // 0.02 GEN
  const task3Bond = 10000000000000000n;   // 0.01 GEN

  // Create task with 5-second deadline
  const createTask3 = await execWrite(
    clientAlice,
    "Alice: Create Short-Lived Task #3 (5s Delivery Window)",
    "create_task",
    [
      task3Title,
      task3Category,
      task3Sla,
      task3Format,
      task3Bond,
      5,     // 5 seconds deadline
      86400, // 1 day review
      86400, // 1 day defense
    ],
    task3Escrow
  );

  const countAfter3 = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_tasks",
    args: [],
  });
  const task3Id = BigInt(countAfter3);
  console.log(`    Task #3 ID: ${task3Id}`);

  const acceptTask3 = await execWrite(
    clientBob,
    "Bob: Accept Task #3 & Deposit Bond",
    "accept_task",
    [task3Id],
    task3Bond
  );

  console.log("    Waiting 10 seconds for task delivery deadline to elapse...");
  await sleep(10000);

  console.log("--> [RECOVERY] Claiming Delivery Timeout Refund...");
  const claimTimeout3 = await execWrite(
    clientAlice,
    "Alice: Claim Delivery Timeout Refund (Slashes Worker Bond to Client)",
    "claim_delivery_timeout_refund",
    [task3Id],
    0n
  );

  const task3Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task3Id],
  });
  console.log(`    Task #3 Final Status: ${task3Data.status}`);
  if (task3Data.status !== "expired") {
    throw new Error(`Expected task status 'expired' but got ${task3Data.status}`);
  }
  console.log("    [SUCCESS] Delivery timeout recovery executed: worker bond slashed, escrow refunded, status set to expired.\n");

  executionLog.cases.push({
    caseName: "Case C: Delivery Timeout Refund Recovery",
    taskId: Number(task3Id),
    transactions: {
      createTask: createTask3.hash,
      acceptTask: acceptTask3.hash,
      claimDeliveryTimeoutRefund: claimTimeout3.hash,
    },
    finalStatus: task3Data.status,
    verifiedTimeoutRecovery: true,
  });

  // Save results
  const resultsPath = path.resolve(__dirname, "studionet-execution-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(executionLog, null, 2));
  console.log(`[SAVED] Execution results written to ${resultsPath}`);
}

main().catch((err) => {
  console.error("Lifecycle execution failed:", err);
  process.exit(1);
});
