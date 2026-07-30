"""Discussion repository — data access for discussions table."""

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.discussion import Discussion
from app.repositories.base import BaseRepository


class DiscussionRepository(BaseRepository[Discussion]):
    """Repository for discussion data operations."""

    def __init__(self, db: Session):
        super().__init__(Discussion, db)

    def get_by_decision_id(
        self,
        decision_id: int,
        type_filter: Optional[str] = None,
    ) -> List[Discussion]:
        """Get top-level discussions for a decision (with threaded replies loaded).

        Args:
            decision_id: The decision to get discussions for.
            type_filter: Optional filter by type (comment, meeting_note, rationale).
        """
        query = (
            self.db.query(Discussion)
            .options(
                joinedload(Discussion.user),
                selectinload(Discussion.replies).joinedload(Discussion.user),
            )
            .filter(
                Discussion.decision_id == decision_id,
                Discussion.parent_id.is_(None),  # Top-level only
            )
        )

        if type_filter:
            query = query.filter(Discussion.type == type_filter)

        return query.order_by(Discussion.created_at.desc()).all()

    def get_by_id_with_user(self, id: int) -> Optional[Discussion]:
        """Get a discussion by ID with user data loaded."""
        return (
            self.db.query(Discussion)
            .options(
                joinedload(Discussion.user),
                selectinload(Discussion.replies).joinedload(Discussion.user),
            )
            .filter(Discussion.id == id)
            .first()
        )
