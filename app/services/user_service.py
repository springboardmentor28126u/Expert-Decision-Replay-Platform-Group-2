# services/user_service.py
"""
services/user_service.py

Business rules for user management: "can this user view/edit that
user's record?", password confirmation on self-service change, etc.
Route-level RBAC (`require_role`) already gates the coarse cases;
anything finer lives here.
"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.enums import RoleName
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.user import PasswordChange, UserCreate, UserOut, UserSelfUpdate, UserUpdate
from app.utils.exceptions import ConflictException, NotFoundException, PermissionDeniedException, UnauthorizedException


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UserRepository(db)

    async def list_users(self, pagination: PaginationParams) -> PaginatedResponse[UserOut]:
        items = await self.users.list_paginated(offset=pagination.offset, limit=pagination.page_size)
        total = await self.users.count()
        return PaginatedResponse[UserOut](
            items=[UserOut.model_validate(u) for u in items],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )

    async def create_user(self, payload: UserCreate) -> UserOut:
        existing = await self.users.get_by_email(payload.email)
        if existing is not None:
            raise ConflictException("A user with this email already exists.")

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role_id=payload.role_id,
            team_id=payload.team_id,
        )
        self.users.add(user)
        await self.db.commit()

        created = await self.users.get_by_id(user.id)
        return UserOut.model_validate(created)

    async def get_user(self, user_id: uuid.UUID, acting_user: User) -> UserOut:
        """
        Any authenticated user may fetch their own record via this path;
        fetching someone else's requires Manager/Administrator — the
        finer-than-route-level rule mentioned in routers/users.py.
        """
        if user_id != acting_user.id and acting_user.role.name not in (
            RoleName.MANAGER.value,
            RoleName.ADMINISTRATOR.value,
        ):
            raise PermissionDeniedException("You may only view your own profile.")

        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundException("User not found.")
        return UserOut.model_validate(user)

    async def update_user(
        self, user_id: uuid.UUID, payload: UserUpdate | UserSelfUpdate, acting_user: User
    ) -> UserOut:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundException("User not found.")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(user, field, value)

        await self.db.commit()
        refreshed = await self.users.get_by_id(user_id)
        return UserOut.model_validate(refreshed)

    async def change_password(self, user_id: uuid.UUID, payload: PasswordChange) -> None:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundException("User not found.")
        if not verify_password(payload.current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect.")

        user.hashed_password = hash_password(payload.new_password)
        await self.db.commit()

    async def deactivate_user(self, user_id: uuid.UUID) -> None:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundException("User not found.")
        user.is_active = False
        await self.db.commit()

    async def change_role(self, user_id: uuid.UUID, role_id: uuid.UUID) -> UserOut:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundException("User not found.")
        user.role_id = role_id
        await self.db.commit()
        refreshed = await self.users.get_by_id(user_id)
        return UserOut.model_validate(refreshed)
