# core/security.py
"""
core/security.py

Password hashing (passlib/bcrypt) and JWT encode/decode (python-jose).
No DB access, no FastAPI imports — pure functions so they're trivially
unit-testable without spinning up the app (tests/unit/test_auth_service.py
exercises these indirectly via AuthService).
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh"]


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(subject: uuid.UUID, role: str, token_type: TokenType, expires_delta: timedelta) -> str:
    """
    Shared builder for both access and refresh tokens. `jti` (JWT ID) is
    included on every token so a specific token can be individually
    blacklisted/revoked later, independent of its expiry — refresh
    tokens rely on this for the revocation lookup in
    services/auth_service.py.
    """
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": token_type,
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: uuid.UUID, role: str) -> str:
    return _create_token(
        subject=subject,
        role=role,
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: uuid.UUID, role: str) -> str:
    return _create_token(
        subject=subject,
        role=role,
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Raises jose.JWTError on bad signature, malformed token, or expiry —
    callers (dependencies/auth.py, services/auth_service.py) catch this
    and translate it into UnauthorizedException, never letting a raw
    JWTError escape to the client.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
