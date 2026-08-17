# repositories/ai_message_repository.py
"""
repositories/ai_message_repository.py

Repository for AIMessage persistence.
"""

from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_message import AIMessage
from app.repositories.base_repository import BaseRepository


class AIMessageRepository(BaseRepository[AIMessage]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db, AIMessage)

    async def list_recent_for_conversation(
        self,
        conversation_id: uuid.UUID,
        limit: int,
    ) -> Sequence[AIMessage]:
        """
        The last `limit` messages in chronological order — used to build
        the bounded prompt context sent to the LLM (see
        services/ai_conversation_service.py). Ordering by created_at
        DESC + limit, then reversing in Python, rather than fetching
        everything and slicing, so a long-running conversation never
        pulls its full history just to answer one more message.
        """
        result = await self.db.execute(
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation_id)
            .order_by(AIMessage.created_at.desc())
            .limit(limit)
        )
        return list(reversed(result.scalars().all()))
