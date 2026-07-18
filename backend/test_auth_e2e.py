import os
import sys
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

client = TestClient(app)

# Test config
TEST_EMAIL = "test_e2e_user@example.com"
TEST_PASSWORD = "Password123!"
TEST_NEW_PASSWORD = "NewPassword456!"

def cleanup_test_user():
    """Clean up the test user before and after tests."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == TEST_EMAIL).first()
    if user:
        db.delete(user)
        db.commit()
    db.close()

def test_auth_e2e_flow():
    cleanup_test_user()
    print("\n--- Starting E2E Auth Flow Test ---\n")

    # Step 1: Register
    print("1. Registering new user...")
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "E2E Test User",
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "confirm_password": TEST_PASSWORD
        }
    )
    assert register_response.status_code == 201, f"Registration failed: {register_response.text}"
    tokens = register_response.json()
    assert "access_token" in tokens
    
    # Check that refresh token is set in cookies
    assert "refresh_token" in register_response.cookies
    print("   [OK] Registration successful")

    # Step 2: Get Current User (/me)
    print("2. Fetching user profile (/me)...")
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert me_response.status_code == 200, f"/me failed: {me_response.text}"
    user_data = me_response.json()
    assert user_data["email"] == TEST_EMAIL
    user_id = user_data["id"]
    print("   [OK] /me endpoint works correctly")

    # Step 3: Login
    print("3. Logging in...")
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    login_tokens = login_response.json()
    assert "access_token" in login_tokens
    print("   [OK] Login successful")

    # Step 4: Forgot Password
    print("4. Requesting forgot password...")
    forgot_response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": TEST_EMAIL}
    )
    assert forgot_response.status_code == 200, f"Forgot password failed: {forgot_response.text}"
    print("   [OK] Forgot password API works")

    # To get the reset token for testing, we have to fetch it directly from the DB
    print("   (Fetching token from DB for test purposes...)")
    db = SessionLocal()
    from app.models.password_reset_token import PasswordResetToken
    # Note: we stored the hash, but since we don't have the raw token, we have to cheat a little
    # by generating a new one via the service directly, but wait, the service hashes it.
    # We will just generate one directly using the service to capture the raw token
    from app.services.auth_service import AuthService
    raw_token = AuthService.create_password_reset_token(db, TEST_EMAIL)
    db.close()
    assert raw_token is not None
    print("   [OK] Got raw reset token")

    # Step 5: Reset Password
    print("5. Resetting password with token...")
    reset_response = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": raw_token,
            "new_password": TEST_NEW_PASSWORD,
            "confirm_password": TEST_NEW_PASSWORD  # Using the frontend schema for validation
        }
    )
    assert reset_response.status_code == 200, f"Reset password failed: {reset_response.text}"
    print("   [OK] Password reset successful")

    # Step 6: Login with Old Password Fails
    print("6. Verifying old password fails...")
    old_login_response = client.post(
        "/api/v1/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert old_login_response.status_code == 401
    print("   [OK] Old password rejected")

    # Step 7: Login with New Password Works
    print("7. Verifying new password works...")
    new_login_response = client.post(
        "/api/v1/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_NEW_PASSWORD}
    )
    assert new_login_response.status_code == 200
    new_tokens = new_login_response.json()
    print("   [OK] New password accepted")

    # Step 8: Verify Old Sessions are Invalidated
    print("8. Verifying old sessions are invalidated...")
    old_session_me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_tokens['access_token']}"}
    )
    from app.services.auth_service import redis_client
    if redis_client:
        assert old_session_me.status_code == 401, "Old session should have been invalidated"
        print("   [OK] Old session successfully invalidated")
    else:
        print("   [!] Redis not available — skipping token invalidation check")

    # Step 9: Token Reuse Rejected
    print("9. Verifying token cannot be reused...")
    reuse_response = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": raw_token,
            "new_password": "AnotherPassword789!"
        }
    )
    assert reuse_response.status_code == 400
    print("   [OK] Token reuse rejected")

    cleanup_test_user()
    print("\n--- All 9 E2E Tests Passed! ---\n")

if __name__ == "__main__":
    test_auth_e2e_flow()
