"""Authentication router — registration, login, logout."""

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    service = AuthService(db)
    return service.register(data)


@router.post("/login", response_model=TokenResponse)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password (JSON body)."""
    service = AuthService(db)
    ip_address = _get_client_ip(request)
    return service.login(data, ip_address=ip_address)


@router.post("/token", response_model=TokenResponse)
def login_oauth2(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password flow login (form-based)."""
    service = AuthService(db)
    ip_address = _get_client_ip(request)
    return service.login(LoginRequest(email=form_data.username, password=form_data.password), ip_address=ip_address)


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Logout endpoint."""
    audit_service = AuditService(db)
    ip_address = _get_client_ip(request)
    audit_service.log_logout(user_id=current_user.id, ip_address=ip_address)
    return {"message": "Successfully logged out", "user_id": current_user.id}
