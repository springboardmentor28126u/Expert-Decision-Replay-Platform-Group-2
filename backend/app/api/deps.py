"""
Expert Decision Replay Platform - API Dependencies

FastAPI dependencies for route injection.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.core.security import decode_token
from app.services.user_service import UserService
from app.models.user import User, UserStatus
from app.services.auth_service import redis_client

# Define the OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Dependency to get the currently authenticated user based on JWT token.
    Checks if token is blacklisted and if user is active.
    Also rejects tokens issued before a password reset.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token is blacklisted in Redis
    if redis_client and redis_client.get(f"bl_{token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been blacklisted. Please log in again."
        )

    # Decode token
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
        
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = UUID(user_id_str)
    except ValueError:
         raise credentials_exception

    # Check if a password reset invalidated this token
    if redis_client:
        reset_ts = redis_client.get(f"pwd_reset_{user_id_str}")
        if reset_ts:
            token_iat = payload.get("iat")
            # If the token was issued before the password reset, reject it
            if token_iat and int(token_iat) < int(reset_ts):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password was recently reset. Please log in again."
                )

    # Get user from DB
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
        
    return user


def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure current user is an Administrator."""
    if current_user.role.name != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure current user is at least a Manager."""
    if current_user.role.name not in ["Manager", "Administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user
