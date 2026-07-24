"""
Expert Decision Replay Platform -- End-to-End Workflow Walkthrough Test

Tests the full decision lifecycle across all 4 roles:
  Employee (alice) -> creates, submits, resubmits
  Reviewer (bob)  -> approves/rejects at level 1
  Manager (dave)  -> approves at level 2
  Admin  (demo)   -> views everything, archives

Run:  python test_workflow_e2e.py
"""

import os
import sys
import json
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

# Module-level company context (set after _ensure_seed_data)
COMPANY_ID = None

from fastapi.testclient import TestClient
from app.database.session import SessionLocal
from app.models.user import User

# Ensure database tables exist and are seeded
from app.database.base import Base
from app.database.session import engine
import app.models  # noqa: F401 — load all model classes
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
from app.database.seed import run_seed
run_seed()

# Import FastAPI app AFTER seeding
from app.main import app as fastapi_app

client = TestClient(fastapi_app)

BASE = "/api/v1"
PASSWORD = "Demo@123"


def _login(email: str) -> dict:
    resp = client.post(f"{BASE}/auth/login", data={"username": email, "password": PASSWORD})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _post(path, token, json_data=None, expected=201):
    headers = _auth_header(token)
    if COMPANY_ID:
        headers["X-Company-ID"] = COMPANY_ID
    resp = client.post(f"{BASE}{path}", headers=headers, json=json_data or {})
    assert resp.status_code == expected, f"POST {path} expected {expected}, got {resp.status_code}: {resp.text}"
    return resp.json()


def _get(path, token, params=None, expected=200):
    headers = _auth_header(token)
    if COMPANY_ID:
        headers["X-Company-ID"] = COMPANY_ID
    resp = client.get(f"{BASE}{path}", headers=headers, params=params or {})
    assert resp.status_code == expected, f"GET {path} expected {expected}, got {resp.status_code}: {resp.text}"
    return resp.json()


def _patch(path, token, json_data=None, expected=200):
    headers = _auth_header(token)
    if COMPANY_ID:
        headers["X-Company-ID"] = COMPANY_ID
    resp = client.patch(f"{BASE}{path}", headers=headers, json=json_data or {})
    assert resp.status_code == expected, f"PATCH {path} expected {expected}, got {resp.status_code}: {resp.text}"
    return resp.json()


def _ensure_seed_data(admin_token: str) -> tuple:
    """Return (company_id, group_id, category_id) -- create if needed."""
    # Get company list (via /companies/me)
    companies = _get("/companies/me", admin_token)

    try:
        company_id = companies[0]["id"]
    except (IndexError, KeyError):
        company = _post("/companies", admin_token, {"name": "Demo Co", "slug": "demo-co"})
        company_id = company["id"]

    # Get or create default group under this company
    groups = _get("/groups", admin_token, params={"company_id": company_id})
    default_group_id = groups[0]["id"] if groups else None
    if not default_group_id:
        group = _post(f"/groups?company_id={company_id}", admin_token, {"name": "Engineering"})
        default_group_id = group["id"]

    # Get or create Engineering category
    cats = _get("/categories", admin_token)
    cat_id = None
    for c in cats:
        if c["name"].lower() == "engineering":
            cat_id = c["id"]
            break
    if not cat_id:
        cat = _post("/categories", admin_token, {"name": "Engineering", "description": "Engineering decisions"})
        cat_id = cat["id"]

    # Ensure approval chain config exists via DB (no API endpoint for this)
    db = SessionLocal()
    try:
        from app.models.approval_chain import ApprovalChainConfig
        existing = db.query(ApprovalChainConfig).filter(ApprovalChainConfig.category_id == cat_id).first()
        if not existing:
            chain = ApprovalChainConfig(category_id=cat_id, roles=["reviewer", "manager"], sla_hours=48)
            db.add(chain)
            db.commit()
            print("   [SETUP] Created approval chain: [reviewer, manager]")
    finally:
        db.close()

    return company_id, default_group_id, cat_id


print("=== EDRP WORKFLOW E2E TEST ===\n")

# ------------------------------------------------------------------ #
# 0. Login all users
# ------------------------------------------------------------------ #
print("0. Logging in users...")
alice = _login("alice@demo.com")
bob = _login("bob@demo.com")
carol = _login("carol@demo.com")
dave = _login("dave@demo.com")
admin = _login("admin@demo.com")
print("   [OK] All 5 users logged in")

# Ensure seed data exists
print("\n--- SETUP: Ensuring seed data ---")
company_id, group_id, cat_id = _ensure_seed_data(admin["access_token"])
print(f"   Company: {company_id}")
print(f"   Group: {group_id}")
print(f"   Engineering category: {cat_id}")
COMPANY_ID = company_id  # set global for all subsequent API calls

