"""
repositories/decision_version_repository.py

Persistence layer for immutable DecisionVersion snapshots.
"""

import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decision import Decision
from app.models.decision_version import DecisionVersion


class DecisionVersionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_snapshot(
        self,
        decision: Decision,
        changed_by_id: uuid.UUID | None,
    ) -> DecisionVersion:
        """
        Stores a complete immutable snapshot of the current decision
        before it is modified.
        """

        version = DecisionVersion(
            decision_id=decision.id,
            version_number=decision.version,
            title=decision.title,
            problem_statement=decision.problem_statement,
            category=decision.category,
            decision_rationale=decision.decision_rationale,
            status=decision.status,
            changed_by_id=changed_by_id,
        )

        self.db.add(version)
        await self.db.flush()

        return version

    async def get_versions(
        self,
        decision_id: uuid.UUID,
    ) -> Sequence[DecisionVersion]:
        result = await self.db.execute(
            select(DecisionVersion)
            .where(
                DecisionVersion.decision_id == decision_id
            )
            .order_by(
                DecisionVersion.version_number.desc()
            )
        )

        return result.scalars().all()

    async def get_version(
        self,
        decision_id: uuid.UUID,
        version_number: int,
    ) -> DecisionVersion | None:

        result = await self.db.execute(
            select(DecisionVersion)
            .where(
                DecisionVersion.decision_id == decision_id,
                DecisionVersion.version_number == version_number,
            )
        )

        return result.scalar_one_or_none()
