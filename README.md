# AgentSettle: Autonomous Agentic Commerce SLA & Dispute Arbitration Protocol

> An AI-native dispute arbitration and SLA enforcement protocol for autonomous agent-to-agent commerce built on GenLayer.

[![Network](https://img.shields.io/badge/Network-GenLayer%20Studionet%20(61999)-blue.svg)](#deployed-contracts)
[![Python Tests](https://img.shields.io/badge/Python%20Tests-64%2F64%20Passing-brightgreen.svg)](#direct-mode-pytest-suite-6464-passing)
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-33%2F33%20Passing-brightgreen.svg)](#frontend-vitest-suite-3333-passing)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-purple.svg)](#web-application)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## 1. Executive Overview

### The Missing Layer in Agentic Commerce
As autonomous AI agents increasingly conduct autonomous business-to-business transactions (leveraging HTTP micropayment primitives like Coinbase x402 and agent identity registries like ERC-8004), a fundamental infrastructure gap emerges: **What happens when an autonomous agent underperforms, hallucinates, breaches a schema specification, or fails an SLA?**

Traditional smart contracts on EVM networks are blind to natural language contract terms and cannot inspect live web resources without centralized oracles. Conversely, off-chain dispute mechanisms require slow human intervention that destroys agentic autonomy.

### The AgentSettle Solution
AgentSettle provides a decentralized, autonomous arbitration protocol for agentic commerce powered by **GenLayer Intelligent Contracts**:

1. **Double-Sided Collateralized Commitment:** The hiring agent deposits escrow compensation, while the assigned worker agent stakes a performance bond to accept the task. Any excess bond deposited above the exact requirement is immediately refunded to the worker upon acceptance.
2. **Natural Language SLA Specifications:** Tasks are commissioned with plain-English or structured schema SLAs (e.g., OpenAPI requirements, JSON schema definitions, latency thresholds, scraping coverage).
3. **Multi-Stage Review and Defense Windows:** Hiring agents are granted a bounded review window to inspect deliverables. If uncontested, worker agents can claim 100% payout via timeout. If contested, worker agents are guaranteed an unskippable defense window to submit rebuttals and counter-evidence.
4. **Authoritative Bounded Deadlines and Non-Performance Recovery:** If an assigned worker never delivers before the task deadline, the hiring agent can invoke `claim_delivery_timeout_refund`, which slashes the worker bond to the client and refunds 100% of escrow. Late submissions, late disputes, and late defense filings are strictly rejected by on-chain deadline guards.
5. **Repeated Dispute Exhaustion Recovery:** If consecutive adjudication attempts return `UNDETERMINED` or stall past the exhaustion timeout (86,400s), either party can trigger `resolve_exhausted_dispute` to return 100% of escrow and dispute deposits to the client and release the bond back to the worker, completely eliminating indefinite escrow lockup.
6. **Substantive Equivalence Principle Validator Agreement:** Independent validator nodes independently score each itemized SLA criterion, derive canonical verdicts and continuous worker basis points, and enforce consensus on criteria counts, ruling consistency, and exact BPS splits (`validate_ruling_agreement`).
7. **Continuous Basis Points Partial Settlements:** Unlike binary win/lose escrow protocols, AgentSettle enforces mathematical partial settlements from `0` to `10,000` Basis Points (`0%` to `100%`), ensuring fair, proportional payouts for partially complete deliverables while strictly conserving all committed funds.

---

## 2. On-Chain Studionet Deployment

AgentSettle v1.2.0 is deployed and verified on GenLayer Studionet:

| Parameter | Value |
| :--- | :--- |
| **Network** | GenLayer Studionet |
| **Chain ID** | `61999` |
| **RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Deployer Account** | [`0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56`](https://genlayer-explorer.vercel.app/address/0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56) (`9ytshade_Deployer`) |
| **Contract Address** | [`0x2E479f3E98cDd6B6cF32bE3E563207Fa90578642`](https://genlayer-explorer.vercel.app/address/0x2E479f3E98cDd6B6cF32bE3E563207Fa90578642) |
| **Deployment Tx** | `0x94a89dd3c3a85389d8d5992ec167a92a33e9b8582793de8cb6a34edbd146b193` |
| **Consensus Status** | `FINALIZED` (Round 0, Majority Consensus, 5/5 Validators) |
| **Contract Version** | `1.2.0` |

### Verified Live Studionet Scenario Transactions

All lifecycle transitions were executed on-chain between Hiring Agent Alice (`0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56`) and Worker Agent Bob (`0x42960E62f1a41c61426F133c5e5412dd732F9303`):

| Scenario | Action / Method | Tx Hash | Result & State |
| :--- | :--- | :--- | :--- |
| **Case A** | `create_task` | `0x0735d6850a60ff3c030a37b9dae762206c58d87b8bde8bf45981b1eaee649e72` | Finalized (Task #1 created, 0.02 GEN escrow locked) |
| **Case A** | `accept_task` | `0x3233500f6b54345c564cb00c9e257d791042ab18b03d07acdd5f49b16bbb91c6` | Finalized (Deposited 0.015 GEN; exact 0.01 GEN locked, 0.005 GEN refunded) |
| **Case A** | `submit_deliverable` | `0x3aa860b1f920516719052ec1cfa67b7690208aaea5bfefea7fc3371b2a79f13e` | Finalized (Status `delivered`, evidence hash generated) |
| **Case A** | `approve_task` | `0x614dc55f199c71561429caa1475dd384c9f34888cc8ec6ec8d4c1bccbeaf2a4a` | Finalized (Status `completed`, 100% escrow + bond released) |
| **Case B** | `create_task` | `0x74cc62c5bc28ea07fd7f9daa0c8a92ffa88cf5ac708201fcfbfc94286cc7cb58` | Finalized (Task #2 created, 0.02 GEN escrow locked) |
| **Case B** | `accept_task` | `0x96287f6f29915d00ad5de94022aefd3f920a464b26223cd0f8ec234de8ebff78` | Finalized (Status `in_progress`, 0.01 GEN bond locked) |
| **Case B** | `submit_deliverable` | `0xa4f1694c0ffb2ebacd4c3d175496f032424b6356f7eb7b08c70181b91069fa36` | Finalized (Status `delivered`, evidence hash stored) |
| **Case B** | `dispute_task` | `0x42a48615f7bf40624a144d0b669f0fdd534adf97e3d8a1f5d38b5c40a08cca6c` | Finalized (Status `disputed`, 0.01 GEN dispute deposit locked) |
| **Case B** | `submit_defense` | `0x4279ca1dd2267b04bcfe581b5a60f996cc44e769afc395f6ef977ea03118d31c` | Finalized (Status `defended`, rebuttal recorded) |
| **Case B** | `adjudicate_dispute`| `0x7b656f3ecc0be1849b49f3e7e2f256afeffbb91ab51f58b53ba31a9472a0fdc3` | Finalized (AI Magistrate Equivalence Principle consensus) |
| **Case C** | `create_task` | `0xb2c0238c312922db8d31b1ecf918312648ca8aec5482b9473b44cf2367954ecb` | Finalized (Task #3 created with 5s delivery window) |
| **Case C** | `accept_task` | `0x2edc9e5952dda72c796d20950304f0dea45568d53fb69800eab777d8205e6b93` | Finalized (Status `in_progress`, 0.01 GEN bond locked) |
| **Case C** | `claim_delivery_timeout_refund` | `0x59949ee245040893c4b7d8947659de796393129ab3499ba654550d435d2822b8` | Finalized (Status `expired`, bond slashed to client, escrow refunded) |

Authoritative on-chain execution logs are saved in [`scripts/studionet-execution-results.json`](scripts/studionet-execution-results.json) and detailed in [`docs/STUDIONET_LIVE_RUN_REPORT.md`](docs/STUDIONET_LIVE_RUN_REPORT.md).

---

## 3. Protocol Architecture

```
                  +----------------------------------------------+
                  |            Hiring Agent (Client)             |
                  +----------------------------------------------+
                                         |
                                (1) create_task (Escrow locked)
                                         v
+------------------------------------------------------------------------------+
|                        AgentSettle Intelligent Contract                      |
|                                                                              |
|  [OPEN] -----(2) accept_task (Worker Bond locked; excess refunded)-------->  |
|                                                                              |
|                                   [IN_PROGRESS]                              |
|                                     |        |                               |
|        (Worker never delivers:      |        | (Delivers before deadline)    |
|         claim_delivery_timeout_refund)       v                               |
|                     |             [DELIVERED]                                |
|                     v               |                                        |
|                 [EXPIRED]           +------(4a) approve_task (100% Payout)   |
|            (Bond slashed to client) |                                        |
|                                     +------(4b) claim_uncontested_payout     |
|                                     |           (Uncontested timeout)        |
|                                     |                                        |
|                                     +------(4c) dispute_task (Deposit locked)|
|                                                        |                     |
|                               (5) submit_defense       v                     |
|                                                    [DEFENDED]                |
|                                                        |                     |
|                               (6) adjudicate_dispute   v                     |
|                                         +---------------------------------+  |
|                                         |  GenLayer Validator Magistrates |  |
|                                         |  - Anti-SSRF URL Filter         |  |
|                                         |  - Inaccessibility Safeguard    |  |
|                                         |  - XML Prompt Quarantine        |  |
|                                         |  - Criterion Consensus Check    |  |
|                                         |  - Basis Points Derivation      |  |
|                                         +---------------------------------+  |
|                                                        |                     |
|                               (7) Continuous BPS Split v                     |
|                                                    [RESOLVED]                |
|                                                                              |
|   (If repeatedly UNDETERMINED: resolve_exhausted_dispute -> [EXHAUSTED])     |
+------------------------------------------------------------------------------+
```

### Mathematical Settlement Formula

When an SLA dispute is arbitrated, the Equivalence Principle consensus derives a continuous integer `worker_bps` between `0` and `10,000` (where `10,000` represents `100.00%` satisfaction):

$$\text{worker\_escrow\_share} = \left\lfloor \frac{\text{escrow\_amount} \times \text{worker\_bps}}{10000} \right\rfloor$$
$$\text{creator\_escrow\_share} = \text{escrow\_amount} - \text{worker\_escrow\_share}$$

**Collateral Distribution Rules:**
- If `worker_bps == 10000` (`FULL_PAYOUT_WORKER`): Worker receives 100% escrow + full worker bond + dispute deposit (as cost recompense).
- If `worker_bps == 0` (`FULL_REFUND_CLIENT`): Client receives 100% escrow + full dispute deposit + full slashed worker bond.
- If `0 < worker_bps < 10000` (`PARTIAL_SETTLEMENT`): Worker receives `worker_escrow_share` + their original bond returned; Client receives `creator_escrow_share` + their dispute deposit returned.

In all scenarios:
$$\text{worker\_payout} + \text{creator\_refund} \equiv \text{total\_pool\_custodied}$$
with zero residual balance leakage.

---

## 4. Security & Accounting Defenses

### 1. Substantive Validator Agreement (`validate_ruling_agreement`)
Validator acceptance covers itemized criterion scoring, canonical verdict derivation, and worker basis points, not merely the verdict label:
- Schema verification enforces non-empty reasoning, recognized verdict types, integer BPS bounds, and criterion results.
- Canonical derivation verifies mathematical consistency: `FULL_PAYOUT_WORKER` (10,000 BPS) only if all criteria pass; `FULL_REFUND_CLIENT` (0 BPS) if all fail; `UNDETERMINED` (0 BPS) if any undetermined; `PARTIAL_SETTLEMENT` for mixed criteria.
- Agreement check ensures validators reject malicious leaders proposing altered basis points, inconsistent criterion breakdowns, or malformed rulings.

### 2. Complete Deadline Enforcement & Bounded Recovery
- **Delivery Timeout Recovery (`claim_delivery_timeout_refund`):** Callable by the creator if an assigned worker fails to deliver before the deadline. Slashes worker bond to client and refunds 100% escrow, transitioning status to `expired`.
- **Exhausted Dispute Resolution (`resolve_exhausted_dispute`):** Callable by either party if adjudication attempts reach 5 or exceed 86,400s without a conclusive verdict. Refunds escrow and dispute deposit to client and returns bond to worker (`status = "exhausted"`), preventing indefinite fund lockups.
- **Strict Deadline Guards:** `submit_deliverable` rejects submissions after `deadline`. `dispute_task` rejects disputes after `review_deadline`. `submit_defense` rejects defense filings after `defense_deadline`.

### 3. Exact Bond Accounting
- In `accept_task`, if `bond_deposit > task.worker_bond`, the contract immediately refunds the excess amount to the worker and records exactly `task.worker_bond`.
- Insufficient deposits (`bond_deposit < task.worker_bond`) revert immediately.

### 4. Evidence-Backed Adjudication & Inaccessibility Safeguard
- Public HTTPS evidence URLs are inspected with anti-SSRF filters (forbidding localhost, cloud metadata, RFC-1918 subnets, and non-standard ports).
- If an external URL is inaccessible or fails to fetch and no payload artifact exists, the contract forces `UNDETERMINED` rather than treating failure as proven fraud or breach.

### 5. Frontend Transaction Gating & RPC Error Isolation
- Injected wallet transactions are blocked unless confirmed on GenLayer Studionet (Chain 61999).
- `fetchTasksDetailed` and `fetchTotalTasksDetailed` isolate RPC network dropouts (`isRpcError: true`) from a genuine empty on-chain task registry (`isRpcError: false, tasks: []`), rendering clear recovery guidance rather than deceptive empty states.

---

## 5. Verification and Test Suite

### Direct Mode Pytest Suite (64/64 Passing)
The smart contract implementation has been tested under GenLayer direct mode with block-time warping across 64 comprehensive unit and adversarial tests:

```bash
python -m pytest tests/direct -v
```

```
============================= test session starts =============================
tests/direct/test_agentsettle.py::test_deploy_and_version PASSED         [  1%]
tests/direct/test_agentsettle.py::test_create_task_happy_path PASSED     [  3%]
...
tests/direct/test_issues_recovery_and_agreement.py::test_bond_accounting_exact_deposit PASSED [ 34%]
tests/direct/test_issues_recovery_and_agreement.py::test_bond_accounting_excess_deposit_refunded PASSED [ 35%]
tests/direct/test_issues_recovery_and_agreement.py::test_bond_accounting_insufficient_deposit_reverts PASSED [ 37%]
tests/direct/test_issues_recovery_and_agreement.py::test_late_delivery_submission_reverts PASSED [ 39%]
tests/direct/test_issues_recovery_and_agreement.py::test_late_dispute_submission_reverts PASSED [ 40%]
tests/direct/test_issues_recovery_and_agreement.py::test_late_defense_submission_reverts PASSED [ 42%]
tests/direct/test_issues_recovery_and_agreement.py::test_claim_delivery_timeout_refund_success PASSED [ 43%]
tests/direct/test_issues_recovery_and_agreement.py::test_resolve_exhausted_dispute_success PASSED [ 45%]
tests/direct/test_issues_recovery_and_agreement.py::test_malicious_leader_altered_bps_rejected PASSED [ 46%]
tests/direct/test_issues_recovery_and_agreement.py::test_malicious_leader_inconsistent_criteria_rejected PASSED [ 48%]
tests/direct/test_issues_recovery_and_agreement.py::test_malformed_leader_rulings_rejected PASSED [ 50%]
tests/direct/test_issues_recovery_and_agreement.py::test_inaccessible_evidence_safeguard_forces_undetermined PASSED [ 51%]
...
tests/direct/test_stresstest.py::test_domain_category_5_api_microtask PASSED [100%]
============================= 64 passed in 9.42s =============================
```

### Frontend Vitest Suite (33/33 Passing)
```bash
cd web
npm run test
```

```
 ✓ src/lib/safety.test.ts (8 tests)
 ✓ src/lib/frontend-gating.test.ts (11 tests)
 ✓ src/lib/critical-flows.test.ts (13 tests)
 ✓ src/lib/wallet.test.ts (1 test)
 Test Files  4 passed (4)
      Tests  33 passed (33)
```

### Production Build Verification
```bash
cd web
npm run build
```
Compiled successfully with zero build errors across all routes (`/`, `/tasks/create`, `/tasks/[id]`, `/agents`, `/protocol`).

---

## 6. Web Application Features

The AgentSettle decentralized application provides a high-performance autonomous commerce workstation:

- **Marketplace Dashboard (`/`):** Real-time discovery of open, in-progress, delivered, and arbitrated tasks across 6 domain categories with resilient on-chain loading, RPC failure banners, and newest-first pagination.
- **Interactive Card Quick View Modal:** Instant inspection modal triggered by card selection, surfacing complete natural language SLAs, collateral metrics, deadline timers, counterparty addresses, and one-click workstation routing.
- **SLA Task Builder (`/tasks/create`):** Construct machine-verifiable SLAs with 7 scenario templates, double-sided collateral calculators, and live browser-to-UTC dual-timezone synchronization previews.
- **Interactive Task Workstation (`/tasks/[id]`):** Role-aware execution panel for accepting tasks, submitting deliverable evidence, approving work, filing disputes, submitting defense rebuttals, claiming delivery timeout refunds, and triggering AI magistrate consensus.
- **Agent Reliability Ledger (`/agents`):** On-chain lookup of agent completion rates, dispute win/loss tallies, slashed bonds, and composite reliability scores (0-100).
- **Exhaustive Protocol Specification (`/protocol`):** Comprehensive 7-section guide covering the agentic commerce triad (ERC-8004 + x402 + GenLayer), game theory collateral models, 8-stage finite state machine matrix, Equivalence Principle consensus, and Basis Points fund conservation proofs.
- **State-Safe Wallet Management:** Unified `WalletProvider` handling network gating to Studionet 61999, account switching, and disconnection with automated UI state synchronization to prevent stale cache contamination.

---

## 7. Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- GenLayer CLI (`npm install -g genlayer`)

### Contract Setup
```bash
# Clone the repository
git clone https://github.com/9ytshade/agentsettle.git
cd agentsettle

# Install dependencies and run tests
pip install -r requirements.txt
python -m pytest tests/direct -v
```

### Web Application Setup
```bash
cd web
npm install

# Configure environment
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to interact with AgentSettle on GenLayer Studionet.

---

## 8. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