pass_count = 0
fail_count = 0
errors = []

def check(step: str, passed: bool, detail: str = ""):
    global pass_count, fail_count
    status = "[PASS]" if passed else "[FAIL]"
    if passed:
        pass_count += 1
    else:
        fail_count += 1
        errors.append(f"  [{step}] {detail}")
    print(f"  {status} | {step}" + (f" | {detail}" if detail else ""))

# ================================================================== #
# STEP 1 -- Alice creates decision + 3 alternatives + submits
# ================================================================== #
print("\n--- STEP 1: Alice creates + submits decision ---")

# 1a. Create decision
decision_data = {
    "title": "Migrate Database",
    "problem_statement": "MySQL performance is degrading as user count grows.",
    "category_id": str(cat_id),
    "group_id": str(group_id),
    "impact_level": "medium",
}
decision = _post("/decisions", alice["access_token"], decision_data)
decision_id = decision["id"]
check("1a. Decision created", decision["status"] == "draft", f"Expected draft, got {decision['status']}")

# 1b. Create 3 alternatives
alt1 = _post(f"/decisions/{decision_id}/alternatives", alice["access_token"], {
    "title": "Keep MySQL",
    "description": "No migration, keep existing setup",
    "pros": ["Easy, no migration"],
    "cons": ["Slow scaling"],
    "estimated_cost": 0,
    "feasibility_score": 8,
    "risk_level": "low",
    "is_recommended": False,
})
check("1b. Alternative 1 created", alt1.get("id") is not None)

alt2 = _post(f"/decisions/{decision_id}/alternatives", alice["access_token"], {
    "title": "Move to PostgreSQL",
    "description": "Migrate from MySQL to PostgreSQL",
    "pros": ["Better performance", "Open source"],
    "cons": ["Migration effort"],
    "estimated_cost": 50000,
    "feasibility_score": 7,
    "risk_level": "medium",
    "is_recommended": True,
})
check("1b. Alternative 2 created (chosen)", alt2.get("id") is not None and alt2["is_recommended"])

alt3 = _post(f"/decisions/{decision_id}/alternatives", alice["access_token"], {
    "title": "Use MongoDB",
    "description": "Switch to NoSQL MongoDB",
    "pros": ["Flexible schema"],
    "cons": ["Requires app redesign"],
    "estimated_cost": 120000,
    "feasibility_score": 4,
    "risk_level": "high",
    "is_recommended": False,
})
check("1c. Alternative 3 created", alt3.get("id") is not None)

# 1d. Submit
submitted = _patch(f"/decisions/{decision_id}/submit", alice["access_token"], expected=200)
check("1d. Decision submitted", submitted["status"] == "under_review",
      f"Expected under_review, got {submitted['status']}")

# 1e. Verify 2 Approval rows created
detail = _get(f"/decisions/{decision_id}", alice["access_token"])
approvals = _get(f"/decisions/{decision_id}/approvals", alice["access_token"])
check("1e. Exactly 2 Approval rows created", len(approvals) == 2,
      f"Expected 2, got {len(approvals)}")
check("1e. Both approvals pending", all(a["status"] == "pending" for a in approvals),
      f"Statuses: {[a['status'] for a in approvals]}")
check("1e. Level 1 assigned to a reviewer", approvals[0]["level"] == 1)
check("1e. Level 2 assigned to a manager", approvals[1]["level"] == 2)

# Verify the users assigned match roles
l1_approver_id = approvals[0]["approver_id"]
l2_approver_id = approvals[1]["approver_id"]
db = SessionLocal()
try:
    l1_user = db.query(User).filter(User.id == l1_approver_id).first()
    l2_user = db.query(User).filter(User.id == l2_approver_id).first()
    print(f"   Level 1 approver: {l1_user.email} (role: {l1_user.role.value})")
    print(f"   Level 2 approver: {l2_user.email} (role: {l2_user.role.value})")
    check("1e. Level 1 is a reviewer", l1_user.role.value == "reviewer",
          f"Expected reviewer, got {l1_user.role.value}")
    check("1e. Level 2 is a manager", l2_user.role.value == "manager",
          f"Expected manager, got {l2_user.role.value}")
finally:
    db.close()

# ================================================================== #
# STEP 2 -- Bob rejects (simulates "missing cost" scenario)
# ================================================================== #
print("\n--- STEP 2: Bob (reviewer, L1) rejects ---")

