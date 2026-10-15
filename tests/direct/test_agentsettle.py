from datetime import datetime, timedelta, timezone
import json
import pytest


CONTRACT = "contracts/agentsettle.py"

DEFAULT_TITLE = "Scrape & Clean E-Commerce Reviews"
DEFAULT_CATEGORY = "Data Scraping"
DEFAULT_SLA = (
    "Extract 500 product reviews in clean JSON format matching schema. "
    "Must include rating, title, author, date, and verified purchase flag."
)
DEFAULT_FORMAT = "json"
DEFAULT_ESCROW = 50_000_000_000_000_000        # 0.05 GEN
DEFAULT_WORKER_BOND = 20_000_000_000_000_000    # 0.02 GEN
DEFAULT_DISPUTE_DEPOSIT = 10_000_000_000_000_000 # 0.01 GEN

VALID_PAYLOAD = json.dumps([
    {"rating": 5, "title": "Superb sound", "author": "Alice", "date": "2026-10-01", "verified": True},
    {"rating": 4, "title": "Good battery", "author": "Bob", "date": "2026-10-02", "verified": True},
])

VALID_URL = "https://cdn.example.com/datasets/reviews-500.json"


def deploy_contract(direct_deploy):
    return direct_deploy(CONTRACT)


def advance_time(direct_vm, seconds: int = 86_400 + 10):
    curr = datetime.fromisoformat(direct_vm._datetime.replace("Z", "+00:00"))
    future = curr + timedelta(seconds=seconds)
    direct_vm.warp(future.isoformat().replace("+00:00", "Z"))


