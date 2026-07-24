"""
services/audit_log_service.py
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_log import AuditLogOut
from app.utils.exceptions import NotFoundException


class AuditLogService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        self.db = db
        self.audit_logs = AuditLogRepository(db)

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_logs(
        self,
    ) -> list[AuditLogOut]:

        logs = await self.audit_logs.list_all()

        return [
            AuditLogOut.model_validate(log)
            for log in logs
        ]

    async def list_by_actor(
        self,
        actor_id: uuid.UUID,
    ) -> list[AuditLogOut]:

        logs = await self.audit_logs.list_by_actor(
            actor_id
        )

        return [
            AuditLogOut.model_validate(log)
            for log in logs
        ]

    async def list_for_entity(
        self,
        entity_type: str,
        entity_id: uuid.UUID,
    ) -> list[AuditLogOut]:

        logs = await self.audit_logs.list_for_entity(
            entity_type,
            entity_id,
        )

        return [
            AuditLogOut.model_validate(log)
            for log in logs
        ]

    async def get_log(
        self,
        log_id: uuid.UUID,
    ) -> AuditLogOut:

        log = await self.audit_logs.get_by_id(
            log_id
        )

        if log is None:
            raise NotFoundException(
                "Audit log not found."
            )

        return AuditLogOut.model_validate(log)

    # --------------------------------------------------
    # Internal creation
    # --------------------------------------------------

    async def create_log(
        self,
        *,
        actor: User | None,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID,
        log_metadata: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:

        log = AuditLog(
            actor_id=actor.id if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            log_metadata=log_metadata,
            ip_address=ip_address,
        )

        self.audit_logs.add(log)

        await self.db.commit()

        await self.audit_logs.refresh(log)

        return log
