import { createRequire } from "module";
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/9ytshade/Desktop/Genlayer Intelligent Contracts/proofpay/node_modules/keytar");
import { createClient, createAccount } from "../web/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../web/node_modules/genlayer-js/dist/chains/index.js";
import fs from "fs";

const CONTRACT_ADDRESS = "0x7bE669b18689afb885352c87A487c8432c58d56D";
const RPC_ENDPOINT = "https://studio.genlayer.com/api";

async function main() {
  console.log("===============================================================");
  console.log("  AgentSettle v1.0.0: Studionet Live Lifecycle Verification");
  console.log("===============================================================");
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Network:  GenLayer Studionet (Chain 61999)\n`);

  // 1. Setup Hiring Agent Account (Alice)
  const pkAlice = await keytar.getPassword("genlayer-cli", "account:9ytshade_Deployer");
  if (!pkAlice) throw new Error("Alice private key not found in keytar");
  const alice = createAccount(pkAlice);
  console.log(`[ACCOUNT] Hiring Agent (Alice): ${alice.address}`);

  // 2. Setup Worker Agent Account (Bob)
  const pkBob = await keytar.getPassword("genlayer-cli", "account:proofpay-deployer");
  if (!pkBob) throw new Error("Bob private key not found in keytar");
  const bob = createAccount(pkBob);
  console.log(`[ACCOUNT] Worker Agent (Bob):   ${bob.address}\n`);

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
      retries: 120,
      interval: 5000,
    });
    console.log(`    Status: ${receipt.status} (Finalized)`);
    return { hash, receipt };
  }

  // -------------------------------------------------------------
  // CASE A: Direct Lifecycle (Create -> Accept -> Deliver -> Approve)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("  CASE A: Direct Multi-Agent Commerce Lifecycle");
  console.log("=======================================================");

  const task1Title = "Autonomous Subgraph Indexer SLA";
  const task1Category = "API Microtask";
  const task1Sla = "Indexer microservice must parse ERC-20 transfer events and return clean JSON response conforming to schema with status: success and block height.";
  const task1Format = "json";
  const task1Escrow = 20000000000000000n; // 0.02 GEN
  const task1Bond = 10000000000000000n;   // 0.01 GEN

  const createTask1 = await execWrite(
    clientAlice,
    "Alice: Create Task #1 (Autonomous Subgraph Indexer)",
    "create_task",
    [
      task1Title,
      task1Category,
      task1Sla,
      task1Format,
      task1Bond,
      604800, // 7 days deadline
      86400,  // 1 day review
      86400,  // 1 day defense
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

  let task1Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task1Id],
  });
  console.log(`    Task #1 Status: ${task1Data.status}`);
  console.log(`    Task #1 Escrow Locked: ${task1Data.escrow_amount} wei`);
  console.log(`    Task #1 Required Bond: ${task1Data.worker_bond} wei\n`);

  // Bob accepts Task #1
  const acceptTask1 = await execWrite(
    clientBob,
    "Bob: Accept Task #1 & Deposit Performance Bond",
    "accept_task",
    [task1Id],
    task1Bond
  );

  task1Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task1Id],
  });
  console.log(`    Task #1 Status: ${task1Data.status}`);
  console.log(`    Task #1 Assigned Worker: ${task1Data.worker}\n`);

  // Bob submits deliverable
  const deliverableUrl1 = "https://raw.githubusercontent.com/9ytshade/proofpay/master/README.md";
  const deliverablePayload1 = JSON.stringify({
    service: "indexer-microservice",
    status: "success",
    indexed_blocks: 1500,
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
  console.log(`    Task #1 Evidence Digest: ${task1Data.evidence_hash}\n`);

  // Alice approves deliverable directly
  const approveTask1 = await execWrite(
    clientAlice,
    "Alice: Approve Deliverable (100% Payout + Bond Release)",
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

  const bobProfileA = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_agent_profile",
    args: [bob.address],
  });
  console.log(`    Bob Tasks Completed: ${bobProfileA.tasks_completed}`);
  console.log(`    Bob Reliability Score: ${bobProfileA.reliability_score}/100\n`);

  executionLog.cases.push({
    name: "Case A: Direct Multi-Agent Commerce Lifecycle",
    taskId: Number(task1Id),
    createTx: createTask1.hash,
    acceptTx: acceptTask1.hash,
    deliverTx: submitDeliv1.hash,
    approveTx: approveTask1.hash,
    finalStatus: task1Data.status,
    payoutReleased: (task1Escrow + task1Bond).toString(),
  });

  // -------------------------------------------------------------
  // CASE B: Contested SLA Dispute & AI Magistrate Adjudication
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("  CASE B: Contested SLA Dispute & AI Magistrate Consensus");
  console.log("=======================================================");

  const task2Title = "LLM Data Extraction Microservice SLA";
  const task2Category = "Data Scraping";
  const task2Sla = "Agent must extract clean structured JSON tables from raw documentation with verified metadata and zero hallucinated schema keys.";
  const task2Format = "json";
  const task2Escrow = 20000000000000000n; // 0.02 GEN
  const task2Bond = 10000000000000000n;   // 0.01 GEN
  const task2DisputeDeposit = 5000000000000000n; // 0.005 GEN

  const createTask2 = await execWrite(
    clientAlice,
    "Alice: Create Task #2 (LLM Data Extraction)",
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

  // Bob accepts Task #2
  const acceptTask2 = await execWrite(
    clientBob,
    "Bob: Accept Task #2 & Deposit Performance Bond",
    "accept_task",
    [task2Id],
    task2Bond
  );

  // Bob submits deliverable
  const deliverableUrl2 = "https://raw.githubusercontent.com/9ytshade/proofpay/master/README.md";
  const deliverablePayload2 = JSON.stringify({
    dataset: "genlayer-docs",
    records_extracted: 42,
    schema_conformant: true,
    confidence_score: 0.96,
  });

  const submitDeliv2 = await execWrite(
    clientBob,
    "Bob: Submit Deliverable Evidence",
    "submit_deliverable",
    [task2Id, deliverableUrl2, deliverablePayload2],
    0n
  );

  // Alice raises dispute
  const allegations = "Deliverable conforms to JSON schema but extracted 42 items instead of target 50 rows. Requesting partial settlement arbitration.";
  const disputeTask2 = await execWrite(
    clientAlice,
    "Alice: Raise Formal SLA Dispute",
    "dispute_task",
    [task2Id, allegations],
    task2DisputeDeposit
  );

  let task2Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task2Id],
  });
  console.log(`    Task #2 Status: ${task2Data.status}`);
  console.log(`    Task #2 Dispute Deposit Locked: ${task2Data.dispute_deposit} wei\n`);

  // Bob submits defense rebuttal
  const defenseRebuttal = "Source documentation only contained 42 valid items total in the target category. Extraction was 100% comprehensive with zero omissions.";
  const submitDefense2 = await execWrite(
    clientBob,
    "Bob: Submit Defense Rebuttal",
    "submit_defense",
    [task2Id, defenseRebuttal],
    0n
  );

  task2Data = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_task",
    args: [task2Id],
  });
  console.log(`    Task #2 Status: ${task2Data.status}\n`);

  // Invoke AI Magistrate Consensus Adjudication
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
  console.log(`    Task #2 Final Status: ${task2Data.status}`);

  const ruling2 = await clientAlice.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_dispute_ruling",
    args: [task2Id],
  });
  console.log(`    Dispute Ruling Verdict: ${ruling2.verdict}`);
  console.log(`    Worker BPS: ${ruling2.worker_bps} / 10000`);
  console.log(`    Worker Payout: ${ruling2.worker_payout} wei`);
  console.log(`    Creator Refund: ${ruling2.creator_refund} wei`);
  console.log(`    Reasoning: ${ruling2.reasoning}\n`);

  executionLog.cases.push({
    name: "Case B: Contested SLA Dispute & AI Magistrate Consensus",
    taskId: Number(task2Id),
    createTx: createTask2.hash,
    acceptTx: acceptTask2.hash,
    deliverTx: submitDeliv2.hash,
    disputeTx: disputeTask2.hash,
    defenseTx: submitDefense2.hash,
    adjudicateTx: adjudicateTask2.hash,
    finalStatus: task2Data.status,
    verdict: ruling2.verdict,
    workerBps: Number(ruling2.worker_bps),
    workerPayout: ruling2.worker_payout.toString(),
    creatorRefund: ruling2.creator_refund.toString(),
    reasoning: ruling2.reasoning,
  });

  // Write execution log
  fs.writeFileSync(
    "scripts/studionet-execution-results.json",
    JSON.stringify(executionLog, null, 2),
    "utf-8"
  );
  console.log("Execution log saved to scripts/studionet-execution-results.json");
  console.log("\n=======================================================");
  console.log("  ALL STUDIONET LIFECYCLE SCENARIOS COMPLETED SUCCESSFULLY");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR in scenario execution:", err);
  process.exit(1);
});
