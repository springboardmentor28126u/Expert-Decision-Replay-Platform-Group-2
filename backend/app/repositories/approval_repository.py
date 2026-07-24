"""
repositories/approval_repository.py

Repository for Approval persistence.
"""

from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.approval import Approval
from app.repositories.base_repository import BaseRepository


class ApprovalRepository(BaseRepository[Approval]):

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        super().__init__(db, Approval)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(Approval.reviewer),
                selectinload(Approval.decision),
            )
        )

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[Approval]:

        result = await self.db.execute(
            self._base_query().where(
                Approval.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list_by_decision(
        self,
        decision_id: uuid.UUID,
    ) -> Sequence[Approval]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Approval.decision_id == decision_id
            )
            .order_by(
                Approval.level
            )
        )

        return result.scalars().all()

    async def list_by_reviewer(
        self,
        reviewer_id: uuid.UUID,
    ) -> Sequence[Approval]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Approval.reviewer_id == reviewer_id
            )
            .order_by(
                Approval.level
            )
        )

        return result.scalars().all()

    async def find_assignment(
        self,
        decision_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        level: int,
    ) -> Optional[Approval]:

        result = await self.db.execute(
            self._base_query().where(
                Approval.decision_id == decision_id,
                Approval.reviewer_id == reviewer_id,
                Approval.level == level,
            )
        )

        return result.scalar_one_or_none()