def create_sample_task(
    direct_vm,
    contract,
    creator,
    title=DEFAULT_TITLE,
    category=DEFAULT_CATEGORY,
    sla=DEFAULT_SLA,
    expected_format=DEFAULT_FORMAT,
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
# 1. DEPLOYMENT & METADATA
# ==============================================================================


def test_deploy_and_version(direct_deploy):
    contract = deploy_contract(direct_deploy)
    assert contract.get_contract_version() == "1.2.0"
    assert contract.get_total_tasks() == 0


# ==============================================================================
# 2. TASK CREATION & LIFECYCLE
# ==============================================================================


def test_create_task_happy_path(direct_vm, direct_deploy, direct_alice):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    assert task_id == 1
    assert contract.get_total_tasks() == 1

    task = contract.get_task(task_id)
    assert task["id"] == 1
    assert task["creator"] == direct_alice
    assert task["title"] == DEFAULT_TITLE
    assert task["category"] == DEFAULT_CATEGORY
    assert task["sla_specification"] == DEFAULT_SLA
    assert task["expected_format"] == DEFAULT_FORMAT
    assert task["escrow_amount"] == DEFAULT_ESCROW
    assert task["worker_bond"] == DEFAULT_WORKER_BOND
    assert task["status"] == "open"
    assert task["worker"].as_bytes == bytes(20)

    # Profile updated
    profile = contract.get_agent_profile(direct_alice)
    assert profile["tasks_created"] == 1
    assert profile["reliability_score"] == 80

    # Index updated
    tasks = contract.get_tasks_by_creator(direct_alice)
    assert tasks == [1]


def test_create_task_validation_failures(direct_vm, direct_deploy, direct_alice):
    contract = deploy_contract(direct_deploy)

    # 1. Escrow below 0.01 GEN
    direct_vm.sender = direct_alice
    direct_vm.value = 5_000_000_000_000_000  # 0.005 GEN
    with direct_vm.expect_revert("Escrow amount must be at least"):
        contract.create_task(
            title=DEFAULT_TITLE,
            category=DEFAULT_CATEGORY,
            sla_specification=DEFAULT_SLA,
            expected_format=DEFAULT_FORMAT,
            worker_bond=DEFAULT_WORKER_BOND,
        )

    # 2. Worker bond below 0.005 GEN
    direct_vm.value = DEFAULT_ESCROW
    with direct_vm.expect_revert("Worker bond must be at least"):
        contract.create_task(
            title=DEFAULT_TITLE,
            category=DEFAULT_CATEGORY,
            sla_specification=DEFAULT_SLA,
            expected_format=DEFAULT_FORMAT,
            worker_bond=1_000,
        )

    # 3. Title too short
    with direct_vm.expect_revert("Title length must be between"):
        contract.create_task(
            title="Hi",
            category=DEFAULT_CATEGORY,
            sla_specification=DEFAULT_SLA,
            expected_format=DEFAULT_FORMAT,
            worker_bond=DEFAULT_WORKER_BOND,
        )

    # 4. SLA specification too short
    with direct_vm.expect_revert("SLA specification length must be between"):
        contract.create_task(
            title=DEFAULT_TITLE,
            category=DEFAULT_CATEGORY,
            sla_specification="Too brief",
            expected_format=DEFAULT_FORMAT,
            worker_bond=DEFAULT_WORKER_BOND,
        )
    direct_vm.value = 0


# ==============================================================================
# 3. WORKER ACCEPTANCE
# ==============================================================================


def test_accept_task_happy_path(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    res = contract.accept_task(task_id)
    direct_vm.value = 0

    assert res is True
    task = contract.get_task(task_id)
    assert task["status"] == "in_progress"
    assert task["worker"] == direct_bob

    worker_tasks = contract.get_tasks_by_worker(direct_bob)
    assert worker_tasks == [task_id]


def test_accept_task_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    # 1. Creator cannot accept own task
    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_WORKER_BOND
    with direct_vm.expect_revert("Task creator cannot accept their own task as worker"):
        contract.accept_task(task_id)

    # 2. Insufficient bond
    direct_vm.sender = direct_bob
    direct_vm.value = 1_000
    with direct_vm.expect_revert("Worker bond of"):
        contract.accept_task(task_id)

    # 3. Successful acceptance
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)

    # 4. Cannot accept twice (already in_progress)
    with direct_vm.expect_revert("is not open for assignment"):
        contract.accept_task(task_id)

    # 5. Nonexistent task
    with direct_vm.expect_revert("Task #999 not found"):
        contract.accept_task(999)
    direct_vm.value = 0


# ==============================================================================
# 4. TASK CANCELLATION
# ==============================================================================


def test_cancel_task_happy_path(direct_vm, direct_deploy, direct_alice):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_alice
    res = contract.cancel_task(task_id)
    assert res is True

    task = contract.get_task(task_id)
    assert task["status"] == "cancelled"


def test_cancel_task_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    # 1. Non-creator cannot cancel
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only task creator can cancel task"):
        contract.cancel_task(task_id)

    # 2. Worker accepts
    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # 3. Creator cannot cancel committed in_progress task
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Cannot cancel task in 'in_progress' status"):
        contract.cancel_task(task_id)


# ==============================================================================
# 5. DELIVERABLE SUBMISSION
# ==============================================================================


def test_submit_deliverable_happy_path(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    res = contract.submit_deliverable(
        task_id=task_id,
        deliverable_url=VALID_URL,
        artifact_payload=VALID_PAYLOAD,
    )
    assert res is True

    task = contract.get_task(task_id)
    assert task["status"] == "delivered"
    assert task["deliverable_url"] == VALID_URL
    assert task["artifact_payload"] == VALID_PAYLOAD
    assert len(task["evidence_hash"]) == 64
    assert task["review_deadline"] > task["created_at"]


def test_submit_deliverable_guards(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # 1. Unauthorized third party cannot submit
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Only assigned worker can submit deliverable"):
        contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    # 2. Empty submission (no URL, no payload)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Must provide either a valid deliverable HTTPS URL or artifact payload"):
        contract.submit_deliverable(task_id, "", "")

    # 3. Invalid HTTP URL (only HTTPS allowed)
    with direct_vm.expect_revert("Only public HTTPS URLs are permitted"):
        contract.submit_deliverable(task_id, "http://insecure.example.com/test", VALID_PAYLOAD)

    # 4. Successful initial submission
    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    # 5. Cannot resubmit once delivered without status change
    with direct_vm.expect_revert("Cannot submit deliverable for task in 'delivered' status"):
        contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)


# ==============================================================================
# 6. DIRECT APPROVAL
# ==============================================================================


def test_approve_task_happy_path(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    # Client approves
    direct_vm.sender = direct_alice
    res = contract.approve_task(task_id)
    assert res is True

    task = contract.get_task(task_id)
    assert task["status"] == "completed"

    # Worker reputation rises
    profile = contract.get_agent_profile(direct_bob)
    assert profile["tasks_completed"] == 1
    assert profile["reliability_score"] == 82


def test_approve_task_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # 1. Non-creator cannot approve
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only task creator can approve deliverable"):
        contract.approve_task(task_id)

    # 2. Cannot approve before delivery
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Cannot approve task in 'in_progress' status"):
        contract.approve_task(task_id)


# ==============================================================================
# 7. UNCONTESTED TIMEOUT CLAIM
# ==============================================================================


def test_claim_uncontested_payout_with_timer(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    # Create task with 1-second review window
    task_id = create_sample_task(
        direct_vm,
        contract,
        creator=direct_alice,
        review_window=1,
    )

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    # Immediately claiming reverts because review window is still active
    with direct_vm.expect_revert("Client review window is still active"):
        contract.claim_uncontested_payout(task_id)

    # Warp simulated VM block time past the review window
    advance_time(direct_vm, seconds=86_400 + 10)

    # Now uncontested claim succeeds
    res = contract.claim_uncontested_payout(task_id)
    assert res is True

    task = contract.get_task(task_id)
    assert task["status"] == "completed"

    profile = contract.get_agent_profile(direct_bob)
    assert profile["tasks_completed"] == 1
    assert profile["reliability_score"] == 81


def test_claim_uncontested_payout_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # Non-worker cannot claim
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only assigned worker can claim uncontested payout"):
        contract.claim_uncontested_payout(task_id)

    # Cannot claim while in_progress
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Cannot claim payout for task in 'in_progress' status"):
        contract.claim_uncontested_payout(task_id)


# ==============================================================================
# 8. FORMAL DISPUTE & DEFENSE
# ==============================================================================


def test_dispute_and_defense_happy_path(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    # Client raises formal dispute
    allegations = "The delivered JSON contains only 2 reviews instead of the 500 contracted in SLA."
    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    res = contract.dispute_task(task_id, allegations)
    direct_vm.value = 0
    assert res is True

    task = contract.get_task(task_id)
    assert task["status"] == "disputed"
    assert task["dispute_deposit"] == DEFAULT_DISPUTE_DEPOSIT

    dispute = contract.get_dispute(task_id)
    assert dispute["allegations"] == allegations
    assert dispute["disputant"] == direct_alice

    # Worker submits defense rebuttal
    rebuttal = "The remaining 498 records are fully accessible at the provided HTTPS CDN URL."
    direct_vm.sender = direct_bob
    def_res = contract.submit_defense(task_id, rebuttal)
    assert def_res is True

    task = contract.get_task(task_id)
    assert task["status"] == "defended"

    dispute_updated = contract.get_dispute(task_id)
    assert dispute_updated["defense_rebuttal"] == rebuttal


def test_dispute_and_defense_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    # 1. Cannot dispute before delivery
    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    with direct_vm.expect_revert("Cannot dispute task in 'in_progress' status"):
        contract.dispute_task(task_id, "Bad delivery")

    # Worker delivers
    direct_vm.sender = direct_bob
    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    # 2. Insufficient dispute deposit (< 0.005 GEN)
    direct_vm.sender = direct_alice
    direct_vm.value = 1_000
    with direct_vm.expect_revert("Dispute deposit must be at least"):
        contract.dispute_task(task_id, "Allegations description here")

    # 3. Non-creator cannot dispute
    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    with direct_vm.expect_revert("Only task creator can dispute deliverable"):
        contract.dispute_task(task_id, "Allegations description here")

    # 4. Creator disputes properly
    direct_vm.sender = direct_alice
    contract.dispute_task(task_id, "Delivered data schema violates requirements.")
    direct_vm.value = 0

    # 5. Non-worker cannot submit defense
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only assigned worker can submit defense"):
        contract.submit_defense(task_id, "Defense statement here")

    # 6. Defense too short (< 10 chars)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Defense rebuttal must be between 10 and 5,000 characters"):
        contract.submit_defense(task_id, "Short")


# ==============================================================================
# 9. AI MAGISTRATE ADJUDICATION (EQUIVALENCE PRINCIPLE)
# ==============================================================================


def test_adjudicate_full_payout_worker(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "The extracted data has missing ratings and author names.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "All records include verified fields as demonstrated in payload.")

    # Mock web & LLM
    direct_vm.mock_web(r"cdn\.example\.com/.*", {"status": 200, "body": VALID_PAYLOAD})
    mock_ruling = {
        "verdict": "FULL_PAYOUT_WORKER",
        "worker_bps": 10000,
        "criteria_results": [
            {"criterion": "Reviews extracted in JSON format", "result": "PASS"},
            {"criterion": "Fields present (rating, title, author, date, verified)", "result": "PASS"},
        ],
        "reasoning": "The deliverable fully satisfies all SLA criteria. Dispute claims are unfounded.",
    }
    direct_vm.mock_llm(r"impartial GenLayer Validator Magistrate", json.dumps(mock_ruling))

    verdict = contract.adjudicate_dispute(task_id)
    assert verdict == "FULL_PAYOUT_WORKER"

    task = contract.get_task(task_id)
    assert task["status"] == "resolved"

    ruling = contract.get_dispute_ruling(task_id)
    assert ruling["verdict"] == "FULL_PAYOUT_WORKER"
    assert ruling["worker_bps"] == 10000
    assert ruling["worker_payout"] == DEFAULT_ESCROW + DEFAULT_WORKER_BOND + DEFAULT_DISPUTE_DEPOSIT
    assert ruling["creator_refund"] == 0

    worker_prof = contract.get_agent_profile(direct_bob)
    assert worker_prof["disputes_won"] == 1
    assert worker_prof["reliability_score"] == 83


def test_adjudicate_full_refund_client(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "The worker provided garbage test data.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "I tried my best to satisfy the prompt.")

    direct_vm.mock_web(r"cdn\.example\.com/.*", {"status": 200, "body": "{}"})
    mock_ruling = {
        "verdict": "FULL_REFUND_CLIENT",
        "worker_bps": 0,
        "criteria_results": [
            {"criterion": "500 reviews extracted", "result": "FAIL"},
            {"criterion": "Schema validation", "result": "FAIL"},
        ],
        "reasoning": "Deliverable failed all required SLA criteria completely.",
    }
    direct_vm.mock_llm(r"impartial GenLayer Validator Magistrate", json.dumps(mock_ruling))

    verdict = contract.adjudicate_dispute(task_id)
    assert verdict == "FULL_REFUND_CLIENT"

    task = contract.get_task(task_id)
    assert task["status"] == "resolved"

    ruling = contract.get_dispute_ruling(task_id)
    assert ruling["verdict"] == "FULL_REFUND_CLIENT"
    assert ruling["worker_bps"] == 0
    assert ruling["creator_refund"] == DEFAULT_ESCROW + DEFAULT_WORKER_BOND + DEFAULT_DISPUTE_DEPOSIT
    assert ruling["worker_payout"] == 0

    worker_prof = contract.get_agent_profile(direct_bob)
    assert worker_prof["disputes_lost"] == 1
    assert worker_prof["slashed_bonds"] == DEFAULT_WORKER_BOND
    assert worker_prof["reliability_score"] == 70  # penalized -10


def test_adjudicate_partial_settlement(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "Only part of the required data was delivered.")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "Partial scrape delivered due to target site rate limits.")

    direct_vm.mock_web(r"cdn\.example\.com/.*", {"status": 200, "body": VALID_PAYLOAD})
    # 60% partial split (6,000 bps)
    mock_ruling = {
        "verdict": "PARTIAL_SETTLEMENT",
        "worker_bps": 6000,
        "criteria_results": [
            {"criterion": "Data format valid", "result": "PASS"},
            {"criterion": "Required fields present", "result": "PASS"},
            {"criterion": "Volume requirement (500 reviews)", "result": "FAIL"},
        ],
        "reasoning": "2 out of 3 criteria met. Proportional 60% settlement awarded to worker.",
    }
    direct_vm.mock_llm(r"impartial GenLayer Validator Magistrate", json.dumps(mock_ruling))

    verdict = contract.adjudicate_dispute(task_id)
    assert verdict == "PARTIAL_SETTLEMENT"

    ruling = contract.get_dispute_ruling(task_id)
    assert ruling["verdict"] == "PARTIAL_SETTLEMENT"
    assert ruling["worker_bps"] == 6000

    expected_worker_escrow = (DEFAULT_ESCROW * 6000) // 10000
    expected_creator_escrow = DEFAULT_ESCROW - expected_worker_escrow
    assert ruling["worker_payout"] == expected_worker_escrow + DEFAULT_WORKER_BOND
    assert ruling["creator_refund"] == expected_creator_escrow + DEFAULT_DISPUTE_DEPOSIT

    # Exact conservation of funds
    total_pool = DEFAULT_ESCROW + DEFAULT_WORKER_BOND + DEFAULT_DISPUTE_DEPOSIT
    assert ruling["worker_payout"] + ruling["creator_refund"] == total_pool


def test_adjudicate_undetermined_preserves_funds(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    task_id = create_sample_task(direct_vm, contract, creator=direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "Inaccessible host")
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    contract.submit_defense(task_id, "Host is temporarily undergoing maintenance.")

    direct_vm.mock_web(r"cdn\.example\.com/.*", {"status": 503, "body": "503 Service Unavailable"})
    mock_ruling = {
        "verdict": "UNDETERMINED",
        "worker_bps": 0,
        "criteria_results": [],
        "reasoning": "External evidence endpoint returned 503; inconclusive.",
    }
    direct_vm.mock_llm(r"impartial GenLayer Validator Magistrate", json.dumps(mock_ruling))

    verdict = contract.adjudicate_dispute(task_id)
    assert verdict == "UNDETERMINED"

    # Task remains defended and ready for retry
    task = contract.get_task(task_id)
    assert task["status"] == "defended"
    assert task["attempt_count"] == 1

    # Retry cooldown is active (5 minutes)
    with direct_vm.expect_revert("Adjudication retry cooldown active"):
        contract.adjudicate_dispute(task_id)


def test_adjudicate_undefended_waits_for_defense_deadline(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)
    # 1 second defense window
    task_id = create_sample_task(
        direct_vm,
        contract,
        creator=direct_alice,
        defense_window=1,
    )

    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(task_id)
    direct_vm.value = 0

    contract.submit_deliverable(task_id, VALID_URL, VALID_PAYLOAD)

    direct_vm.sender = direct_alice
    direct_vm.value = DEFAULT_DISPUTE_DEPOSIT
    contract.dispute_task(task_id, "Task completely failed requirements.")
    direct_vm.value = 0

    # Worker has NOT defended. Immediate adjudication is blocked by defense window.
    with direct_vm.expect_revert("Worker defense window is still active"):
        contract.adjudicate_dispute(task_id)

    # Warp simulated VM block time past the defense window
    advance_time(direct_vm, seconds=86_400 + 10)

    # Now undefended adjudication can execute
    direct_vm.mock_web(r"cdn\.example\.com/.*", {"status": 200, "body": "{}"})
    mock_ruling = {
        "verdict": "FULL_REFUND_CLIENT",
        "worker_bps": 0,
        "criteria_results": [{"criterion": "Submission", "result": "FAIL"}],
        "reasoning": "Worker defaulted without defense rebuttal.",
    }
    direct_vm.mock_llm(r"impartial GenLayer Validator Magistrate", json.dumps(mock_ruling))

    verdict = contract.adjudicate_dispute(task_id)
    assert verdict == "FULL_REFUND_CLIENT"


# ==============================================================================
# 10. PAGINATION & QUERIES
# ==============================================================================


def test_queries_and_pagination(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_contract(direct_deploy)

    # Create 3 tasks
    for i in range(3):
        create_sample_task(
            direct_vm,
            contract,
            creator=direct_alice,
            title=f"Sample Microtask #{i+1}",
        )

    assert contract.get_total_tasks() == 3

    # get_tasks_by_creator
    alice_tasks = contract.get_tasks_by_creator(direct_alice)
    assert alice_tasks == [1, 2, 3]

    # get_tasks_by_status
    open_tasks = contract.get_tasks_by_status("open", offset=0, limit=2)
    assert len(open_tasks) == 2
    assert open_tasks[0]["id"] == 3  # Reverse chronological
    assert open_tasks[1]["id"] == 2

    # Accept task 1
    direct_vm.sender = direct_bob
    direct_vm.value = DEFAULT_WORKER_BOND
    contract.accept_task(1)
    direct_vm.value = 0

    in_progress_tasks = contract.get_tasks_by_status("in_progress")
    assert len(in_progress_tasks) == 1
    assert in_progress_tasks[0]["id"] == 1
