"""
repositories/audit_log_repository.py

Repository for AuditLog persistence.
"""

from __future__ import annotations

import uuid
from typing import Dict, Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.repositories.base_repository import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        super().__init__(db, AuditLog)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(AuditLog.actor),
            )
        )

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[AuditLog]:

        result = await self.db.execute(
            self._base_query().where(
                AuditLog.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list_all(self) -> Sequence[AuditLog]:

        result = await self.db.execute(
            self._base_query()
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return result.scalars().all()

    async def list_by_actor(
        self,
        actor_id: uuid.UUID,
    ) -> Sequence[AuditLog]:

        result = await self.db.execute(
            self._base_query()
            .where(
                AuditLog.actor_id == actor_id
            )
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return result.scalars().all()

    async def list_for_entity(
        self,
        entity_type: str,
        entity_id: uuid.UUID,
    ) -> Sequence[AuditLog]:

        result = await self.db.execute(
            self._base_query()
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return result.scalars().all()

    # --------------------------------------------------
    # Reporting aggregates
    # --------------------------------------------------

    async def count_by_action(self) -> Dict[str, int]:
        """For the Audit Report's events-grouped-by-type breakdown."""

        result = await self.db.execute(
            select(AuditLog.action, func.count())
            .group_by(AuditLog.action)
        )

        return dict(result.all())

    async def count_by_actor(self) -> Sequence:
        """
        For the Audit Report's user-activity breakdown. Returns raw
        (actor_id, count) rows — resolving actor_id to a name is the
        service layer's job via UserRepository, not this repository's.
        """

        result = await self.db.execute(
            select(AuditLog.actor_id, func.count())
            .where(AuditLog.actor_id.isnot(None))
            .group_by(AuditLog.actor_id)
            .order_by(func.count().desc())
        )

        return result.all()

    async def count_by_period(self):
        """Audit events per day (UTC) — the Audit Report's timeline."""

        period = func.date_trunc("day", AuditLog.created_at)

        result = await self.db.execute(
            select(period, func.count())
            .group_by(period)
            .order_by(period)
        )

        return dict(result.all())

    async def list_recent(
        self,
        limit: int = 20,
    ) -> Sequence[AuditLog]:
        """
        Bounded recent-events view for the Audit Report — unlike
        list_all(), which is unbounded and used by the full /audit-logs
        listing endpoint.
        """

        result = await self.db.execute(
            self._base_query()
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )

        return result.scalars().all()

    async def list_by_actions(
        self,
        actions: Sequence[str],
        limit: int = 20,
    ) -> Sequence[AuditLog]:
        """
        Most recent events matching a specific set of actions — used for
        the Audit Report's "security events" section so it reliably shows
        recent security activity, rather than whatever happens to fall
        inside a generic recent-events slice.
        """

        result = await self.db.execute(
            self._base_query()
            .where(AuditLog.action.in_(actions))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )

        return result.scalars().all()