# Bob logs in and finds his pending approval
bob_pending = _get("/decisions", bob["access_token"], params={"pending_for_me": True})
check("2a. Bob sees pending decision", len(bob_pending["items"]) > 0,
      f"Expected >=1, got {len(bob_pending['items'])}")

# Bob acts on L1 approval -- reject
l1_approval_id = approvals[0]["id"]
reject_action = _post(
    f"/decisions/{decision_id}/approvals/{l1_approval_id}",
    bob["access_token"],
    {"action": "rejected", "comments": "Please add migration cost estimate"},
    expected=200,
)
check("2b. Bob rejected", reject_action["status"] == "rejected",
      f"Expected rejected, got {reject_action['status']}")

# Verify decision status is rejected
decision_after_reject = _get(f"/decisions/{decision_id}", alice["access_token"])
check("2c. Decision status = rejected", decision_after_reject["status"] == "rejected",
      f"Expected rejected, got {decision_after_reject['status']}")

# Verify L2 approval was cancelled
approvals_after_reject = _get(f"/decisions/{decision_id}/approvals", alice["access_token"])
l2_status = [a["status"] for a in approvals_after_reject if a["level"] == 2]
check("2d. L2 approval cancelled", l2_status == ["cancelled"] if l2_status else False,
      f"L2 statuses: {l2_status}")

# Verify audit log has rejection entry
audit_log = _get(f"/decisions/{decision_id}/audit-log", alice["access_token"])
rejection_logs = [log for log in audit_log if log["action"] == "status_change"]
check("2e. Rejection in audit log", len(rejection_logs) > 0,
      f"Found {len(rejection_logs)} status_change logs")

# ================================================================== #
# STEP 3 -- Alice resubmits (simulates adding cost)
# ================================================================== #
print("\n--- STEP 3: Alice resubmits after rejection ---")

# Alice "adds cost" -- in reality, the decision already has it from creation
# The key test is that resubmit creates fresh approvals
resubmitted = _patch(f"/decisions/{decision_id}/submit", alice["access_token"], expected=200)
check("3a. Decision resubmitted", resubmitted["status"] == "under_review",
      f"Expected under_review, got {resubmitted['status']}")

# Verify fresh approvals created
approvals_after_resubmit = _get(f"/decisions/{decision_id}/approvals", alice["access_token"])
fresh_approvals = [a for a in approvals_after_resubmit if a["status"] == "pending"]
check("3b. Fresh pending approvals created", len(fresh_approvals) == 2,
      f"Expected 2, got {len(fresh_approvals)}")

# Verify old rejection history still visible in audit log
audit_after_resubmit = _get(f"/decisions/{decision_id}/audit-log", alice["access_token"])
all_actions = [log["action"] for log in audit_after_resubmit]
check("3c. Old rejection preserved in audit log", "status_change" in all_actions,
      f"Actions: {all_actions}")

# ================================================================== #
# STEP 4 -- Bob approves (L1), Carol gets 403
# ================================================================== #
print("\n--- STEP 4: Bob (L1) approves; Carol (unauthorized) gets 403 ---")

# Get the new L1 approval ID
l1_new = [a for a in approvals_after_resubmit if a["level"] == 1][0]
l1_new_id = l1_new["id"]

# Bob approves
approve_action = _post(
    f"/decisions/{decision_id}/approvals/{l1_new_id}",
    bob["access_token"],
    {"action": "approved", "comments": "Cost estimate looks reasonable"},
    expected=200,
)
check("4a. Bob approved L1", approve_action["status"] == "approved",
      f"Expected approved, got {approve_action['status']}")

# Verify L2 is now the pending level
approvals_after_l1 = _get(f"/decisions/{decision_id}/approvals", alice["access_token"])
l2_after = [a for a in approvals_after_l1 if a["level"] == 2][0]
check("4b. L2 is now pending", l2_after["status"] == "pending",
      f"Expected pending, got {l2_after['status']}")

# Carol (also a reviewer) tries to act on L2 -- should get 403
carol_headers = _auth_header(carol["access_token"])
carol_headers["X-Company-ID"] = COMPANY_ID
resp = client.post(
    f"{BASE}/decisions/{decision_id}/approvals/{l2_after['id']}",
    headers=carol_headers,
    json={"action": "approved", "comments": "I should not be able to do this"},
)
check("4c. Carol gets 403 on L2", resp.status_code == 403,
      f"Expected 403, got {resp.status_code}: {resp.text[:100]}")

# ================================================================== #
# STEP 5 -- Dave (manager, L2) approves -> decision -> approved
# ================================================================== #
print("\n--- STEP 5: Dave (manager, L2) approves ---")

l2_approval_id = [a for a in approvals_after_l1 if a["level"] == 2][0]["id"]

