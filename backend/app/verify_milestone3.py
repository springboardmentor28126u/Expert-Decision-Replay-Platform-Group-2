import sys
import os
import io

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import get_db, Base
from app.models.decision import Category

# Setup clean SQLite in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./verify_m3_test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate all tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("STARTING MILESTONE 3 VERIFICATION TESTS (SQLite Local Environment)")
    print("=" * 60)

    # 1. Register users & login
    print("\n[Test] Registering employee, reviewer, and administrator...")
    users = [
        {"email": "emp@company.com", "password": "securepassword", "full_name": "Decision Creator", "role": "employee"},
        {"email": "rev@company.com", "password": "securepassword", "full_name": "Approver Reviewer", "role": "reviewer"},
        {"email": "admin@company.com", "password": "securepassword", "full_name": "Platform Admin", "role": "administrator"},
    ]
    tokens = {}
    ids = {}
    
    for u in users:
        reg_resp = client.post("/auth/register", json=u)
        assert reg_resp.status_code == 201
        ids[u["role"]] = reg_resp.json()["id"]
        
        login_resp = client.post("/auth/login", json={"email": u["email"], "password": u["password"]})
        assert login_resp.status_code == 200
        tokens[u["role"]] = login_resp.json()["access_token"]

    emp_headers = {"Authorization": f"Bearer {tokens['employee']}"}
    rev_headers = {"Authorization": f"Bearer {tokens['reviewer']}"}
    admin_headers = {"Authorization": f"Bearer {tokens['administrator']}"}

    # Seed a Category
    cat_resp = client.post("/decisions/categories", json={"name": "Engineering", "description": "Eng decisions"}, headers=admin_headers)
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    # 2. Creator logs a Decision
    print("\n[Test] Employee creating a new decision draft...")
    decision_payload = {
        "title": "Migrate to Tailwind CSS",
        "problem_statement": "Inline styling bloat is reducing rendering performance.",
        "evaluation_criteria": "Bundle size, developer velocity, utility standardization.",
        "category_id": cat_id,
        "alternatives": [{"title": "Option A: Tailwind CSS", "is_chosen": True}]
    }
    dec_resp = client.post("/decisions", json=decision_payload, headers=emp_headers)
    assert dec_resp.status_code == 201
    decision_id = dec_resp.json()["id"]

    # 3. Creator assigns reviewer at Stage 1
    print("\n[Test] Assigning reviewer to the decision (triggers notification)...")
    assign_payload = {
        "reviewer_id": ids["reviewer"],
        "stage": 1
    }
    assign_resp = client.post(f"/decisions/{decision_id}/reviewer", json=assign_payload, headers=emp_headers)
    assert assign_resp.status_code == 201
    approval_id = assign_resp.json()["id"]
    
    # Check decision status changed to under_review
    dec_check = client.get(f"/decisions/{decision_id}", headers=emp_headers)
    assert dec_check.json()["status"] == "under_review"
    print("  -> SUCCESS! Reviewer assigned. Status set to 'under_review'.")

    # Check notification for reviewer exists
    notif_resp = client.get("/decisions/notifications", headers=rev_headers)
    print("Notification response text:", notif_resp.text)
    assert notif_resp.status_code == 200

    assert len(notif_resp.json()) == 1
    assert "Review Assigned" in notif_resp.json()[0]["title"]
    print("  -> SUCCESS! System generated 'Review Assigned' notification for Reviewer.")

    # 4. Reviewer views pending approvals list
    print("\n[Test] Checking reviewer pending approvals inbox...")
    pending_resp = client.get("/decisions/approvals/pending", headers=rev_headers)
    assert pending_resp.status_code == 200
    assert len(pending_resp.json()) == 1
    assert pending_resp.json()[0]["id"] == approval_id
    print("  -> SUCCESS! Correctly retrieved reviewer pending item.")

    # 5. Reviewer actions approval
    print("\n[Test] Submitting approval action by Reviewer (triggers creator notification)...")
    action_payload = {
        "status": "approved",
        "comments": "Option A looks perfect. Approved."
    }
    action_resp = client.put(f"/decisions/approvals/{approval_id}", json=action_payload, headers=rev_headers)
    assert action_resp.status_code == 200
    assert action_resp.json()["status"] == "approved"
    
    # Decision status should advance to approved
    dec_check = client.get(f"/decisions/{decision_id}", headers=emp_headers)
    assert dec_check.json()["status"] == "approved"
    print("  -> SUCCESS! Decision state advanced to 'approved'.")

    # Check notification generated for creator
    creator_notif = client.get("/decisions/notifications", headers=emp_headers)
    assert len(creator_notif.json()) == 1
    assert "Decision Approved" in creator_notif.json()[0]["title"]
    print("  -> SUCCESS! Creator received 'Decision Approved' notification.")

    # 6. PDF Export
    print("\n[Test] Exporting decision details as PDF report...")
    pdf_resp = client.get(f"/decisions/{decision_id}/export/pdf", headers=emp_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.content.startswith(b"%PDF")
    print("  -> SUCCESS! PDF report generated correctly with valid binary headers.")

    # 7. Excel Export
    print("\n[Test] Exporting decisions logs as Excel spreadsheet...")
    excel_resp = client.get("/decisions/export/excel", headers=emp_headers)
    assert excel_resp.status_code == 200
    # ZIP/Office document starts with PK (0x50 0x4B)
    assert excel_resp.content.startswith(b"PK")
    print("  -> SUCCESS! Excel sheet exported correctly.")

    # 8. Check audit logs (compliance trail)
    print("\n[Test] Fetching compliance audit logs (Admin only)...")
    audit_resp = client.get("/decisions/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    actions = [l["action"] for l in logs]
    print(f"  -> Generated actions recorded: {actions}")
    assert "ASSIGN_REVIEWER" in actions
    assert "DECISION_APPROVE" in actions
    assert "EXPORT_PDF" in actions
    assert "EXPORT_EXCEL" in actions
    print("  -> SUCCESS! Verified operations, actions, and exports logged in audit trails.")

    print("\n" + "=" * 60)
    print("ALL MILESTONE 3 TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

    # Cleanup test files
    if os.path.exists("./verify_m3_test.db"):
        os.remove("./verify_m3_test.db")

if __name__ == "__main__":
    run_tests()
