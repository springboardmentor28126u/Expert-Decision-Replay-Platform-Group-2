# services/auth_service.py
"""
services/auth_service.py

Handles registration, login, refresh, and logout. Owns the
security-critical logic that routers/auth.py deliberately doesn't:
password verification, token issuance, and refresh-token hash
storage/lookup.
"""
import hashlib
from datetime import datetime, timezone

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import RoleName
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest
from app.schemas.token import Token
from app.schemas.user import UserOut
from app.utils.exceptions import ConflictException, UnauthorizedException


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)
        self.roles = RoleRepository(db)

    @staticmethod
    def _hash_token(raw_token: str) -> str:
        """
        SHA-256 is sufficient here (unlike password hashing): this isn't
        defending against offline brute-force of a low-entropy secret —
        the refresh token itself is already a high-entropy signed JWT.
        We just need a fast, deterministic lookup key that doesn't store
        the live token in plaintext.
        """
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    async def register(self, payload: RegisterRequest) -> UserOut:
        """
        Public self-registration. Always assigns RoleName.EMPLOYEE —
        never trusts a role from the request body (see schemas/auth.py
        docstring). Email uniqueness is enforced here rather than
        relying solely on the DB unique constraint, so the client gets
        a clean 409 instead of a raw IntegrityError.
        """
        existing = await self.users.get_by_email(payload.email)
        if existing is not None:
            raise ConflictException("A user with this email already exists.")

        employee_role = await self.roles.get_by_name(RoleName.EMPLOYEE.value)
        if employee_role is None:
            # Seed data (db/init_db.py) is expected to have created the
            # four fixed roles already; this only fires if that seed
            # step was skipped in a given environment.
            raise ConflictException("Default role is not configured; contact an administrator.")

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role_id=employee_role.id,
        )
        self.users.add(user)
        await self.db.commit()

        created = await self.users.get_by_id(user.id)
        return UserOut.model_validate(created)

    async def authenticate(self, email: str, password: str) -> Token:
        user = await self.users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Incorrect email or password.")
        if not user.is_active:
            raise UnauthorizedException("This account has been deactivated.")

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        return await self._issue_tokens(user_id=user.id, role=user.role.name)

    async def _issue_tokens(self, user_id, role: str) -> Token:
        access_token = create_access_token(subject=user_id, role=role)
        refresh_token = create_refresh_token(subject=user_id, role=role)

        payload = decode_token(refresh_token)
        await self.refresh_tokens.create(
            user_id=user_id,
            token_hash=self._hash_token(refresh_token),
            jti=payload["jti"],
            expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        )
        await self.db.commit()

        return Token(access_token=access_token, refresh_token=refresh_token)

    async def refresh_access_token(self, refresh_token: str) -> Token:
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedException("Invalid or expired refresh token.")

        if payload.get("type") != "refresh":
            raise UnauthorizedException("Wrong token type; a refresh token is required.")

        record = await self.refresh_tokens.get_by_hash(self._hash_token(refresh_token))
        if record is None or not await self.refresh_tokens.is_valid(record):
            raise UnauthorizedException("Refresh token has been revoked or expired.")

        user = await self.users.get_by_id(record.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedException("User not found or inactive.")

        # Rotate: the old refresh token is revoked and a new one issued,
        # per architecture doc section 5, step 6 ("optionally rotate the
        # refresh token — recommended to prevent replay").
        await self.refresh_tokens.revoke_by_hash(self._hash_token(refresh_token))
        return await self._issue_tokens(user_id=user.id, role=user.role.name)

    async def revoke_refresh_token(self, refresh_token: str) -> None:
        # Intentionally silent on an already-invalid token: logout should
        # be idempotent, not leak whether a given token was ever valid.
        await self.refresh_tokens.revoke_by_hash(self._hash_token(refresh_token))
        await self.db.commit()

