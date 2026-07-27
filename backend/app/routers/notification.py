"""
routers/notification.py
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services.notification_service import NotificationService

router = APIRouter()


def get_notification_service(
    db: AsyncSession = Depends(get_db),
) -> NotificationService:
    return NotificationService(db)


@router.get(
    "/",
    response_model=list[NotificationOut],
)
async def list_notifications(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    return await service.list_notifications(current_user)


@router.get(
    "/unread",
    response_model=list[NotificationOut],
)
async def list_unread_notifications(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    return await service.list_unread(current_user)


@router.get(
    "/unread/count",
    response_model=int,
)
async def unread_count(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    return await service.unread_count(current_user)


@router.get(
    "/{notification_id}",
    response_model=NotificationOut,
)
async def get_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    return await service.get_notification(notification_id, current_user)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
)
async def mark_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    return await service.mark_as_read(notification_id, current_user)


@router.patch(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    await service.mark_all_as_read(current_user)


@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):

    await service.delete_notification(notification_id, current_user)
