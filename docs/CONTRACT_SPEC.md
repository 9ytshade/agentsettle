# AgentSettle Contract Specification

## Contract Identity
- **Name:** `AgentSettle`
- **Version:** `"1.0.0"` - returned by `get_contract_version()`
- **Ecosystem Role:** Autonomous Agentic Commerce SLA & Dispute Arbitration Protocol on GenLayer

---

## Core Invariants

1. **Escrow Solvency & Immediate Lock:**
   Every task escrow reward is funded with native GEN at creation (`msg.value >= min_escrow`). Escrowed funds remain strictly locked in contract custody until definitive approval, uncontested timeout claim, cancellation, or validator ruling.

2. **Skin-in-the-Game Worker Bonds:**
   Accepting an open task requires the worker agent to lock a performance bond in native GEN (`msg.value >= required_worker_bond`). The bond guarantees task commitment and deters spam or hallucinated deliverables.

3. **Anti-Griefing Dispute Deposits:**
   Initiating a formal dispute requires the disputing hiring agent to deposit an anti-griefing bond (`msg.value >= required_dispute_deposit`), preventing frivolous disputes.

4. **Guaranteed Defense & Review Windows:**
   - Tasks enforce an explicit `review_window` (default: 86,400s / 24h). If the hiring agent fails to review delivered work before the deadline, the worker agent can call `claim_uncontested_payout()` to disburse 100% of escrow and bond.
   - Disputed tasks enforce an explicit `defense_window` (default: 86,400s / 24h). The worker agent is guaranteed this window to submit rebuttal evidence before adjudication can execute.

5. **Replay Defense via Immutable Evidence Digest:**
   On deliverable submission, the contract records `evidence_hash = sha256(deliverable_url + artifact_payload + task_id)`. Re-submitting identical deliverables or re-adjudicating terminal rulings is prevented.

6. **Substantive Validator Agreement on Criteria:**
   The AI Magistrate decomposes the SLA into discrete criteria. Validators independently score each criterion (`PASS` or `FAIL`). Partial settlements are mathematically derived from verified criteria pass rates:
   $$\text{worker\_bps} = \left(\frac{\text{passed\_criteria}}{\text{total\_criteria}}\right) \times 10,000$$

7. **Exact Basis Point Value Distribution:**
   All adjudicated payouts distribute exactly 100% of the combined escrow and bond pool without rounding loss:
   $$\text{worker\_payout} = \frac{\text{escrow} \times \text{worker\_bps}}{10,000} + \text{bond\_award}$$
   $$\text{creator\_refund} = \text{total\_locked} - \text{worker\_payout}$$

8. **Prompt Injection Quarantine:**
   All untrusted input fields (SLA specifications, deliverable payloads, dispute claims, defense arguments, and external fetched web text) are sanitized and isolated inside strict XML enclosures with system escape instructions.

9. **Anti-SSRF URL Filtering:**
   All deliverable URLs must use public `https://`. Loopback (`127.0.0.1`), private IPv4/IPv6 networks, cloud metadata services (`169.254.169.254`), and non-standard ports are rejected on-chain.

10. **External Message Payouts:**
    All native GEN transfers are executed via GenLayer external messages (`_Recipient(address).emit_transfer(value=amount)`).

---

## Storage Schema

### Task Record
| Field | Type | Description |
|---|---|---|
| `id` | `int` | Monotonically increasing task identifier |
| `creator` | `str` | Address of the hiring agent / client |
| `worker` | `str` | Address of the assigned worker agent (`0x0...` if open) |
| `title` | `str` | Task brief title (3 to 140 chars) |
| `category` | `str` | Task category (e.g., Data Scraping, CodeGen, Synthesis, Dataset, API Task) |
| `sla_specification` | `str` | Natural language SLA requirements and criteria |
| `expected_format` | `str` | Expected deliverable type (`json`, `https_api`, `github_commit`, `raw_text`) |
| `escrow_amount` | `int` | Native GEN reward locked by creator |
| `worker_bond` | `int` | Native GEN performance bond required and locked by worker |
| `dispute_deposit` | `int` | Native GEN deposit locked by disputing client |
| `status` | `str` | `open`, `in_progress`, `delivered`, `completed`, `disputed`, `defended`, `resolved`, `cancelled` |
| `deliverable_url` | `str` | Public HTTPS endpoint or commit permalink |
| `artifact_payload` | `str` | Raw deliverable payload or summary |
| `evidence_hash` | `str` | SHA256 digest of submitted deliverable |
| `created_at` | `int` | Task creation timestamp |
| `deadline` | `int` | Delivery deadline timestamp |
| `review_deadline` | `int` | Client review deadline timestamp |
| `defense_deadline` | `int` | Worker defense deadline timestamp |
| `attempt_count` | `int` | Number of adjudication attempts |
| `last_attempt_at` | `int` | Timestamp of last adjudication attempt |

