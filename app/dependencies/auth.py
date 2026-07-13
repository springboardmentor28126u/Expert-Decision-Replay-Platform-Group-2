# dependencies/auth.py
"""
dependencies/auth.py

get_current_user: decodes the bearer token, loads the user from DB.
require_role: dependency FACTORY returning a dependency — enables
reusable, parameterized RBAC checks without duplicating logic per
route (architecture doc, section 7 — Dependency Injection Strategy).
"""
import uuid
from typing import Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User
from app.utils.exceptions import PermissionDeniedException, UnauthorizedException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


from sqlalchemy.orm import selectinload

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token)
    except JWTError:
        raise UnauthorizedException("Could not validate credentials.")

    if payload.get("type") != "access":
        raise UnauthorizedException("Wrong token type; an access token is required.")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Token is missing a subject.")

    result = await db.execute(
        select(User)
        .options(
            selectinload(User.role),
            selectinload(User.team),
        )
        .where(User.id == uuid.UUID(user_id))
    )

    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise UnauthorizedException("User not found or inactive.")

    return user


def require_role(*allowed_roles) -> Callable:
    """
    Dependency factory. Usage:

        @router.post("/", dependencies=[Depends(require_role(RoleName.ADMINISTRATOR))])

    `allowed_roles` accepts RoleName enum members; compared against
    `user.role.name` so this stays a pure authorization gate with no
    knowledge of *why* a given role is or isn't allowed — that decision
    lives at the call site, not in this dependency.
    """
    allowed_values = {role.value if hasattr(role, "value") else role for role in allowed_roles}

    async def _require_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in allowed_values:
            raise PermissionDeniedException(
                f"This action requires one of the following roles: {', '.join(sorted(allowed_values))}."
            )
        return current_user

    return _require_role
