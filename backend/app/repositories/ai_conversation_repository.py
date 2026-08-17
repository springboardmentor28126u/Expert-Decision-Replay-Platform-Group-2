# repositories/ai_conversation_repository.py
"""
repositories/ai_conversation_repository.py

Repository for AIConversation persistence.
"""

from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ai_conversation import AIConversation
from app.repositories.base_repository import BaseRepository


class AIConversationRepository(BaseRepository[AIConversation]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, AIConversation)

    async def get_by_id(self, id_: uuid.UUID) -> Optional[AIConversation]:
        """
        Lightweight fetch — no messages eager-loaded. Used for ownership
        checks and the create/delete/list paths, none of which need the
        full message list. See get_with_messages() for the detail view.
        """
        result = await self.db.execute(
            self._base_query().where(AIConversation.id == id_)
        )
        return result.scalar_one_or_none()

    async def get_with_messages(self, id_: uuid.UUID) -> Optional[AIConversation]:
        result = await self.db.execute(
            self._base_query()
            .options(selectinload(AIConversation.messages))
            .where(AIConversation.id == id_)
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        offset: int = 0,
        limit: int = 50,
    ) -> Sequence[AIConversation]:
        result = await self.db.execute(
            self._base_query()
            .where(AIConversation.user_id == user_id)
            .order_by(AIConversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()