dave_approves = _post(
    f"/decisions/{decision_id}/approvals/{l2_approval_id}",
    dave["access_token"],
    {"action": "approved", "comments": "Approved. Migration starts Monday."},
    expected=200,
)
check("5a. Dave approved L2", dave_approves["status"] == "approved",
      f"Expected approved, got {dave_approves['status']}")

# Verify decision is now fully approved
decision_approved = _get(f"/decisions/{decision_id}", alice["access_token"])
check("5b. Decision status = approved", decision_approved["status"] == "approved",
      f"Expected approved, got {decision_approved['status']}")

# Verify all approvals are done
all_approvals_final = _get(f"/decisions/{decision_id}/approvals", alice["access_token"])
check("5c. All approvals complete",
      all(a["status"] == "approved" for a in all_approvals_final),
      f"Statuses: {[a['status'] for a in all_approvals_final]}")

# ================================================================== #
# STEP 6 -- Implementation phase
# ================================================================== #
print("\n--- STEP 6: Implementation phase ---")

# Status should still be approved after implementation changes
status1 = _patch(
    f"/decisions/{decision_id}/implementation-status",
    alice["access_token"],
    {"implementation_status": "in_progress"},
)
check("6a. Implementation -> in_progress",
      status1["implementation_status"] == "in_progress",
      f"Expected in_progress, got {status1['implementation_status']}")
check("6a. Decision status still approved", status1["status"] == "approved",
      f"Expected approved, got {status1['status']}")

status2 = _patch(
    f"/decisions/{decision_id}/implementation-status",
    alice["access_token"],
    {"implementation_status": "completed"},
)
check("6b. Implementation -> completed",
      status2["implementation_status"] == "completed",
      f"Expected completed, got {status2['implementation_status']}")

# ================================================================== #
# STEP 7 -- Archive + Search
# ================================================================== #
print("\n--- STEP 7: Archive + Search ---")

# Alice cannot archive (only admin or owner), try admin
archive_headers = _auth_header(admin["access_token"])
archive_headers["X-Company-ID"] = COMPANY_ID
archive_resp = client.delete(
    f"{BASE}/decisions/{decision_id}",
    headers=archive_headers,
)
check("7a. Decision archived by admin", archive_resp.status_code == 200,
      f"Expected 200, got {archive_resp.status_code}")
archived = archive_resp.json()
check("7a. Archived message received", archived.get("message") is not None)

# Verify archived status
decision_archived = _get(f"/decisions/{decision_id}", alice["access_token"])
check("7b. Decision status = archived", decision_archived["status"] == "archived",
      f"Expected archived, got {decision_archived['status']}")

# Search by keyword "MySQL" (matches problem_statement)
search_results = _get("/decisions", alice["access_token"],
                      params={"search": "MySQL"})
check("7c. Search finds by keyword 'MySQL'",
      len(search_results["items"]) > 0,
      f"Expected >=1, got {len(search_results['items'])}")

# Search by keyword "Migrate" (matches title)
search_results2 = _get("/decisions", alice["access_token"],
                       params={"search": "Migrate"})
check("7d. Search finds by 'Migrate'",
      len(search_results2["items"]) > 0,
      f"Expected >=1, got {len(search_results2['items'])}")

# Verify detail view includes full history
detail_final = _get(f"/decisions/{decision_id}", alice["access_token"])
check("7e. Detail includes problem_statement",
      "MySQL performance" in (detail_final.get("problem_statement") or ""))
check("7f. Detail includes all 3 alternatives",
      len(detail_final.get("alternatives") or []) == 3,
      f"Expected 3, got {len(detail_final.get('alternatives') or [])}")

# Full approval history
approval_history = _get(f"/decisions/{decision_id}/approvals", alice["access_token"])
check("7g. Full approval history visible",
      len(approval_history) >= 2,
      f"Expected >=2, got {len(approval_history)}")

# Audit log still has everything
audit_final = _get(f"/decisions/{decision_id}/audit-log", alice["access_token"])
all_final_actions = [log["action"] for log in audit_final]
check("7h. Audit log preserves submit action", "submit" in all_final_actions,
      f"Actions: {all_final_actions}")
check("7i. Audit log preserves rejection", "status_change" in all_final_actions,
      f"Actions: {all_final_actions}")

# ================================================================== #
# SUMMARY
# ================================================================== #
print(f"\n=== RESULTS: {pass_count} passed, {fail_count} failed ===")
if errors:
    print("\nFailures:")
    for e in errors:
        print(e)
else:
    print("\nAll assertions passed! The full workflow is functional.")

sys.exit(0 if fail_count == 0 else 1)
