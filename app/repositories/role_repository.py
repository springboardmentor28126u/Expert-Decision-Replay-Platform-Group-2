# repositories/role_repository.py
"""
repositories/role_repository.py

Small, read-mostly repository. AuthService needs get_by_name to resolve
the default "employee" role on self-registration without hardcoding a
UUID anywhere in application code.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.repositories.base_repository import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, Role)

    async def get_by_name(self, name: str) -> Optional[Role]:
        result = await self.db.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()
