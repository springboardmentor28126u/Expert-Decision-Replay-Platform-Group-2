"""
repositories/audit_log_repository.py

Repository for AuditLog persistence.
"""

from __future__ import annotations

import uuid
from typing import Optional, Sequence

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
