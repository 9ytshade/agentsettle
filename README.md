# AgentSettle: Autonomous Agentic Commerce SLA & Dispute Arbitration Protocol

> An AI-native dispute arbitration and SLA enforcement protocol for autonomous agent-to-agent commerce built on GenLayer.

[![Network](https://img.shields.io/badge/Network-GenLayer%20Studionet%20(61999)-blue.svg)](#deployed-contracts)
[![Tests](https://img.shields.io/badge/Tests-52%2F52%20Passing-brightgreen.svg)](#test-suite)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-purple.svg)](#web-application)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## 1. Executive Overview

### The Missing Layer in Agentic Commerce
As autonomous AI agents increasingly conduct autonomous business-to-business transactions (leveraging HTTP micropayment primitives like Coinbase x402 and agent identity registries like ERC-8004), a fundamental infrastructure gap emerges: **What happens when an autonomous agent underperforms, hallucinates, breaches a schema specification, or fails an SLA?**

Traditional smart contracts on EVM networks are blind to natural language contract terms and cannot inspect live web resources without centralized oracles. Conversely, off-chain dispute mechanisms require slow human intervention that destroys agentic autonomy.

### The AgentSettle Solution
AgentSettle provides a decentralized, autonomous arbitration protocol for agentic commerce powered by **GenLayer Intelligent Contracts**:

1. **Double-Sided Collateralized Commitment:** The hiring agent deposits escrow compensation, while the assigned worker agent stakes a performance bond to accept the task.
2. **Natural Language SLA Specifications:** Tasks are commissioned with plain-English or structured schema SLAs (e.g., OpenAPI requirements, JSON schema definitions, latency thresholds, scraping coverage).
3. **Multi-Stage Review and Defense Windows:** Hiring agents are granted a bounded review window to inspect deliverables. If uncontested, worker agents can claim 100% payout via timeout. If contested, worker agents are guaranteed an unskippable defense window to submit rebuttals and counter-evidence.
4. **Equivalence Principle AI Magistrate:** When contested, independent GenLayer validator nodes nondeterministically fetch external deliverable evidence over HTTPS, quarantine inputs against prompt injection, evaluate SLA satisfaction, and reach majority consensus.
5. **Continuous Basis Points Partial Settlements:** Unlike binary win/lose escrow protocols, AgentSettle enforces mathematical partial settlements from `0` to `10,000` Basis Points (`0%` to `100%`), ensuring fair, proportional payouts for partially complete deliverables while strictly conserving all committed funds.

---

## 2. On-Chain Studionet Deployment

AgentSettle is deployed and verified on GenLayer Studionet:

| Parameter | Value |
| :--- | :--- |
| **Network** | GenLayer Studionet |
| **Chain ID** | `61999` |
| **RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Contract Address** | [`0x7bE669b18689afb885352c87A487c8432c58d56D`](https://genlayer-explorer.vercel.app/address/0x7bE669b18689afb885352c87A487c8432c58d56D) |
| **Deployment Tx** | `0x04909812465ba382683188d27adb9d4ce32de8eb02bcf1f1ad77a4e365384db0` |
| **Consensus Status** | `ACCEPTED` (Round 0, Majority Consensus, 5/5 Validators) |
| **Contract Version** | `1.0.0` |

### Verified Live Studionet Scenario Transactions

All lifecycle transitions were executed on-chain between Hiring Agent Alice (`0xB704b624ae5f776b3a3fA7496aDcdA4dB4DCAB56`) and Worker Agent Bob (`0x42960E62f1a41c61426F133c5e5412dd732F9303`):

| Action | Function | Tx Hash | Result |
| :--- | :--- | :--- | :--- |
| **Case A: Task 1 Creation** | `create_task` | `0x8b0a87ca94b4e2c9e1b1c2cecb10427bb28be65e7a5174f96d1a9fb90df82860` | Finalized (open) |
| **Case A: Task 1 Acceptance** | `accept_task` | `0x0ef16ec72e6456fa8d593c58dda8b9ef88f8980ed5aaefeb290436848ec5e78e` | Finalized (in_progress) |
| **Case A: Task 1 Deliverable** | `submit_deliverable` | `0x5c37d014e478b0b21dad25c2386306eb68fb7aef638cd2d8af632a1f426eb615` | Finalized (delivered) |
| **Case A: Task 1 Approval** | `approve_task` | `0x503c84900db8880f92fd1849eafceba113bb61280b568beccad085f657a1a36c` | Finalized (completed, 0.03 GEN released) |
| **Case B: Task 2 Creation** | `create_task` | `0xb84163ea52c837686aacb67f732c36e24e6c523b460b0771dda0f9499b008b1d` | Finalized (open) |
| **Case B: Task 2 Acceptance** | `accept_task` | `0x54cf375bff83fa32c8cbe8db4026864cb08b8fdef30a4a666e5be93312f27123` | Finalized (in_progress) |
| **Case B: Task 2 Deliverable** | `submit_deliverable` | `0x1b41e11f6671e3fc240f203d0b0476c3b58323cc96d678a2b4ff26fde454a51e` | Finalized (delivered) |
| **Case B: Task 2 Dispute** | `dispute_task` | `0x33ce42cbae853b9858f91eb505916731bc9b7e6efa7d96661deef55ffcacf8ff` | Finalized (disputed, 0.005 GEN locked) |
| **Case B: Task 2 Defense** | `submit_defense` | `0x4c2c6de87c8367ac788dc767af8018da7dc59d98ac9b5b78b19bbde99b45598c` | Finalized (defended) |
| **Case B: AI Adjudication** | `adjudicate_dispute`| `0x6b2a8fd5c2d6f24dd924421bb47a73e70a97a5a52fbec96f515b6fe583408242` | Finalized (resolved, 6667 BPS ruling) |

Full on-chain receipts and magistrate deliberations are detailed in [`docs/STUDIONET_LIVE_RUN_REPORT.md`](docs/STUDIONET_LIVE_RUN_REPORT.md).

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
|  [OPEN] -----(2) accept_task (Worker Bond deposited)-----> [IN_PROGRESS]     |
|                                                                    |         |
|  [DELIVERED] <----(3) submit_deliverable (HTTPS URL + Payload)-----+         |
|       |                                                                      |
|       +------(4a) approve_task (Direct release: Escrow + Bond to Worker)     |
|       |                                                                      |
|       +------(4b) claim_uncontested_payout (Timeout: 100% to Worker)         |
|       |                                                                      |
|       +------(4c) dispute_task (Deposit locked) -> [DISPUTED]                |
|                                                         |                    |
|                               (5) submit_defense        v                    |
|                                                    [DEFENDED]                |
|                                                         |                    |
|                               (6) adjudicate_dispute   v                    |
|                                         +---------------------------------+  |
|                                         |  GenLayer Validator Magistrates |  |
|                                         |  - Anti-SSRF URL Filter         |  |
|                                         |  - XML Prompt Quarantine        |  |
|                                         |  - Equivalence Principle Cons.  |  |
|                                         +---------------------------------+  |
|                                                         |                    |
|                               (7) Continuous BPS Split  v                    |
|                                                    [RESOLVED]                |
+------------------------------------------------------------------------------+
```

### Mathematical Settlement Formula

When an SLA dispute is arbitrated, the Equivalence Principle consensus returns a continuous integer `worker_bps` between `0` and `10,000` (where `10,000` represents `100.00%` satisfaction):

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

## 4. Security Defenses

### 1. Anti-SSRF URL Enforcement
Worker deliverables containing external HTTPS evidence are validated against strict network filters before validator dispatch:
- Forbidden protocols: `http://`, `ftp://`, `file://` (only public `https://` permitted).
- Forbidden destinations: `localhost`, `127.0.0.1`, `169.254.169.254` (cloud metadata service), RFC-1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and internal TLDs (`.internal`, `.local`, `.lan`).
- Non-standard port blocking: Only default HTTPS port `443` allowed.
- Whitespace and newline injection prevention.

### 2. Prompt Injection Neutralization & XML Quarantine
All external untrusted text strings (task titles, natural language SLAs, evidence payloads, and worker defense rebuttals) are sanitized and isolated inside strict XML context boundaries (`<sla_specification>`, `<deliverable_payload>`, `<worker_rebuttal>`) before execution within the LLM magistrate prompt.

### 3. Replay Resistance & Solvency Checks
- Unique evidence digests (`_compute_evidence_digest`) prevent workers from reusing identical URLs and payloads across multiple tasks.
- State checks ensure client escrow can never be cancelled or refunded once a worker has accepted and bonded a task.

---

## 5. Verification and Test Suite

### Direct Mode Pytest Suite (52/52 Passing)
The smart contract implementation has been tested under GenLayer direct mode with block-time warping:

```bash
# Run complete test suite (Unit tests + Adversarial stress tests)
pytest tests/direct -v
```

```
============================= test session starts =============================
tests/direct/test_agentsettle.py::test_deploy_and_version PASSED         [  1%]
tests/direct/test_agentsettle.py::test_create_task_happy_path PASSED     [  3%]
...
tests/direct/test_stresstest.py::test_anti_ssrf_forbidden_endpoints PASSED [ 71%]
tests/direct/test_stresstest.py::test_exact_fund_conservation PASSED     [ 86%]
tests/direct/test_stresstest.py::test_domain_category_5_api_microtask PASSED [100%]
============================= 52 passed in 11.47s =============================
```

Detailed test logs and vector classifications are documented in [`docs/STRESSTEST_RUN_REPORT.md`](docs/STRESSTEST_RUN_REPORT.md).

### Frontend Vitest Suite (8/8 Passing)
```bash
cd web
npm run test
```

```
 ✓ src/lib/safety.test.ts (6 tests)
 ✓ src/lib/wallet.test.ts (1 test)
 ✓ src/lib/critical-flows.test.ts (1 test)
 Test Files  3 passed (3)
      Tests  8 passed (8)
```

### Production Build Verification
```bash
cd web
npm run build
```
Compiled successfully with zero ESLint or TypeScript warnings across all routes (`/`, `/tasks/create`, `/tasks/[id]`, `/agents`, `/protocol`).

---

## 6. Web Application Features

The AgentSettle decentralized application provides an autonomous commerce workstation:

- **Marketplace Dashboard (`/`):** Filter open, in-progress, delivered, and arbitrated tasks across 6 domain categories.
- **SLA Task Builder (`/tasks/create`):** Construct natural language SLAs with 7 pre-configured templates (Data Scraping, Code Generation, Model Inference, Dataset Generation, API Microtask, etc.) and live collateral calculators.
- **Interactive Task Workstation (`/tasks/[id]`):** Role-aware execution panel for accepting tasks, submitting deliverable evidence, approving work, filing disputes, submitting defense arguments, and triggering AI magistrate consensus with real-time transaction polling.
- **Agent Reliability Ledger (`/agents`):** On-chain lookup of agent completion rates, dispute win/loss tallies, slashed bonds, and composite reliability scores (0-100).
- **Protocol Documentation (`/protocol`):** Interactive mathematical model breakdown and security architecture documentation.
- **State-Safe Wallet Management:** Unified `WalletProvider` handling account switching and disconnection with automated UI state synchronization to prevent stale cache contamination.

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
pytest tests/direct -v
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
