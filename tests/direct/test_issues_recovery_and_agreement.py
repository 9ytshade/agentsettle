"""Adversarial Verification Suite for AgentSettle v1.2.0.

Tests cover:
1. Economic Validator Agreement:
   - Schema validation and malformed rulings rejection.
   - Malicious leader proposing altered basis points (BPS manipulation).
   - Inconsistent criteria results vs canonical verdict.
   - Criteria count and outcome distribution agreement.
2. Authoritative Deadline Enforcement & Recovery:
   - Late deliverable submission rejection (now > task.deadline).
   - Late dispute rejection (now > task.review_deadline).
   - Late defense submission rejection (now > task.defense_deadline).
   - claim_delivery_timeout_refund for abandoned tasks (client refund + bond slash).
   - resolve_exhausted_dispute for repeatedly UNDETERMINED deadlocks (preserves both parties).
3. Exact Bond Accounting & Conservation:
   - Exact bond deposit acceptance.
   - Excess bond deposit immediate refund and exact amount locked.
   - Insufficient bond deposit rejection.
   - Value conservation across delivery timeout and dispute exhaustion.
4. Evidence-Backed Adjudication Safeguards:
   - Inaccessible external evidence URL yielding UNDETERMINED when no artifact payload exists.
   - Resilient adjudication when standalone artifact payload is provided.
"""

from datetime import datetime, timedelta
import json
import pytest
import genlayer as gl
from genlayer import Address, u256, u32, u64, u8


CONTRACT = "contracts/agentsettle.py"

DEFAULT_ESCROW = 50_000_000_000_000_000        # 0.05 GEN
DEFAULT_WORKER_BOND = 20_000_000_000_000_000    # 0.02 GEN
DEFAULT_DISPUTE_DEPOSIT = 10_000_000_000_000_000 # 0.01 GEN


def deploy_contract(direct_deploy):
    return direct_deploy(CONTRACT)


def advance_time(direct_vm, seconds: int):
    curr = datetime.fromisoformat(direct_vm._datetime.replace("Z", "+00:00"))
    future = curr + timedelta(seconds=seconds)
    direct_vm.warp(future.isoformat().replace("+00:00", "Z"))


def create_task_helper(
    direct_vm,
    contract,
    creator,
    title="SLA Arbitration Test Task",
    category="Data Scraping",
    sla="Deliver 100 clean records. Fields: id, name, timestamp. Schema must match perfectly.",
    expected_format="json",
    escrow=DEFAULT_ESCROW,
    worker_bond=DEFAULT_WORKER_BOND,
    deadline_duration=86_400,
    review_window=86_400,
    defense_window=86_400,
):
    direct_vm.sender = creator
    direct_vm.value = escrow
    task_id = contract.create_task(
        title=title,
        category=category,
        sla_specification=sla,
        expected_format=expected_format,
        worker_bond=worker_bond,
        deadline_duration=deadline_duration,
        review_window=review_window,
        defense_window=defense_window,
    )
    direct_vm.value = 0
    return task_id


# ==============================================================================
# 1. BOND ACCOUNTING & EXCESS REFUND TESTS
# ==============================================================================