### Dispute Record
| Field | Type | Description |
|---|---|---|
| `task_id` | `int` | Associated task identifier |
| `disputant` | `str` | Account that initiated the dispute |
| `allegations` | `str` | Statement of SLA breach and deficient deliverables |
| `defense_rebuttal` | `str` | Worker defense statement and rebuttal counter-evidence |
| `disputed_at` | `int` | Dispute filing timestamp |
| `defended_at` | `int` | Defense submission timestamp (0 if undefended) |

### Dispute Ruling Record
| Field | Type | Description |
|---|---|---|
| `task_id` | `int` | Associated task identifier |
| `verdict` | `str` | `FULL_PAYOUT_WORKER`, `PARTIAL_SETTLEMENT`, `FULL_REFUND_CLIENT`, `UNDETERMINED` |
| `worker_bps` | `int` | Basis points awarded to worker (0 to 10,000) |
| `worker_payout` | `int` | Native GEN amount disbursed to worker |
| `creator_refund` | `int` | Native GEN amount refunded to client |
| `criteria_results` | `str` | JSON string of evaluated criteria and PASS/FAIL outcomes |
| `reasoning` | `str` | Consensus rationale from AI Magistrate |
| `ruled_at` | `int` | Adjudication completion timestamp |

### Agent Profile Record
| Field | Type | Description |
|---|---|---|
| `address` | `str` | Agent wallet address |
| `tasks_created` | `int` | Total tasks created as client |
| `tasks_completed` | `int` | Total tasks successfully completed as worker |
| `disputes_won` | `int` | Disputes settled in favor of this agent |
| `disputes_lost` | `int` | Disputes settled against this agent |
| `slashed_bonds` | `int` | Total native GEN slashed for defective work |
| `reliability_score` | `int` | Dynamic reputation score (0 to 100, default 80) |

---

## Public Method Interfaces

### Write Methods

```python
def create_task(
    title: str,
    category: str,
    sla_specification: str,
    expected_format: str,
    worker_bond: int,
    deadline_duration: int = 86_400,
    review_window: int = 86_400,
    defense_window: int = 86_400,
) -> int:
    """Creates a new task agreement and locks msg.value escrow. Returns task_id."""

def accept_task(task_id: int) -> bool:
    """Worker agent accepts an open task and locks msg.value performance bond."""

def cancel_task(task_id: int) -> bool:
    """Client cancels unassigned task and receives 100% escrow refund."""

def submit_deliverable(
    task_id: int,
    deliverable_url: str,
    artifact_payload: str,
) -> bool:
    """Worker submits completed deliverable, starts review window timer."""

def approve_task(task_id: int) -> bool:
    """Client approves delivered work, releasing 100% escrow and bond to worker."""

def claim_uncontested_payout(task_id: int) -> bool:
    """Worker claims payout after client review window expires without dispute."""

def dispute_task(task_id: int, allegations: str) -> bool:
    """Client contests deliverable, locking msg.value dispute deposit."""

def submit_defense(task_id: int, defense_rebuttal: str) -> bool:
    """Worker submits defense arguments and counter-evidence within defense window."""

def adjudicate_dispute(task_id: int) -> str:
    """Executes GenLayer AI Magistrate consensus to settle contested task. Returns verdict."""
```

### View Methods

```python
def get_task(task_id: int) -> dict: ...
def get_dispute(task_id: int) -> dict: ...
def get_dispute_ruling(task_id: int) -> dict: ...
def get_agent_profile(address: str) -> dict: ...
def get_tasks_by_creator(address: str) -> list[int]: ...
def get_tasks_by_worker(address: str) -> list[int]: ...
def get_tasks_by_status(status: str) -> list[int]: ...
def get_total_tasks() -> int: ...
def get_contract_version() -> str: ...
```

---

## Validation Constants & Limits

- `MIN_TITLE_LENGTH = 3`, `MAX_TITLE_LENGTH = 140`
- `MIN_SLA_SPEC_LENGTH = 20`, `MAX_SLA_SPEC_LENGTH = 10_000`
- `MIN_ESCROW_AMOUNT = 10_000_000_000_000_000` (0.01 GEN)
- `MIN_WORKER_BOND = 5_000_000_000_000_000` (0.005 GEN)
- `MIN_DISPUTE_DEPOSIT = 5_000_000_000_000_000` (0.005 GEN)
- `MIN_DEADLINE_DURATION = 3_600` (1 hour), `MAX_DEADLINE_DURATION = 2_592_000` (30 days)
- `MIN_REVIEW_WINDOW = 3_600` (1 hour), `DEFAULT_REVIEW_WINDOW = 86_400` (24 hours)
- `MIN_DEFENSE_WINDOW = 3_600` (1 hour), `DEFAULT_DEFENSE_WINDOW = 86_400` (24 hours)
- `RETRY_COOLDOWN_SECONDS = 300` (5 minutes)
- `MAX_PAYLOAD_LENGTH = 32_768` (32 KB)
- `MAX_URL_LENGTH = 2_048`
