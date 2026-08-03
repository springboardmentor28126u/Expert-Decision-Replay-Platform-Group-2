"""
repositories/approval_repository.py

Repository for Approval persistence.
"""

from __future__ import annotations

import uuid
from typing import Dict, Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.approval import Approval
from app.models.decision import Decision
from app.models.enums import ApprovalStatus
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

    # --------------------------------------------------
    # Reporting aggregates
    # --------------------------------------------------

    async def count_by_status(self) -> Dict[ApprovalStatus, int]:
        """For the Approval Report's pending/approved/rejected/escalated counts."""

        result = await self.db.execute(
            select(Approval.status, func.count())
            .group_by(Approval.status)
        )

        return dict(result.all())

    async def count_by_level_and_status(self) -> Sequence:
        """For the Approval Report's multi-level summary."""

        result = await self.db.execute(
            select(Approval.level, Approval.status, func.count())
            .group_by(Approval.level, Approval.status)
            .order_by(Approval.level)
        )

        return result.all()

    async def average_completion_seconds(self) -> Optional[float]:
        """
        Average time from assignment (created_at) to decision (decided_at)
        across every approval that has actually been decided. Approvals
        still pending have no decided_at and are excluded — there's
        nothing to average yet for them.
        """

        result = await self.db.execute(
            select(
                func.avg(
                    func.extract("epoch", Approval.decided_at - Approval.created_at)
                )
            ).where(Approval.decided_at.isnot(None))
        )

        return result.scalar_one_or_none()

    async def count_by_status_per_team(self) -> Sequence:
        """
        For the Team Report's per-team approval statistics. Joins through
        Decision to reach team_id — Approval has no team of its own.
        Decisions with no team are excluded, matching
        DecisionRepository.count_by_team().
        """

        result = await self.db.execute(
            select(Decision.team_id, Approval.status, func.count())
            .join(Decision, Decision.id == Approval.decision_id)
            .where(Decision.team_id.isnot(None))
            .group_by(Decision.team_id, Approval.status)
        )

        return result.all()
