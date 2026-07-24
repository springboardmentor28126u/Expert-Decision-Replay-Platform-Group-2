"""
Expert Decision Replay Platform - Auth Service

Business logic for authentication and token management.
"""

import hashlib
import logging
import secrets
import time

import redis
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, UserStatus
from app.models.user_profile import UserProfile
from app.models.password_reset_token import PasswordResetToken
from app.models.company import Company
from app.models.membership import Membership, CompanyRole
from app.schemas.auth import RegisterRequest, LoginRequest, ChangePasswordRequest
from app.utils.validators import sanitize_input, validate_password_strength

logger = logging.getLogger("expert_decision")

# Password reset token settings
RESET_TOKEN_BYTES = 32  # 256-bit random token
RESET_TOKEN_EXPIRY_MINUTES = 30

# Redis client for token blacklist
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
except (redis.ConnectionError, redis.RedisError):
    logger.warning("Redis not available — token blacklisting disabled.")
    redis_client = None


def _hash_reset_token(raw_token: str) -> str:
    """Hash a raw reset token with SHA-256 for storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class AuthService:
    
    @staticmethod
    def register_user(db: Session, user_data: RegisterRequest, current_user: Optional[User] = None) -> Tuple[User, str, str]:
        """
        Register a new user and return user with tokens.

        The entire operation (user + profile creation) is wrapped in an
        atomic transaction.  If ANY step fails the transaction is rolled
        back so no orphaned rows are left behind.
        """
        
        # --- Pre-flight validation (before touching the DB) ---
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match."
            )
            
        if not validate_password_strength(user_data.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long and contain uppercase, lowercase, and a number."
            )
            
        sanitized_email = sanitize_input(user_data.email).lower()

        # Pre-check for duplicate email (clean 409 instead of IntegrityError)
        existing_user = db.query(User).filter(User.email == sanitized_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered."
            )
            
        # --- Atomic transaction: user + profile ---
        try:
            new_user = User(
                full_name=sanitize_input(user_data.full_name),
                email=sanitized_email,
                password_hash=hash_password(user_data.password),
            )
            db.add(new_user)
            db.flush()  # Get new_user.id without committing
            
            new_profile = UserProfile(user_id=new_user.id)
            db.add(new_profile)

            # Assign user to default company (create if not exists)
            default_company = db.query(Company).filter(Company.slug == "default-company").first()
            if not default_company:
                default_company = Company(name="Default Company", slug="default-company")
                db.add(default_company)
                db.flush()

            existing_membership = db.query(Membership).filter(
                Membership.user_id == new_user.id,
                Membership.company_id == default_company.id,
            ).first()
            if not existing_membership:
                membership = Membership(
                    user_id=new_user.id,
                    company_id=default_company.id,
                    role=CompanyRole.EMPLOYEE,
                )
                db.add(membership)

            db.commit()
            db.refresh(new_user)
            
        except IntegrityError as e:
            db.rollback()
            logger.warning("Registration IntegrityError for %s: %s", sanitized_email, e)
            # Race condition: another request registered the same email
            # between our pre-check and the INSERT
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered."
            )
        except Exception as e:
            db.rollback()
            logger.error("Registration failed for %s: %s", sanitized_email, e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during registration."
            )
        
        # Generate tokens (lightweight payload — sub: user_id)
        token_data = {"sub": str(new_user.id)}
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        logger.info("User registered successfully: %s (id=%s)", sanitized_email, new_user.id)
        return new_user, access_token, refresh_token

    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> Tuple[str, str]:
        """Authenticate user and return tokens."""
        user = db.query(User).filter(User.email == login_data.email.lower()).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if user.status != UserStatus.ACTIVE:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is not active.",
            )
             
        # Generate tokens (lightweight payload — sub: user_id)
        token_data = {"sub": str(user.id)}
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        
        return access_token, refresh_token

    @staticmethod
    def refresh_access_token(refresh_token: str) -> Tuple[str, str]:
        """Create new access token and refresh token from valid refresh token."""
        # Check if refresh token is blacklisted
        if redis_client and redis_client.get(f"bl_{refresh_token}"):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been blacklisted (user logged out).",
            )
             
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )
             
        user_id = payload.get("sub")
        if not user_id:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload.",
            )
             
        # Blacklist old refresh token
        AuthService._blacklist_token(refresh_token)
        
        return create_access_token(data={"sub": user_id}), create_refresh_token(data={"sub": user_id})

    @staticmethod
    def _blacklist_token(token: str) -> None:
        """Add a token to the Redis blacklist for its remaining TTL."""
        if not redis_client:
            return
        payload = decode_token(token)
        if payload and payload.get("exp"):
            ttl = int(payload["exp"] - time.time())
            if ttl > 0:
                redis_client.setex(f"bl_{token}", ttl, "true")

    @staticmethod
    def logout(access_token: str, refresh_token: str) -> bool:
        """Blacklist both tokens."""
        AuthService._blacklist_token(access_token)
        AuthService._blacklist_token(refresh_token)
        return True

    @staticmethod
    def change_password(db: Session, user: User, data: ChangePasswordRequest) -> bool:
        """Change password for the current user."""
        # Verify current password
        if not verify_password(data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        # Validate new passwords match
        if data.new_password != data.confirm_new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match.",
            )

        # Validate new password strength
        if not validate_password_strength(data.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters with uppercase, lowercase, and a number.",
            )

        # Update
        user.password_hash = hash_password(data.new_password)
        db.commit()
        return True

    # ------------------------------------------------------------------
    #  Forgot / Reset Password
    # ------------------------------------------------------------------

    @staticmethod
    def create_password_reset_token(db: Session, email: str) -> Optional[str]:
        """
        Generate a password reset token for the given email.

        Returns the raw token string if the user exists, or None if the
        email is not registered (caller must NOT reveal this to the client).
        """
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            return None

        # Generate a cryptographically secure random token
        raw_token = secrets.token_urlsafe(RESET_TOKEN_BYTES)
        token_hash = _hash_reset_token(raw_token)

        # Invalidate any previous unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        ).update({"used": True})

        # Store hashed token
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES),
        )
        db.add(reset_entry)
        db.commit()

        logger.info("Password reset token created for user %s", user.id)
        return raw_token

    @staticmethod
    def reset_password(db: Session, raw_token: str, new_password: str) -> bool:
        """
        Reset a user's password using a valid reset token.

        Validates the token, updates the password, marks the token as used,
        and invalidates all existing sessions for the user.
        """
        token_hash = _hash_reset_token(raw_token)

        reset_entry = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
        ).first()

        if not reset_entry or not reset_entry.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset link.",
            )

        # Validate new password strength
        if not validate_password_strength(new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters with uppercase, lowercase, and a number.",
            )

        # Update password
        user = db.query(User).filter(User.id == reset_entry.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset link.",
            )

        user.password_hash = hash_password(new_password)

        # Mark token as used
        reset_entry.used = True

        # Also invalidate all other unused reset tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != reset_entry.id,
            PasswordResetToken.used == False,  # noqa: E712
        ).update({"used": True})

        db.commit()

        # Invalidate all existing sessions (if Redis is available)
        AuthService._invalidate_all_user_sessions(str(user.id))

        logger.info("Password reset successful for user %s", user.id)
        return True

    @staticmethod
    def _invalidate_all_user_sessions(user_id: str) -> None:
        """
        Invalidate all sessions for a user after password reset.

        Uses a Redis key to track the earliest valid token issue time.
        Any token issued before this timestamp is considered invalid.
        """
        if not redis_client:
            logger.warning(
                "Redis unavailable — cannot invalidate sessions for user %s. "
                "Existing tokens will remain valid until expiry.", user_id
            )
            return
        
        # Store the timestamp after which tokens are valid.
        # The get_current_user dependency should check this.
        redis_client.set(
            f"pwd_reset_{user_id}",
            str(int(time.time())),
            ex=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,  # Keep as long as longest token TTL
        )
        logger.info("Invalidated all sessions for user %s", user_id)
