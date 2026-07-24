"""
repositories/alternative_repository.py

Persistence layer for Alternative entities.

Contains only database access. Business rules (permissions,
"only one selected alternative", notifications, audit logging,
etc.) belong in AlternativeService.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.alternative import Alternative
from app.repositories.base_repository import BaseRepository


class AlternativeRepository(BaseRepository[Alternative]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, Alternative)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(Alternative.created_by),
                selectinload(Alternative.decision),
                selectinload(Alternative.comments),
                selectinload(Alternative.attachments),
            )
        )

    async def get_by_id(
        self,
        alternative_id: uuid.UUID,
    ) -> Optional[Alternative]:
        result = await self.db.execute(
            self._base_query().where(
                Alternative.id == alternative_id
            )
        )
        return result.scalar_one_or_none()

    async def list_by_decision(
        self,
        decision_id: uuid.UUID,
    ) -> Sequence[Alternative]:
        result = await self.db.execute(
            self._base_query()
            .where(
                Alternative.decision_id == decision_id
            )
            .order_by(
                Alternative.created_at
            )
        )
        return result.scalars().all()

    async def get_selected(
        self,
        decision_id: uuid.UUID,
    ) -> Optional[Alternative]:
        result = await self.db.execute(
            self._base_query().where(
                Alternative.decision_id == decision_id,
                Alternative.is_selected.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def clear_selected(
        self,
        decision_id: uuid.UUID,
    ) -> None:
        await self.db.execute(
            update(Alternative)
            .where(
                Alternative.decision_id == decision_id
            )
            .values(
                is_selected=False
            )
        )
        await self.db.flush()

    async def count_for_decision(
        self,
        decision_id: uuid.UUID,
    ) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Alternative)
            .where(
                Alternative.decision_id == decision_id,
                Alternative.is_deleted.is_(False),
            )
        )
        return result.scalar_one()
