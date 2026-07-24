"""
repositories/notification_repository.py

Repository for Notification persistence.
"""

from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import Notification
from app.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        super().__init__(db, Notification)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(Notification.recipient),
            )
        )

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[Notification]:

        result = await self.db.execute(
            self._base_query().where(
                Notification.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
    ) -> Sequence[Notification]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Notification.recipient_id == user_id
            )
            .order_by(
                Notification.created_at.desc()
            )
        )

        return result.scalars().all()

    async def list_unread(
        self,
        user_id: uuid.UUID,
    ) -> Sequence[Notification]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Notification.recipient_id == user_id,
                Notification.is_read.is_(False),
            )
            .order_by(
                Notification.created_at.desc()
            )
        )

        return result.scalars().all()

    async def unread_count(
        self,
        user_id: uuid.UUID,
    ) -> int:

        notifications = await self.list_unread(
            user_id
        )

        return len(notifications)
