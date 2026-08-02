"""Authentication service — registration, login, token management."""

import logging

from sqlalchemy.orm import Session

from app.auth.jwt_handler import create_access_token
from app.auth.password import hash_password, verify_password
from app.exceptions.handlers import ConflictException, UnauthorizedException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class AuthService:
    """Service handling authentication business logic."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.audit_service = AuditService(db)

    def register(self, data: RegisterRequest) -> TokenResponse:
        """Register a new user."""
        if self.user_repo.email_exists(data.email):
            raise ConflictException("Email already registered")

        user = User(
            username=data.username,
            email=data.email,
            password=hash_password(data.password),
            role=data.role if data.role else "Employee",
        )
        user = self.user_repo.create(user)
        logger.info(f"User registered: {user.email}")

        self.audit_service.log_user_created(
            admin_id=None,
            target_user_id=user.id,
            username=user.username,
        )

        token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )

        return TokenResponse(
            access_token=token,
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=user.role or "Employee",
        )

    def login(self, data: LoginRequest, ip_address: str = None) -> TokenResponse:
        """Authenticate user with email and password."""
        user = self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password):
            self.audit_service.log_login_failed(email=data.email, ip_address=ip_address)
            raise UnauthorizedException("Invalid email or password")

        token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )

        logger.info(f"User logged in: {user.email}")
        self.audit_service.log_login_success(user_id=user.id, ip_address=ip_address)

        return TokenResponse(
            access_token=token,
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=user.role or "Employee",
        )

    def login_oauth2(self, email: str, password: str) -> TokenResponse:
        """OAuth2 password flow login (form-based).

        Args:
            email: User email (sent as 'username' in OAuth2 form).
            password: User password.

        Returns:
            TokenResponse with JWT and user info.
        """
        return self.login(LoginRequest(email=email, password=password))
