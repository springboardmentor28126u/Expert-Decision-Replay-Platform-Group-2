"""
routers/audit_log.py
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.audit_log import AuditLogOut
from app.services.audit_log_service import AuditLogService

router = APIRouter()


def get_audit_log_service(
    db: AsyncSession = Depends(get_db),
) -> AuditLogService:
    return AuditLogService(db)


@router.get(
    "/",
    response_model=list[AuditLogOut],
)
async def list_logs(
    _: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
):

    return await service.list_logs()


@router.get(
    "/actor/{actor_id}",
    response_model=list[AuditLogOut],
)
async def list_actor_logs(
    actor_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
):

    return await service.list_by_actor(actor_id)


@router.get(
    "/entity/{entity_type}/{entity_id}",
    response_model=list[AuditLogOut],
)
async def list_entity_logs(
    entity_type: str,
    entity_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
):

    return await service.list_for_entity(
        entity_type,
        entity_id,
    )


@router.get(
    "/{log_id}",
    response_model=AuditLogOut,
)
async def get_log(
    log_id: uuid.UUID,
    _: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
):

    return await service.get_log(log_id)
