from fastapi.testclient import TestClient
from sqlalchemy import select
from main import app
from database import SessionLocal
from models import User, AuditLog

client = TestClient(app)

def test_audit_logging():
    # 1. Access DB directly to find or create a user for testing
    db = SessionLocal()
    try:
        user = db.execute(select(User)).scalars().first()
        if not user:
            # No user exists, let's skip/return
            print("No user exists in the database to run the test.")
            return

        # 2. Get current audit log count
        initial_count = db.execute(select(AuditLog)).scalars().all()
        initial_len = len(initial_count)

        # 3. Simulate a login request
        # Let's find user's password or register a temporary test user
        # To make it robust and self-contained, let's register a new test user
        import uuid
        test_email = f"audit.test.{uuid.uuid4().hex[:6]}@example.com"
        test_password = "password123"
        
        reg_payload = {
            "full_name": "Audit Test User",
            "email": test_email,
            "password": test_password
        }
        
        reg_resp = client.post("/register", json=reg_payload)
        assert reg_resp.status_code == 200
        new_user = reg_resp.json()
        new_user_id = new_user["id"]
        
        # 4. Check if registration created an audit log entry
        db.expire_all()
        logs = db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == new_user_id)
            .order_by(AuditLog.created_at.desc())
        ).scalars().all()
        
        assert len(logs) > 0
        assert logs[0].log_type == "security"
        assert logs[0].action == "register"
        assert logs[0].entity_type == "user"
        print(f"SUCCESS: Registration successfully logged with ID {logs[0].id}")

        # 5. Perform login
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_resp = client.post("/login", json=login_payload)
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 6. Check login audit log
        db.expire_all()
        login_logs = db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == new_user_id)
            .where(AuditLog.action == "login")
        ).scalars().all()
        assert len(login_logs) == 1
        assert login_logs[0].log_type == "security"
        print(f"SUCCESS: Login successfully logged")

        # 7. Create a decision
        dec_payload = {
            "title": "Audit Logging Test Decision",
            "problem_statement": "We need to ensure audit logging is thoroughly tested.",
            "category": "Testing"
        }
        dec_resp = client.post("/decisions", json=dec_payload, headers=headers)
        assert dec_resp.status_code == 200
        decision_id = dec_resp.json()["id"]

        # 8. Check decision creation audit log
        db.expire_all()
        dec_logs = db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == new_user_id)
            .where(AuditLog.action == "create")
            .where(AuditLog.entity_type == "decision")
        ).scalars().all()
        assert len(dec_logs) == 1
        assert dec_logs[0].entity_id == decision_id
        assert dec_logs[0].log_type == "activity"
        print("SUCCESS: Decision creation successfully logged")

        # 9. List decisions (access log)
        list_resp = client.get("/decisions", headers=headers)
        assert list_resp.status_code == 200

        # 10. Check list decisions audit log
        db.expire_all()
        list_logs = db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == new_user_id)
            .where(AuditLog.action == "list")
            .where(AuditLog.entity_type == "decision")
        ).scalars().all()
        assert len(list_logs) == 1
        assert list_logs[0].log_type == "access"
        print("SUCCESS: Decision listing access successfully logged")

    finally:
        db.close()

if __name__ == "__main__":
    test_audit_logging()
