"""Dependency injection for FastAPI endpoints.

Provides reusable dependencies for:
- Database sessions
- Current authenticated user
- Role-based access control
- Storage backend
"""

import logging
from typing import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.auth.jwt_handler import verify_token
from app.auth.oauth2 import oauth2_scheme
from app.database import SessionLocal
from app.exceptions.handlers import UnauthorizedException, ForbiddenException
from app.models.user import User
from app.storage.base import StorageBackend
from app.storage.local_storage import LocalStorage

logger = logging.getLogger(__name__)


def get_db() -> Generator[Session, None, None]:
    """Provide a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_storage() -> StorageBackend:
    """Provide the storage backend. Swap this to switch to S3."""
    return LocalStorage()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT token and return the current user.

    Raises:
        UnauthorizedException: If token is invalid or user not found.
    """
    payload = verify_token(token)
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise UnauthorizedException("User not found")

    return user


def require_role(*roles: str):
    """Create a dependency that requires the current user to have one of the specified roles.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("Administrator"))])
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenException(
                f"This action requires one of the following roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker
