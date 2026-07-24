import asyncio
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest
from app.models.user import UserRole
import pprint
import traceback

def test_auth():
    db = SessionLocal()
    try:
        # Check if admin exists
        print("Testing Role-Based Login & JWT encoding...")
        req = LoginRequest(email="admin@edrp.com", password="Admin@123")
        # Login admin and get token
        access, refresh = AuthService.authenticate_user(db, req)
        print("Admin access token:", access[:20] + "...")
        
        from jose import jwt
        from app.core.config import settings
        payload = jwt.decode(access, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print("Decoded token payload:", payload)
        
        assert payload["role"] == "Administrator"
        assert payload["email"] == "admin@edrp.com"
        
        print("✅ Success: Role-based login and token decoding verified!")

    except Exception as e:
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_auth()
