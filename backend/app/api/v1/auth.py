"""
Expert Decision Replay Platform - Auth Router

Endpoints for authentication and token management.
"""

import logging

from fastapi import APIRouter, Depends, status, Request, Response, Cookie, HTTPException, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.schemas.auth import (
    RegisterRequest, 
    TokenResponse, 
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, get_optional_current_user, oauth2_scheme
from app.models.user import User
from app.core.limiter import limiter

logger = logging.getLogger("expert_decision")

router = APIRouter()


# ------------------------------------------------------------------
#  Cookie helper — DRY up the secure/samesite logic
# ------------------------------------------------------------------
def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set the refresh-token cookie with environment-appropriate flags."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax" if settings.DEBUG else "strict",
    )


def _delete_refresh_cookie(response: Response) -> None:
    """Delete the refresh-token cookie."""
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax" if settings.DEBUG else "strict",
    )


# ------------------------------------------------------------------
#  Endpoints
# ------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(
    request: Request, 
    response: Response, 
    user_data: RegisterRequest, 
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    """Register a new user and return tokens."""
    _, access_token, refresh_token = AuthService.register_user(db, user_data, current_user)
    
    _set_refresh_cookie(response, refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    login_context: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    """Login and return tokens (using OAuth2 standard form)."""
    from app.schemas.auth import LoginRequest
    login_data = LoginRequest(
        email=username,
        password=password,
        login_context=login_context if login_context in ("employee", "admin") else None,
    )

    access_token, refresh_token = AuthService.authenticate_user(db, login_data)

    _set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(response: Response, refresh_token: str | None = Cookie(default=None)):
    """Refresh access token."""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    access_token, new_refresh_token = AuthService.refresh_access_token(refresh_token)
    
    _set_refresh_cookie(response, new_refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    access_token: str = Depends(oauth2_scheme),
    refresh_token: str | None = Cookie(default=None),
    current_user: User = Depends(get_current_user),
):
    """Logout current user by blacklisting both access and refresh tokens."""
    if refresh_token:
        AuthService.logout(access_token, refresh_token)
    else:
        AuthService._blacklist_token(access_token)
        
    _delete_refresh_cookie(response)
    return {"message": "Successfully logged out"}


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the current user's password."""
    AuthService.change_password(db, current_user, request)
    return {"message": "Password changed successfully"}


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset.

    Always returns a generic success message regardless of whether the
    email is registered (enumeration protection).
    """
    raw_token = AuthService.create_password_reset_token(db, body.email)

    if raw_token:
        # In production, send this via email.  In dev, log to console.
        reset_url = f"http://localhost:5173/reset-password?token={raw_token}"
        logger.info(
            "=== PASSWORD RESET LINK (dev only) ===\n"
            "  Email : %s\n"
            "  URL   : %s\n"
            "======================================",
            body.email, reset_url,
        )

    # Always return the same message — never reveal whether the email exists
    return {"message": "If that email is in our system, we have sent a password reset link."}


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def reset_password(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using a valid reset token.

    Validates the token, updates the password, marks the token as used,
    and invalidates all existing sessions for the user.
    """
    AuthService.reset_password(db, body.token, body.new_password)
    return {"message": "Password has been reset successfully. Please log in with your new password."}
