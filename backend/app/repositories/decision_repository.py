"""
repositories/decision_repository.py
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.decision import Decision
from app.repositories.base_repository import BaseRepository


class DecisionRepository(BaseRepository[Decision]):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Decision)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(Decision.created_by),
                selectinload(Decision.team),
                selectinload(Decision.alternatives),
                selectinload(Decision.comments),
                selectinload(Decision.approvals),
                selectinload(Decision.attachments),
                selectinload(Decision.versions),
            )
        )

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[Decision]:

        result = await self.db.execute(
            self._base_query().where(
                Decision.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        offset: int,
        limit: int,
    ) -> Sequence[Decision]:

        result = await self.db.execute(
            self._base_query()
            .offset(offset)
            .limit(limit)
        )

        return result.scalars().all()

    async def search(
        self,
        keyword: str,
        offset: int = 0,
        limit: int = 20,
    ) -> Sequence[Decision]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Decision.title.ilike(f"%{keyword}%")
            )
            .offset(offset)
            .limit(limit)
        )

        return result.scalars().all()

    async def count(self) -> int:

        result = await self.db.execute(
            select(func.count())
            .select_from(Decision)
            .where(
                Decision.is_deleted.is_(False)
            )
        )

        return result.scalar_one()
