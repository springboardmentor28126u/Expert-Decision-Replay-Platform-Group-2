"""Authentication router — registration, login, logout."""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account.

    Returns a JWT token immediately upon successful registration.
    """
    service = AuthService(db)
    return service.register(data)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password (JSON body).

    Returns a JWT token on success.
    """
    service = AuthService(db)
    return service.login(data)


@router.post("/token", response_model=TokenResponse)
def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password flow login (form-based).

    Uses the standard OAuth2PasswordRequestForm where 'username' field
    contains the email address.
    """
    service = AuthService(db)
    return service.login_oauth2(form_data.username, form_data.password)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint.

    Since JWTs are stateless, the client should discard the token.
    This endpoint validates the current token and returns a success message.
    """
    return {"message": "Successfully logged out", "user_id": current_user.id}
