import sys
import os

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import get_db, Base

# Setup clean SQLite in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./verify_test.db"
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
    print("STARTING MILESTONE 1 VERIFICATION TESTS (SQLite Local Environment)")
    print("=" * 60)

    # 1. Test registration of different roles
    users_to_register = [
        {"email": "admin@company.com", "password": "securepassword", "full_name": "Admin User", "role": "administrator"},
        {"email": "manager@company.com", "password": "securepassword", "full_name": "Manager User", "role": "manager"},
        {"email": "employee@company.com", "password": "securepassword", "full_name": "Employee User", "role": "employee"},
    ]

    tokens = {}

    for u in users_to_register:
        print(f"\n[Test] Registering {u['role']} user ({u['email']})...")
        response = client.post("/auth/register", json=u)
        assert response.status_code == 201, f"Failed registration: {response.text}"
        data = response.json()
        assert data["email"] == u["email"]
        assert data["role"] == u["role"]
        print(f"  -> SUCCESS! User ID: {data['id']}")

    # 2. Test duplicate email registration failure
    print("\n[Test] Attempting registration with duplicate email...")
    duplicate_user = {"email": "employee@company.com", "password": "newpassword", "full_name": "Duplicate Employee", "role": "employee"}
    response = client.post("/auth/register", json=duplicate_user)
    assert response.status_code == 400, "Should have failed with 400"
    print("  -> SUCCESS! Received expected 400 error status.")

    # 3. Test authentication/login & token extraction
    for u in users_to_register:
        print(f"\n[Test] Authenticating {u['role']} ({u['email']})...")
        response = client.post("/auth/login", json={"email": u["email"], "password": u["password"]})
        assert response.status_code == 200, f"Failed login: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        tokens[u["role"]] = data["access_token"]
        print(f"  -> SUCCESS! JWT Token generated.")

    # 4. Test accessing user profile (/users/me)
    print("\n[Test] Fetching user profile (/users/me)...")
    headers = {"Authorization": f"Bearer {tokens['employee']}"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "employee@company.com"
    assert data["role"] == "employee"
    print(f"  -> SUCCESS! Retrieved profile details.")

    # 5. Test Role-based Authorization: Admin endpoint restricted to employees
    print("\n[Test] Accessing Admin-only endpoint (/users/all) with Employee role (should fail)...")
    headers = {"Authorization": f"Bearer {tokens['employee']}"}
    response = client.get("/users/all", headers=headers)
    assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    print("  -> SUCCESS! Access forbidden with 403 as expected.")

    # 6. Test Role-based Authorization: Admin endpoint accessed by Admin (should pass)
    print("\n[Test] Accessing Admin-only endpoint (/users/all) with Admin role (should pass)...")
    headers = {"Authorization": f"Bearer {tokens['administrator']}"}
    response = client.get("/users/all", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    print(f"  -> SUCCESS! Received user list of length {len(data)}.")

    # 7. Test team creation by Administrator
    print("\n[Test] Creating a new team with Admin role...")
    headers = {"Authorization": f"Bearer {tokens['administrator']}"}
    team_payload = {"name": "Architecture Board", "description": "Responsible for standardizing architecture guidelines."}
    response = client.post("/users/teams", json=team_payload, headers=headers)
    assert response.status_code == 201
    team_data = response.json()
    assert team_data["name"] == "Architecture Board"
    team_id = team_data["id"]
    print(f"  -> SUCCESS! Team created with ID: {team_id}")

    # 8. Test joining team by Employee
    print("\n[Test] Joining team by Employee user...")
    headers = {"Authorization": f"Bearer {tokens['employee']}"}
    response = client.post(f"/users/teams/{team_id}/join", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["team_id"] == team_id
    print("  -> SUCCESS! User successfully joined the team.")

    # 9. Test team creation by non-admin (should fail)
    print("\n[Test] Attempting team creation with Employee role (should fail)...")
    headers = {"Authorization": f"Bearer {tokens['employee']}"}
    response = client.post("/users/teams", json={"name": "Hacker Team", "description": "Unauthorized"}, headers=headers)
    assert response.status_code == 403
    print("  -> SUCCESS! Correctly block non-admin from creating teams.")

    print("\n" + "=" * 60)
    print("ALL MILESTONE 1 TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

    # Cleanup the test database
    if os.path.exists("./verify_test.db"):
        os.remove("./verify_test.db")

if __name__ == "__main__":
    run_tests()
