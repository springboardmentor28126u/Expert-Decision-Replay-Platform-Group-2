"""
repositories/comment_repository.py

Repository for Comment persistence.
"""

from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.repositories.base_repository import BaseRepository


class CommentRepository(BaseRepository[Comment]):

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:
        super().__init__(db, Comment)

    def _base_query(self):
        return (
            super()
            ._base_query()
            .options(
                selectinload(Comment.author),
                selectinload(Comment.alternative),
                selectinload(Comment.parent),
                selectinload(Comment.replies),
                selectinload(Comment.attachments),
            )
        )

    async def get_by_id(
        self,
        id_: uuid.UUID,
    ) -> Optional[Comment]:

        result = await self.db.execute(
            self._base_query().where(
                Comment.id == id_
            )
        )

        return result.scalar_one_or_none()

    async def list_for_decision(
        self,
        decision_id: uuid.UUID,
    ) -> Sequence[Comment]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Comment.decision_id == decision_id,
                Comment.parent_comment_id.is_(None),
            )
            .order_by(Comment.created_at)
        )

        return result.scalars().all()

    async def list_for_alternative(
        self,
        alternative_id: uuid.UUID,
    ) -> Sequence[Comment]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Comment.alternative_id == alternative_id,
                Comment.parent_comment_id.is_(None),
            )
            .order_by(Comment.created_at)
        )

        return result.scalars().all()

    async def list_replies(
        self,
        parent_comment_id: uuid.UUID,
    ) -> Sequence[Comment]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Comment.parent_comment_id == parent_comment_id
            )
            .order_by(Comment.created_at)
        )

        return result.scalars().all()

    async def list_recent(
        self,
        limit: int = 5,
    ) -> Sequence[Comment]:
        """
        Most recently posted comments, for the Dashboard's activity feed.
        Adds `Comment.decision` on top of the base query's eager loads —
        only this call needs the parent decision's title.
        """

        result = await self.db.execute(
            self._base_query()
            .options(selectinload(Comment.decision))
            .order_by(Comment.created_at.desc())
            .limit(limit)
        )

        return result.scalars().all()

    async def list_by_author(
        self,
        author_id: uuid.UUID,
    ) -> Sequence[Comment]:

        result = await self.db.execute(
            self._base_query()
            .where(
                Comment.author_id == author_id
            )
            .order_by(Comment.created_at.desc())
        )

        return result.scalars().all()
