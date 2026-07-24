# repositories/user_repository.py
"""
repositories/user_repository.py

`selectinload(User.role)` is applied on every single-user fetch because
`dependencies/auth.py:require_role` reads `user.role.name` on nearly
every protected request — without eager loading, that's a lazy-load
per request, which fails outright under AsyncSession (lazy loading
requires a sync context) rather than just being slow.
"""
import uuid
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, User)

    def _base_query(self):
        return super()._base_query().options(selectinload(User.role), selectinload(User.team))

    async def get_by_id(self, id_: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(self._base_query().where(User.id == id_))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Deliberately does NOT filter is_deleted here — login needs to
        distinguish "no such account" from "deactivated account" to
        give AuthService a clean 401 vs. a clearer deactivation message.
        """
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.role), selectinload(User.team))
            .where(func.lower(User.email) == email.lower())
        )
        return result.scalar_one_or_none()

    async def list_paginated(self, offset: int, limit: int) -> Sequence[User]:
        result = await self.db.execute(self._base_query().offset(offset).limit(limit))
        return result.scalars().all()

