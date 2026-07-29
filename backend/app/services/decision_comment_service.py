"""
Expert Decision Replay Platform - Decision Comment Service

Business logic for Instagram-style comments on decisions.
Handles creation, listing, like toggling, editing, soft deletion,
@mention parsing, and notification dispatch.
"""

import re
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.decision_comment import DecisionComment
from app.models.decision_comment_like import DecisionCommentLike
from app.models.user import User
from app.models.membership import Membership, CompanyRole
from app.models.group_membership import GroupMembership
from app.schemas.decision_comment import (
    DecisionCommentCreate,
    DecisionCommentUpdate,
    DecisionCommentResponse,
    DecisionCommentAuthor,
    DecisionCommentLikeToggle,
)
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService


class DecisionCommentService:
    """Static methods for comment CRUD, likes, and notifications."""

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_accessible_user_ids(db: Session, decision: Decision) -> set[UUID]:
        """Return the set of user IDs that can access this decision."""
        company_admins = (
            db.query(Membership.user_id)
            .filter(
                Membership.company_id == decision.company_id,
                Membership.role == CompanyRole.ADMIN,
            )
            .all()
        )
        group_members = (
            db.query(GroupMembership.user_id)
            .filter(
                GroupMembership.group_id == decision.group_id,
                GroupMembership.is_active == True,  # noqa: E712
            )
            .all()
        )
        ids = {row[0] for row in company_admins}
        ids.update({row[0] for row in group_members})
        return ids

    @staticmethod
    def _parse_mentions(content: str, accessible_ids: set[UUID], db: Session) -> List[User]:
        """Extract @mentions from content and return matching users with access."""
        pattern = re.compile(r"@(\w+(?:\s\w+)*)")
        raw_names = pattern.findall(content)
        if not raw_names:
            return []

        mentioned_users: List[User] = []
        for name in raw_names:
            user = (
                db.query(User)
                .filter(
                    func.lower(User.full_name) == name.lower(),
                    User.id.in_(accessible_ids),
                )
                .first()
            )
            if user:
                mentioned_users.append(user)
        return mentioned_users

    @staticmethod
    def _compute_fields(
        db: Session,
        comment: DecisionComment,
        current_user_id: UUID,
    ) -> dict:
        """Compute like_count, liked_by_me, reply_count, reply_previews."""
        like_count = (
            db.query(func.count(DecisionCommentLike.id))
            .filter(DecisionCommentLike.comment_id == comment.id)
            .scalar()
        )

        liked_by_me = (
            db.query(DecisionCommentLike.id)
            .filter(
                DecisionCommentLike.comment_id == comment.id,
                DecisionCommentLike.user_id == current_user_id,
            )
            .first()
        ) is not None

        # Replies (non-deleted only)
        replies_query = (
            db.query(DecisionComment)
            .filter(
                DecisionComment.parent_comment_id == comment.id,
                DecisionComment.deleted_at.is_(None),
            )
            .order_by(DecisionComment.created_at.asc())
        )
        reply_count = replies_query.count()
        reply_previews = replies_query.limit(2).all()

        return {
            "like_count": like_count,
            "liked_by_me": liked_by_me,
            "reply_count": reply_count,
            "reply_previews": [
                DecisionCommentService._build_response(r, current_user_id, db)
                for r in reply_previews
            ],
        }

    @staticmethod
    def _build_response(
        comment: DecisionComment,
        current_user_id: UUID,
        db: Session,
    ) -> DecisionCommentResponse:
        """Build a full DecisionCommentResponse with computed fields."""
        fields = DecisionCommentService._compute_fields(db, comment, current_user_id)
        return DecisionCommentResponse(
            id=comment.id,
            decision_id=comment.decision_id,
            author_id=comment.author_id,
            author=DecisionCommentAuthor.model_validate(comment.author),
            content=comment.content if not comment.deleted_at else "[removed]",
            parent_comment_id=comment.parent_comment_id,
            is_edited=comment.is_edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            like_count=fields["like_count"],
            liked_by_me=fields["liked_by_me"],
            reply_count=fields["reply_count"],
            reply_previews=fields["reply_previews"],
        )

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @staticmethod
    def create_comment(
        db: Session,
        decision: Decision,
        data: DecisionCommentCreate,
        current_user: User,
    ) -> DecisionCommentResponse:
        """Create a new comment (top-level or reply)."""
        # Validate parent comment if provided
        if data.parent_comment_id:
            parent = (
                db.query(DecisionComment)
                .filter(
                    DecisionComment.id == data.parent_comment_id,
                    DecisionComment.decision_id == decision.id,
                    DecisionComment.deleted_at.is_(None),
                )
                .first()
            )
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found",
                )

        comment = DecisionComment(
            decision_id=decision.id,
            author_id=current_user.id,
            content=data.content,
            parent_comment_id=data.parent_comment_id,
        )
        db.add(comment)
        db.flush()  # get the ID

        # --- Notifications ---
        accessible_ids = DecisionCommentService._get_accessible_user_ids(db, decision)
        notified: set[UUID] = set()

        if not data.parent_comment_id:
            # Top-level comment: notify decision creator + assigned reviewers/managers
            notify_ids = set()
            if decision.created_by != current_user.id:
                notify_ids.add(decision.created_by)
            for stakeholder_id in (decision.stakeholder_ids or []):
                sid = UUID(stakeholder_id) if isinstance(stakeholder_id, str) else stakeholder_id
                if sid != current_user.id:
                    notify_ids.add(sid)
            for uid in notify_ids:
                if uid in accessible_ids:
                    NotificationService.create_in_app(
                        db=db,
                        user_id=uid,
                        type="comment_added",
                        title="New comment on decision",
                        message=f"{current_user.full_name} commented on '{decision.title}'",
                        payload={"decision_id": str(decision.id), "comment_id": str(comment.id)},
                    )
                    notified.add(uid)
        else:
            # Reply: notify parent comment's author
            parent = db.query(DecisionComment).filter(DecisionComment.id == data.parent_comment_id).first()
            if parent and parent.author_id != current_user.id:
                NotificationService.create_in_app(
                    db=db,
                    user_id=parent.author_id,
                    type="comment_reply",
                    title="Reply to your comment",
                    message=f"{current_user.full_name} replied to your comment on '{decision.title}'",
                    payload={"decision_id": str(decision.id), "comment_id": str(comment.id)},
                )
                notified.add(parent.author_id)

        # @mention notifications
        mentioned_users = DecisionCommentService._parse_mentions(data.content, accessible_ids, db)
        for mentioned in mentioned_users:
            if mentioned.id != current_user.id and mentioned.id not in notified:
                NotificationService.create_in_app(
                    db=db,
                    user_id=mentioned.id,
                    type="comment_mention",
                    title="You were mentioned in a comment",
                    message=f"{current_user.full_name} mentioned you in a comment on '{decision.title}'",
                    payload={"decision_id": str(decision.id), "comment_id": str(comment.id)},
                )
                notified.add(mentioned.id)

        db.commit()
        db.refresh(comment)

        return DecisionCommentService._build_response(comment, current_user.id, db)

    # ------------------------------------------------------------------
    # List top-level comments (paginated)
    # ------------------------------------------------------------------

    @staticmethod
    def list_comments(
        db: Session,
        decision_id: UUID,
        current_user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[DecisionCommentResponse], int]:
        """Return paginated top-level comments with computed fields."""
        base = (
            db.query(DecisionComment)
            .filter(
                DecisionComment.decision_id == decision_id,
                DecisionComment.parent_comment_id.is_(None),
                DecisionComment.deleted_at.is_(None),
            )
        )
        total = base.count()
        comments = (
            base.order_by(DecisionComment.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return (
            [DecisionCommentService._build_response(c, current_user_id, db) for c in comments],
            total,
        )

    # ------------------------------------------------------------------
    # List replies for a specific comment
    # ------------------------------------------------------------------

    @staticmethod
    def list_replies(
        db: Session,
        comment_id: UUID,
        current_user_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[DecisionCommentResponse], int]:
        """Return all replies under a specific comment (paginated)."""
        base = (
            db.query(DecisionComment)
            .filter(
                DecisionComment.parent_comment_id == comment_id,
                DecisionComment.deleted_at.is_(None),
            )
        )
        total = base.count()
        replies = (
            base.order_by(DecisionComment.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return (
            [DecisionCommentService._build_response(r, current_user_id, db) for r in replies],
            total,
        )

    # ------------------------------------------------------------------
    # Toggle like
    # ------------------------------------------------------------------

    @staticmethod
    def toggle_like(
        db: Session,
        comment_id: UUID,
        user_id: UUID,
    ) -> DecisionCommentLikeToggle:
        """Toggle like on a comment. Returns new state."""
        existing = (
            db.query(DecisionCommentLike)
            .filter(
                DecisionCommentLike.comment_id == comment_id,
                DecisionCommentLike.user_id == user_id,
            )
            .first()
        )

        if existing:
            db.delete(existing)
            db.flush()
        else:
            like = DecisionCommentLike(comment_id=comment_id, user_id=user_id)
            db.add(like)
            try:
                db.flush()
            except IntegrityError:
                db.rollback()
                # Race condition: another request already inserted — treat as unlike
                existing = (
                    db.query(DecisionCommentLike)
                    .filter(
                        DecisionCommentLike.comment_id == comment_id,
                        DecisionCommentLike.user_id == user_id,
                    )
                    .first()
                )
                if existing:
                    db.delete(existing)
                    db.flush()

        db.commit()

        like_count = (
            db.query(func.count(DecisionCommentLike.id))
            .filter(DecisionCommentLike.comment_id == comment_id)
            .scalar()
        )
        liked = (
            db.query(DecisionCommentLike.id)
            .filter(
                DecisionCommentLike.comment_id == comment_id,
                DecisionCommentLike.user_id == user_id,
            )
            .first()
        ) is not None

        return DecisionCommentLikeToggle(liked=liked, like_count=like_count)

    # ------------------------------------------------------------------
    # Edit
    # ------------------------------------------------------------------

    @staticmethod
    def update_comment(
        db: Session,
        comment_id: UUID,
        data: DecisionCommentUpdate,
        user_id: UUID,
    ) -> DecisionCommentResponse:
        """Edit a comment (author only). Sets is_edited = True."""
        comment = db.query(DecisionComment).filter(DecisionComment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        if comment.author_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the author can edit this comment")
        if comment.deleted_at:
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Comment has been removed")

        comment.content = data.content
        comment.is_edited = True
        db.commit()
        db.refresh(comment)
        return DecisionCommentService._build_response(comment, user_id, db)

    # ------------------------------------------------------------------
    # Soft delete
    # ------------------------------------------------------------------

    @staticmethod
    def delete_comment(
        db: Session,
        decision: Decision,
        comment_id: UUID,
        user_id: UUID,
    ) -> None:
        """Soft-delete a comment. Allowed for author or group owner (Admin/Manager)."""
        comment = db.query(DecisionComment).filter(DecisionComment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        if comment.deleted_at:
            return  # already soft-deleted

        # Permission: author OR company admin/manager of the decision's group
        is_author = comment.author_id == user_id
        is_moderator = False
        if not is_author:
            membership = (
                db.query(Membership)
                .filter(
                    Membership.user_id == user_id,
                    Membership.company_id == decision.company_id,
                )
                .first()
            )
            if membership and membership.role in (CompanyRole.ADMIN, CompanyRole.MANAGER):
                is_moderator = True

        if not is_author and not is_moderator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the author or a group admin can delete this comment",
            )

        from datetime import datetime, timezone
        comment.deleted_at = datetime.now(timezone.utc)

        AuditService.log(
            db,
            entity_type="decision_comment",
            entity_id=comment.id,
            action="soft_delete",
            performed_by=user_id,
            old_value={"content": comment.content},
            new_value={"deleted_at": str(comment.deleted_at)},
        )

        db.commit()

    # ------------------------------------------------------------------
    # Mentionable users for @mention autocomplete
    # ------------------------------------------------------------------

    @staticmethod
    def get_mentionable_users(
        db: Session,
        decision: Decision,
    ) -> List[User]:
        """Return users who have access to this decision (for @mention dropdown)."""
        accessible_ids = DecisionCommentService._get_accessible_user_ids(db, decision)
        if not accessible_ids:
            return []
        return (
            db.query(User)
            .filter(User.id.in_(accessible_ids))
            .order_by(User.full_name)
            .all()
        )
