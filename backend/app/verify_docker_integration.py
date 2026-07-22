import sys
import httpx
import os

BACKEND_URL = "http://localhost:8000"

def test_docker_backend():
    print("=" * 60)
    print("RUNNING DOCKER COMPOSE BACKEND INTEGRATION AUDIT TESTS")
    print("=" * 60)

    # 1. Register a test manager user
    print("\n[Test] Registering manager user on live container...")
    payload = {
        "email": "manager_docker@company.com",
        "password": "securepassword",
        "full_name": "Docker Manager",
        "role": "manager"
    }
    try:
        resp = httpx.post(f"{BACKEND_URL}/auth/register", json=payload)
        # 201 or 400 (if already registered from previous run)
        assert resp.status_code in [201, 400]
        if resp.status_code == 201:
            print("  -> SUCCESS! Registered manager_docker@company.com.")
        else:
            print("  -> SUCCESS! User already registered.")
    except Exception as e:
        print(f"  -> FAILED: {e}")
        sys.exit(1)

    # 2. Retrieve login token
    print("\n[Test] Authenticating manager user...")
    login_payload = {
        "email": "manager_docker@company.com",
        "password": "securepassword"
    }
    try:
        resp = httpx.post(f"{BACKEND_URL}/auth/login", json=login_payload)
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        print("  -> SUCCESS! JWT Access Token generated successfully.")
    except Exception as e:
        print(f"  -> FAILED: {e}")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Check categories using token
    print("\n[Test] Querying categories from the live docker backend...")
    try:
        resp = httpx.get(f"{BACKEND_URL}/decisions/categories", headers=headers)
        if resp.status_code != 200:
            print(f"Got unexpected status: {resp.status_code}, Body: {resp.text}")
        assert resp.status_code == 200
        categories = resp.json()
        print(f"  -> SUCCESS! Retrieved categories: {[c['name'] for c in categories]}")
        assert len(categories) >= 5  # seeded categories
    except Exception as e:
        print(f"  -> FAILED: {e}")
        sys.exit(1)

    # 4. Fetch audit logs (should fail for manager role)
    print("\n[Test] Fetching audit logs with Manager role (should fail with 403)...")
    try:
        resp = httpx.get(f"{BACKEND_URL}/decisions/audit-logs", headers=headers)
        assert resp.status_code == 403
        print("  -> SUCCESS! Manager was correctly blocked from audit logs.")
    except Exception as e:
        print(f"  -> FAILED: {e}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("DOCKER COMPOSE INTEGRATION AUDIT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_docker_backend()
