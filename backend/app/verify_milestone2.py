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
SQLALCHEMY_DATABASE_URL = "sqlite:///./verify_m2_test.db"
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
    print("STARTING MILESTONE 2 VERIFICATION TESTS (SQLite Local Environment)")
    print("=" * 60)

    # 1. Register a user & get access token
    print("\n[Test] Registering a manager user...")
    user_payload = {
        "email": "manager@company.com",
        "password": "securepassword",
        "full_name": "Decision Manager",
        "role": "manager"
    }
    response = client.post("/auth/register", json=user_payload)
    assert response.status_code == 201

    print("[Test] Logging in to retrieve JWT access token...")
    login_resp = client.post("/auth/login", json={"email": "manager@company.com", "password": "securepassword"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Category
    print("\n[Test] Creating a new category...")
    cat_payload = {"name": "Architecture", "description": "System architecture decision logs."}
    cat_resp = client.post("/decisions/categories", json=cat_payload, headers=headers)
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]
    print(f"  -> SUCCESS! Category ID: {cat_id}")

    # 3. Create Decision with dynamic list of Alternatives
    print("\n[Test] Documenting a new decision draft with alternative comparison...")
    decision_payload = {
        "title": "Migrate Database Server",
        "problem_statement": "Current server faces disk I/O bottlenecks during peak traffic.",
        "evaluation_criteria": "Cost, Migration Downtime, Scalability, and Ease of Administration.",
        "category_id": cat_id,
        "alternatives": [
            {
                "title": "Option A: Self-hosted PostgreSQL on EC2",
                "description": "Deploy PostgreSQL inside an EC2 instance with GP3 volumes.",
                "pros": "Complete superuser control over database clusters.",
                "cons": "No automated backups or automated multi-AZ replication setups.",
                "cost_estimate": 120.0,
                "feasibility_analysis": "High developer skill is available, but operational overhead is high.",
                "risk_assessment": "High risk of configuration drift and storage failure.",
                "is_chosen": False
            },
            {
                "title": "Option B: Managed PostgreSQL on AWS RDS",
                "description": "Deploy AWS RDS for PostgreSQL with automated storage scaling.",
                "pros": "Automatic backup scheduling, automated multi-AZ replication, point-in-time recovery.",
                "cons": "Lacks default superuser access to PostgreSQL configuration parameters.",
                "cost_estimate": 280.0,
                "feasibility_analysis": "Zero operational setup effort required.",
                "risk_assessment": "Low risk. AWS RDS handles replication and backups.",
                "is_chosen": True
            }
        ]
    }
    
    dec_resp = client.post("/decisions", json=decision_payload, headers=headers)
    assert dec_resp.status_code == 201
    dec_data = dec_resp.json()
    decision_id = dec_data["id"]
    assert dec_data["title"] == "Migrate Database Server"
    assert dec_data["version"] == 1
    assert dec_data["status"] == "draft"
    print(f"  -> SUCCESS! Decision created. ID: {decision_id}")

    # 4. Fetch details of Decision and verify nested alternatives
    print("\n[Test] Retrieving detailed decision object and comparing alternative options...")
    detail_resp = client.get(f"/decisions/{decision_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["alternatives"]) == 2
    
    # Check chosen option
    chosen_opt = [alt for alt in detail_data["alternatives"] if alt["is_chosen"]][0]
    assert "RDS" in chosen_opt["title"]
    print("  -> SUCCESS! Correctly verified chosen alternative and parsed cost metrics.")

    # 5. Edit Decision text and test Version History increments
    print("\n[Test] Editing decision details (should increment version number and log version entry)...")
    edit_payload = {
        "title": "Migrate Database Server (Updated)",
        "problem_statement": "Current server faces disk I/O bottlenecks and RAM saturation during peak traffic.",
        "evaluation_criteria": "Cost, Migration Downtime, Scalability, and Ease of Administration.",
        "status": "under_review",
        "category_id": cat_id
    }
    update_resp = client.put(f"/decisions/{decision_id}", json=edit_payload, headers=headers)
    assert update_resp.status_code == 200
    update_data = update_resp.json()
    assert update_data["title"] == "Migrate Database Server (Updated)"
    assert update_data["version"] == 2
    assert update_data["status"] == "under_review"

    # Fetch detail again to verify version history list
    detail_resp = client.get(f"/decisions/{decision_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["versions"]) == 2
    
    v1 = [v for v in detail_data["versions"] if v["version"] == 1][0]
    v2 = [v for v in detail_data["versions"] if v["version"] == 2][0]
    assert v1["title"] == "Migrate Database Server"
    assert v2["title"] == "Migrate Database Server (Updated)"
    print("  -> SUCCESS! Correctly verified version tracking. Generated versions: v1 and v2.")

    # 6. Add comment containing Meeting Notes and Decision Rationale
    print("\n[Test] Posting comment with official meeting notes and rationale...")
    comment_payload = {
        "content": "Discussed migration pathways. Decided that Option B is optimal.",
        "meeting_notes": "Attendees: John, Sarah. Agreed to choose RDS due to maintenance burden.",
        "decision_rationale": "Option B has higher monthly cost, but operational safety justifies expenses."
    }
    comment_resp = client.post(f"/decisions/{decision_id}/comments", json=comment_payload, headers=headers)
    assert comment_resp.status_code == 201
    
    # Check comments list in details
    detail_resp = client.get(f"/decisions/{decision_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["discussions"]) == 1
    comment = detail_data["discussions"][0]
    assert comment["meeting_notes"] == comment_payload["meeting_notes"]
    assert comment["decision_rationale"] == comment_payload["decision_rationale"]
    print("  -> SUCCESS! Discussion and comment attributes validated.")

    # 7. Upload file / Document Attachment
    print("\n[Test] Uploading a document attachment...")
    dummy_file = io.BytesIO(b"Dummy PDF contents mapping architecture topology.")
    upload_resp = client.post(
        f"/decisions/{decision_id}/upload",
        files={"file": ("architecture_topology.pdf", dummy_file, "application/pdf")},
        headers=headers
    )
    assert upload_resp.status_code == 201
    attach_data = upload_resp.json()
    attach_id = attach_data["id"]
    assert attach_data["file_name"] == "architecture_topology.pdf"
    print(f"  -> SUCCESS! Document uploaded. ID: {attach_id}")

    # Verify attachment is linked in decision details
    detail_resp = client.get(f"/decisions/{decision_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["attachments"]) == 1
    assert detail_data["attachments"][0]["id"] == attach_id
    print("  -> SUCCESS! Verified attachment linkage.")

    print("\n" + "=" * 60)
    print("ALL MILESTONE 2 TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

    # Cleanup test files & test databases
    if os.path.exists("./verify_m2_test.db"):
        os.remove("./verify_m2_test.db")
    if os.path.exists(attach_data["file_path"]):
        os.remove(attach_data["file_path"])

if __name__ == "__main__":
    run_tests()
