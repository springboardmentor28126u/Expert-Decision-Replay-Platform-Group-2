# routers/auth.py
"""
routers/auth.py

/auth/register, /auth/login, /auth/refresh, /auth/logout.

Token issuance, verification, and revocation logic all live in
services/auth_service.py — this file only parses requests and shapes
responses (see architecture doc, section 5).
"""
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import RegisterRequest
from app.schemas.token import LogoutRequest, RefreshTokenRequest, Token
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

router = APIRouter()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserOut:
    """
    Public — no auth required. Always creates an Employee-role account;
    admins provision Reviewer/Manager/Administrator accounts separately
    via POST /users/ (routers/users.py), or promote via
    PATCH /users/{user_id}/role.
    """
    return await auth_service.register(payload)


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
) -> Token:
    """
    OAuth2PasswordRequestForm is what makes Swagger's "Authorize" button
    work out of the box — `form_data.username` is the user's email.
    """
    return await auth_service.authenticate(email=form_data.username, password=form_data.password)


@router.post("/refresh", response_model=Token, status_code=status.HTTP_200_OK)
async def refresh(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> Token:
    return await auth_service.refresh_access_token(refresh_token=payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    """
    Revokes only the supplied refresh token. The access token stays
    valid until natural expiry — an accepted tradeoff for short-lived
    access tokens (architecture doc, section 5, step 7).
    """
    await auth_service.revoke_refresh_token(refresh_token=payload.refresh_token)