def test_bond_accounting_exact_deposit(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Exact worker bond deposit is accepted and locked into total escrow."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    res = contract.accept_task(task_id)
    direct_vm.value = 0

    assert res is True
    task = contract.get_task(task_id)
    assert task["status"] == "in_progress"
    assert task["worker"] == direct_bob


def test_bond_accounting_excess_deposit_refunded(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Worker deposit exceeding worker_bond has excess immediately returned."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice, worker_bond=DEFAULT_WORKER_BOND)

    # Worker sends 2x the required bond
    excess_payment = DEFAULT_WORKER_BOND * 2
    direct_vm.sender = direct_bob
    direct_vm.value = excess_payment
    res = contract.accept_task(task_id)
    direct_vm.value = 0

    assert res is True
    task = contract.get_task(task_id)
    assert task["status"] == "in_progress"
    assert task["worker_bond"] == DEFAULT_WORKER_BOND

    # Approve task to verify total payout matches escrow + base bond (not excess)
    contract.submit_deliverable(task_id, "", '{"records": 100}')
    direct_vm.sender = direct_alice
    contract.approve_task(task_id)

    task_after = contract.get_task(task_id)
    assert task_after["status"] == "completed"


def test_bond_accounting_insufficient_deposit_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Worker deposit less than worker_bond reverts."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice, worker_bond=DEFAULT_WORKER_BOND)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND - 1  # 1 wei short
    with direct_vm.expect_revert(f"Worker bond of {DEFAULT_WORKER_BOND} wei required"):
        contract.accept_task(task_id)


# ==============================================================================
# 2. DEADLINE ENFORCEMENT TESTS
# ==============================================================================

def test_late_delivery_submission_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Worker cannot submit deliverable after the task deadline has expired."""
    contract = deploy_contract(direct_deploy)
    # Task with 100 second deadline duration
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice, deadline_duration=100)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # Advance time past the 100s deadline
    advance_time(direct_vm, 150)

    with direct_vm.expect_revert("Task deadline has passed"):
        contract.submit_deliverable(task_id, "", '{"records": 100}')


def test_late_dispute_submission_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Client cannot dispute after review window has expired."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice, review_window=200)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, "", '{"records": 100}')

    # Advance time past review window
    advance_time(direct_vm, 250)

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    with direct_vm.expect_revert("Review deadline has expired; task can no longer be disputed"):
        contract.dispute_task(task_id, "Attempting late dispute after review window closed.")


def test_late_defense_submission_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Worker cannot submit defense rebuttal after defense window has expired."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice, defense_window=200)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, "", '{"records": 100}')

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "Data schema is missing timestamp field.")
    direct_vm.value = 0

    # Advance time past defense window
    advance_time(direct_vm, 250)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Defense deadline has expired"):
        contract.submit_defense(task_id, "Attempting late defense after window expired.")


# ==============================================================================
# 3. AUTHORITATIVE RECOVERY PATHS
# ==============================================================================

def test_claim_delivery_timeout_refund_success(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Client reclaims 100% escrow and slashes worker bond when worker defaults on delivery."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice, deadline_duration=3600)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # Before deadline -> revert
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Task delivery deadline has not yet expired"):
        contract.claim_delivery_timeout_refund(task_id)

    # Advance time past deadline
    advance_time(direct_vm, 3700)

    # Non-creator cannot trigger refund
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only task creator can claim delivery timeout refund"):
        contract.claim_delivery_timeout_refund(task_id)

    # Creator claims timeout refund
    direct_vm.sender = direct_alice
    res = contract.claim_delivery_timeout_refund(task_id)
    assert res is True

    task = contract.get_task(task_id)
    assert task["status"] == "expired"

    # Worker reputation slashed
    worker_prof = contract.get_agent_profile(direct_bob)
    assert worker_prof["disputes_lost"] == 1
    assert worker_prof["slashed_bonds"] == DEFAULT_WORKER_BOND
    assert worker_prof["reliability_score"] == 65  # 80 - 15


def test_resolve_exhausted_dispute_success(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Repeatedly UNDETERMINED dispute reaches exhaustion and recovers principal to both parties."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, "https://broken.example.com/data.json", "")

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "External evidence fails to load completely.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "Server experienced temporary downtime.")

    # 1. Premature exhaustion resolution fails
    with direct_vm.expect_revert("Dispute has not reached exhaustion threshold"):
        contract.resolve_exhausted_dispute(task_id)

    # 2. Simulate repeated UNDETERMINED attempts up to max (5 attempts)
    direct_vm.mock_web(r"broken\.example\.com/.*", Exception("Connection timed out"))
    mock_undet = {
        "verdict": "UNDETERMINED",
        "worker_bps": 0,
        "criteria_results": [{"criterion": "Evidence Reachability", "result": "UNDETERMINED"}],
        "reasoning": "Evidence unreachable.",
    }
    direct_vm.mock_llm(r"impartial GenLayer Validator Magistrate", json.dumps(mock_undet))

    for i in range(5):
        advance_time(direct_vm, 305)  # past retry cooldown
        verdict = contract.adjudicate_dispute(task_id)
        assert verdict == "UNDETERMINED"

    task_after_attempts = contract.get_task(task_id)
    assert task_after_attempts["attempt_count"] == 5

    # 3. Third party cannot trigger exhaustion resolution
    other_user = Address(bytes([9] * 20))
    direct_vm.sender = other_user
    with direct_vm.expect_revert("Only task creator or worker can trigger exhausted dispute resolution"):
        contract.resolve_exhausted_dispute(task_id)

    # 4. Either creator or worker triggers authoritative resolution
    direct_vm.sender = direct_alice
    res = contract.resolve_exhausted_dispute(task_id)
    assert res is True

    task_final = contract.get_task(task_id)
    assert task_final["status"] == "exhausted"

    ruling = contract.get_dispute_ruling(task_id)
    assert ruling["verdict"] == "UNDETERMINED_EXHAUSTED"
    assert ruling["worker_payout"] == DEFAULT_WORKER_BOND
    assert ruling["creator_refund"] == DEFAULT_ESCROW + DEFAULT_DISPUTE_DEPOSIT


# ==============================================================================
# 4. ADVERSARIAL VALIDATOR AGREEMENT & MALICIOUS LEADER TESTS
# ==============================================================================

def test_malicious_leader_altered_bps_rejected(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Malicious leader altering BPS relative to criteria results is rejected by validate."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, "", '{"records": 50}')

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "Only 50 out of 100 records delivered.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "Delivered partial records as described.")

    # Honest validator evaluation baseline
    validator_ruling = {
        "verdict": "PARTIAL_SETTLEMENT",
        "worker_bps": 5000,
        "criteria_results": [
            {"criterion": "Volume (50/100 records)", "result": "PASS"},
            {"criterion": "Remaining records missing", "result": "FAIL"},
        ],
        "reasoning": "50% delivered, awarding 5000 BPS",
    }

    # 1. Malicious leader proposes altered BPS (e.g. 9000 instead of 5000)
    malicious_bps_leader = {
        "verdict": "PARTIAL_SETTLEMENT",
        "worker_bps": 9000,  # Manipulated BPS
        "criteria_results": [
            {"criterion": "Volume (50/100 records)", "result": "PASS"},
            {"criterion": "Remaining records missing", "result": "FAIL"},
        ],
        "reasoning": "Altered BPS attack",
    }
    assert contract.validate_ruling_agreement(malicious_bps_leader, validator_ruling) is False

    # 2. Honest leader matching validator agreement succeeds
    honest_leader = {
        "verdict": "PARTIAL_SETTLEMENT",
        "worker_bps": 5000,
        "criteria_results": [
            {"criterion": "Volume (50/100 records)", "result": "PASS"},
            {"criterion": "Remaining records missing", "result": "FAIL"},
        ],
        "reasoning": "50% delivered, awarding 5000 BPS",
    }
    assert contract.validate_ruling_agreement(honest_leader, validator_ruling) is True


def test_malicious_leader_inconsistent_criteria_rejected(direct_vm, direct_deploy, direct_alice, direct_bob):
    """Malicious leader proposing FULL_PAYOUT_WORKER with failed criteria is rejected."""
    contract = deploy_contract(direct_deploy)

    validator_ruling = {
        "verdict": "FULL_REFUND_CLIENT",
        "worker_bps": 0,
        "criteria_results": [
            {"criterion": "Deliverable schema valid", "result": "FAIL"},
            {"criterion": "Deliverable volume met", "result": "FAIL"},
        ],
        "reasoning": "All criteria failed.",
    }

    # Leader claims FULL_PAYOUT_WORKER while criteria all FAIL
    inconsistent_leader = {
        "verdict": "FULL_PAYOUT_WORKER",
        "worker_bps": 10000,
        "criteria_results": [
            {"criterion": "Deliverable schema valid", "result": "FAIL"},
            {"criterion": "Deliverable volume met", "result": "FAIL"},
        ],
        "reasoning": "Falsified verdict attack",
    }
    assert contract.validate_ruling_agreement(inconsistent_leader, validator_ruling) is False

    # Leader claims FULL_PAYOUT_WORKER with PASS criteria while validator found FAIL
    mismatched_criteria_leader = {
        "verdict": "FULL_PAYOUT_WORKER",
        "worker_bps": 10000,
        "criteria_results": [
            {"criterion": "Deliverable schema valid", "result": "PASS"},
            {"criterion": "Deliverable volume met", "result": "PASS"},
        ],
        "reasoning": "Falsified criteria attack",
    }
    assert contract.validate_ruling_agreement(mismatched_criteria_leader, validator_ruling) is False


def test_malformed_leader_rulings_rejected(direct_vm, direct_deploy):
    """Malformed leader rulings missing fields, having wrong types, or invalid enums are rejected."""
    contract = deploy_contract(direct_deploy)

    validator_ruling = {
        "verdict": "FULL_PAYOUT_WORKER",
        "worker_bps": 10000,
        "criteria_results": [{"criterion": "All valid", "result": "PASS"}],
        "reasoning": "Valid",
    }

    # Missing criteria_results
    assert contract.validate_ruling_agreement(
        {"verdict": "FULL_PAYOUT_WORKER", "worker_bps": 10000, "reasoning": "test"},
        validator_ruling,
    ) is False

    # Non-integer worker_bps
    assert contract.validate_ruling_agreement(
        {"verdict": "FULL_PAYOUT_WORKER", "worker_bps": "invalid", "criteria_results": [{"criterion": "c", "result": "PASS"}], "reasoning": "test"},
        validator_ruling,
    ) is False

    # Invalid result enum
    assert contract.validate_ruling_agreement(
        {"verdict": "FULL_PAYOUT_WORKER", "worker_bps": 10000, "criteria_results": [{"criterion": "c", "result": "HACKED"}], "reasoning": "test"},
        validator_ruling,
    ) is False

    # Non-dict calldata
    assert contract.validate_ruling_agreement("not a dict", validator_ruling) is False


def test_inaccessible_evidence_safeguard_forces_undetermined(direct_vm, direct_deploy, direct_alice, direct_bob):
    """When deliverable URL cannot be reached and no payload exists, ruling MUST be UNDETERMINED."""
    contract = deploy_contract(direct_deploy)
    task_id = create_task_helper(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # No artifact payload, only an external URL that fails
    contract.submit_deliverable(task_id, "https://outage.example.com/dataset.json", "")

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "External URL is completely down.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "Site host is having temporary DNS issues.")

    direct_vm.mock_web(r"outage\.example\.com/.*", Exception("503 Service Unavailable"))

    # Contract evaluate() detects fetch_error with empty payload, forcing UNDETERMINED
    verdict = contract.adjudicate_dispute(task_id)
    assert verdict == "UNDETERMINED"

    task = contract.get_task(task_id)
    assert task["status"] in ("disputed", "defended")
    assert task["attempt_count"] == 1
