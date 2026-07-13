"""
schemas/token.py

Schemas for the JWT/OAuth2 authentication flow.
"""

import uuid
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    """Response body returned by POST /auth/login and /auth/refresh."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """
    Decoded JWT claims, validated internally by security.py /
    dependencies/auth.py. Never returned directly to a client.
    """
    sub: Optional[uuid.UUID] = None  # user id
    role: Optional[str] = None
    jti: Optional[str] = None  # unique token id, enables per-token revocation
    exp: Optional[int] = None
    iat: Optional[int] = None
    type: Optional[str] = None  # "access" | "refresh"


class RefreshTokenRequest(BaseModel):
    """Request body for POST /auth/refresh."""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Request body for POST /auth/logout — revokes this specific refresh token."""
    refresh_token: str
