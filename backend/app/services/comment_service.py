"""
services/comment_service.py

Business logic for comments and discussion threads.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.decision import Decision
from app.models.user import User

from app.repositories.comment_repository import CommentRepository
from app.repositories.decision_repository import DecisionRepository

from app.schemas.comment import (
    CommentCreate,
    CommentOut,
    CommentThreadOut,
    CommentUpdate,
)

from app.services import email_service

from app.utils.exceptions import (
    NotFoundException,
    PermissionDeniedException,
)

logger = logging.getLogger("edrp.comments")


class CommentService:

    def __init__(
        self,
        db: AsyncSession,
        background_tasks: BackgroundTasks | None = None,
    ) -> None:

        self.db = db
        self.background_tasks = background_tasks

        self.comments = CommentRepository(db)
        self.decisions = DecisionRepository(db)

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_comments(
        self,
        decision_id: uuid.UUID,
    ) -> list[CommentThreadOut]:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        roots = await self.comments.list_for_decision(
            decision_id
        )

        result: list[CommentThreadOut] = []

        for comment in roots:

            replies = await self.comments.list_replies(
                comment.id
            )

            result.append(
                CommentThreadOut(
                    **CommentOut.model_validate(
                        comment
                    ).model_dump(),
                    replies=[
                        CommentOut.model_validate(r)
                        for r in replies
                    ],
                )
            )

        return result

    async def get_comment(
        self,
        comment_id: uuid.UUID,
    ) -> CommentOut:

        comment = await self.comments.get_by_id(
            comment_id
        )

        if comment is None:
            raise NotFoundException(
                "Comment not found."
            )

        return CommentOut.model_validate(
            comment
        )

    # --------------------------------------------------
    # Create
    # --------------------------------------------------

    async def create_comment(
        self,
        decision_id: uuid.UUID,
        payload: CommentCreate,
        current_user: User,
    ) -> CommentOut:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        comment = Comment(
            decision_id=decision_id,
            alternative_id=payload.alternative_id,
            parent_comment_id=payload.parent_comment_id,
            content=payload.content,
            is_meeting_note=payload.is_meeting_note,
            author_id=current_user.id,
        )

        self.comments.add(comment)

        await self.db.commit()

        created = await self.comments.get_by_id(
            comment.id
        )

        self._notify_new_comment(
            decision=decision,
            comment=created,
            author=current_user,
        )

        return CommentOut.model_validate(
            created
        )

    def _notify_new_comment(
        self,
        *,
        decision: Decision,
        comment: Comment,
        author: User,
    ) -> None:
        """
        Best-effort email alert to the decision's creator. There is no
        existing in-app notification for comments to piggyback on (unlike
        approvals — see approval_service._notify_safely), so this only
        supplements the discussion itself, exactly as the email alerts
        requirement calls for; it never touches Notification rows.
        """
        if self.background_tasks is None:
            return

        if decision.created_by_id == author.id:
            return

        creator = decision.created_by

        if creator is None or not creator.email:
            return

        try:
            excerpt = (
                comment.content
                if len(comment.content) <= 200
                else comment.content[:200] + "..."
            )
            email_service.queue_email(
                self.background_tasks,
                to_email=creator.email,
                heading=f'New comment on "{decision.title}"',
                message=f'{author.full_name} wrote: "{excerpt}"',
                decision_title=decision.title,
                decision_id=decision.id,
            )
        except Exception:
            logger.exception(
                "Failed to queue new-comment email (decision=%s, comment=%s); "
                "comment creation is unaffected.",
                decision.id,
                comment.id,
            )

    # --------------------------------------------------
    # Update
    # --------------------------------------------------

    async def update_comment(
        self,
        comment_id: uuid.UUID,
        payload: CommentUpdate,
        current_user: User,
    ) -> CommentOut:

        comment = await self.comments.get_by_id(
            comment_id
        )

        if comment is None:
            raise NotFoundException(
                "Comment not found."
            )

        if (
            comment.author_id != current_user.id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to edit this comment."
            )

        comment.content = payload.content

        await self.db.commit()

        updated = await self.comments.get_by_id(
            comment_id
        )

        return CommentOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Delete
    # --------------------------------------------------

    async def delete_comment(
        self,
        comment_id: uuid.UUID,
        current_user: User,
    ) -> None:

        comment = await self.comments.get_by_id(
            comment_id
        )

        if comment is None:
            raise NotFoundException(
                "Comment not found."
            )

        if (
            comment.author_id != current_user.id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to delete this comment."
            )

        await self.comments.soft_delete(
            comment
        )

        await self.db.commit()
