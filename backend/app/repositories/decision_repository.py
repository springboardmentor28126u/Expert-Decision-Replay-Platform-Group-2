"""
repositories/decision_repository.py
"""

import uuid
from typing import Dict, Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.decision import Decision
from app.models.enums import DecisionStatus
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

    async def count_by_status(self) -> Dict[DecisionStatus, int]:
        """
        Single grouped COUNT for the Dashboard's status breakdown —
        deliberately not `list()` + count-in-Python, which would pull
        every row just to tally them.
        """

        result = await self.db.execute(
            select(Decision.status, func.count())
            .where(Decision.is_deleted.is_(False))
            .group_by(Decision.status)
        )

        return dict(result.all())

    async def count_by_category(self) -> Dict[Optional[str], int]:
        """For the Decision Report's category breakdown."""

        result = await self.db.execute(
            select(Decision.category, func.count())
            .where(Decision.is_deleted.is_(False))
            .group_by(Decision.category)
        )

        return dict(result.all())

    async def count_by_period(self):
        """
        Decisions created per day (UTC) — the Decision Report's "created
        over time" table. Truncation happens in SQL so only the already-
        aggregated rows come back, not every Decision.
        """

        period = func.date_trunc("day", Decision.created_at)

        result = await self.db.execute(
            select(period, func.count())
            .where(Decision.is_deleted.is_(False))
            .group_by(period)
            .order_by(period)
        )

        return dict(result.all())

    async def count_by_team(self) -> Dict[uuid.UUID, int]:
        """
        For the Team Report's decisions-per-team breakdown. Decisions
        with no team are excluded — there's no team to attribute them to.
        """

        result = await self.db.execute(
            select(Decision.team_id, func.count())
            .where(
                Decision.is_deleted.is_(False),
                Decision.team_id.isnot(None),
            )
            .group_by(Decision.team_id)
        )

        return dict(result.all())

    async def list_recent(
        self,
        limit: int = 10,
    ) -> Sequence[Decision]:
        """Most recently created decisions, for the Decision Report."""

        result = await self.db.execute(
            self._base_query()
            .order_by(Decision.created_at.desc())
            .limit(limit)
        )

        return result.scalars().all()
