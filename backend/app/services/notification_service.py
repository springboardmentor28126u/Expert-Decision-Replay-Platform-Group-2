"""
services/notification_service.py
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationOut
from app.utils.exceptions import NotFoundException


class NotificationService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        self.db = db
        self.notifications = NotificationRepository(db)

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_notifications(
        self,
        current_user: User,
    ) -> list[NotificationOut]:

        notifications = await self.notifications.list_for_user(
            current_user.id
        )

        return [
            NotificationOut.model_validate(notification)
            for notification in notifications
        ]

    async def list_unread(
        self,
        current_user: User,
    ) -> list[NotificationOut]:

        notifications = await self.notifications.list_unread(
            current_user.id
        )

        return [
            NotificationOut.model_validate(notification)
            for notification in notifications
        ]

    async def unread_count(
        self,
        current_user: User,
    ) -> int:

        return await self.notifications.unread_count(
            current_user.id
        )

    async def get_notification(
        self,
        notification_id: uuid.UUID,
    ) -> NotificationOut:

        notification = await self.notifications.get_by_id(
            notification_id
        )

        if notification is None:
            raise NotFoundException(
                "Notification not found."
            )

        return NotificationOut.model_validate(
            notification
        )

    # --------------------------------------------------
    # Internal creation
    # --------------------------------------------------

    async def create_notification(
        self,
        *,
        recipient_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_entity_type: str,
        related_entity_id: uuid.UUID,
    ) -> Notification:

        notification = Notification(
            recipient_id=recipient_id,
            type=notification_type,
            title=title,
            message=message,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            is_read=False,
        )

        self.notifications.add(notification)

        await self.db.commit()

        await self.notifications.refresh(notification)

        return notification

    # --------------------------------------------------
    # Update
    # --------------------------------------------------

    async def mark_as_read(
        self,
        notification_id: uuid.UUID,
    ) -> NotificationOut:

        notification = await self.notifications.get_by_id(
            notification_id
        )

        if notification is None:
            raise NotFoundException(
                "Notification not found."
            )

        notification.is_read = True

        await self.db.commit()

        await self.notifications.refresh(notification)

        return NotificationOut.model_validate(
            notification
        )

    async def mark_all_as_read(
        self,
        current_user: User,
    ) -> None:

        notifications = await self.notifications.list_unread(
            current_user.id
        )

        for notification in notifications:
            notification.is_read = True

        await self.db.commit()

    # --------------------------------------------------
    # Delete
    # --------------------------------------------------

    async def delete_notification(
        self,
        notification_id: uuid.UUID,
    ) -> None:

        notification = await self.notifications.get_by_id(
            notification_id
        )

        if notification is None:
            raise NotFoundException(
                "Notification not found."
            )

        await self.notifications.soft_delete(notification)

        await self.db.commit()
