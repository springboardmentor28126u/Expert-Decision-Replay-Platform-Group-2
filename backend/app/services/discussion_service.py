"""Discussion service — comments, meeting notes, and threaded discussions."""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.exceptions.handlers import NotFoundException, ForbiddenException
from app.models.discussion import Discussion
from app.models.user import User
from app.repositories.discussion_repository import DiscussionRepository
from app.schemas.discussion import DiscussionCreate, DiscussionUpdate

from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class DiscussionService:
    """Service handling discussion business logic."""

    def __init__(self, db: Session):
        self.disc_repo = DiscussionRepository(db)
        self.audit_service = AuditService(db)

    def create_discussion(
        self, decision_id: int, data: DiscussionCreate, user: User
    ) -> Discussion:
        """Create a new discussion entry (comment, meeting note, or rationale)."""
        # Validate parent_id if threading
        if data.parent_id:
            parent = self.disc_repo.get_by_id(data.parent_id)
            if not parent:
                raise NotFoundException(f"Parent discussion {data.parent_id} not found")
            if parent.decision_id != decision_id:
                raise NotFoundException("Parent discussion belongs to a different decision")

        discussion = Discussion(
            decision_id=decision_id,
            user_id=user.id,
            parent_id=data.parent_id,
            type=data.type,
            comment=data.comment,
        )
        discussion = self.disc_repo.create(discussion)
        logger.info(
            f"Discussion created: {discussion.id} (type={data.type}) "
            f"for decision {decision_id}"
        )

        if data.parent_id:
            self.audit_service.log_discussion_comment_added(user_id=user.id, decision_id=decision_id)
        else:
            self.audit_service.log_discussion_created(
                user_id=user.id, decision_id=decision_id, discussion_type=data.type
            )

        return self.disc_repo.get_by_id_with_user(discussion.id) or discussion

    def get_discussions(
        self, decision_id: int, type_filter: Optional[str] = None
    ) -> List[Discussion]:
        """Get all top-level discussions for a decision with threaded replies."""
        return self.disc_repo.get_by_decision_id(decision_id, type_filter=type_filter)

    def update_discussion(
        self, discussion_id: int, data: DiscussionUpdate, user: User
    ) -> Discussion:
        """Update a discussion (only the author can edit)."""
        discussion = self.disc_repo.get_by_id(discussion_id)
        if not discussion:
            raise NotFoundException(f"Discussion with ID {discussion_id} not found")

        # Only the author or an admin can edit
        if discussion.user_id != user.id and user.role != "Administrator":
            raise ForbiddenException("You can only edit your own discussions")

        if data.comment is not None:
            discussion.comment = data.comment

        return self.disc_repo.update(discussion)

    def delete_discussion(self, discussion_id: int, user: User) -> None:
        """Delete a discussion (only author or admin)."""
        discussion = self.disc_repo.get_by_id(discussion_id)
        if not discussion:
            raise NotFoundException(f"Discussion with ID {discussion_id} not found")

        if discussion.user_id != user.id and user.role != "Administrator":
            raise ForbiddenException("You can only delete your own discussions")

        self.disc_repo.delete(discussion)
        logger.info(f"Discussion {discussion_id} deleted by user {user.id}")
