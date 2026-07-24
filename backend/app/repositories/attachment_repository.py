"""
repositories/attachment_repository.py

Repository for Attachment persistence.
"""

from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attachment import Attachment
from app.repositories.base_repository import BaseRepository


class AttachmentRepository(BaseRepository[Attachment]):

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        super().__init__(db, Attachment)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(Attachment.uploaded_by),
                selectinload(Attachment.decision),
                selectinload(Attachment.alternative),
                selectinload(Attachment.comment),
            )
        )

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[Attachment]:

        result = await self.db.execute(
            self._base_query().where(
                Attachment.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list_for_decision(
        self,
        decision_id: uuid.UUID,
    ) -> Sequence[Attachment]:

        result = await self.db.execute(
            self._base_query().where(
                Attachment.decision_id == decision_id
            )
        )

        return result.scalars().all()

    async def list_for_alternative(
        self,
        alternative_id: uuid.UUID,
    ) -> Sequence[Attachment]:

        result = await self.db.execute(
            self._base_query().where(
                Attachment.alternative_id == alternative_id
            )
        )

        return result.scalars().all()

    async def list_for_comment(
        self,
        comment_id: uuid.UUID,
    ) -> Sequence[Attachment]:

        result = await self.db.execute(
            self._base_query().where(
                Attachment.comment_id == comment_id
            )
        )

        return result.scalars().all()

    async def list_uploaded_by(
        self,
        user_id: uuid.UUID,
    ) -> Sequence[Attachment]:

        result = await self.db.execute(
            self._base_query().where(
                Attachment.uploaded_by_id == user_id
            )
        )

        return result.scalars().all()
