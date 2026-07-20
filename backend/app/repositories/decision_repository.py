"""Decision repository — data access for decisions table."""

from typing import Optional, List

from sqlalchemy.orm import Session, joinedload

from app.models.decision import Decision
from app.repositories.base import BaseRepository


class DecisionRepository(BaseRepository[Decision]):
    """Repository for decision data operations."""

    def __init__(self, db: Session):
        super().__init__(Decision, db)

    def get_by_id_with_relations(self, id: int) -> Optional[Decision]:
        """Get a decision by ID with all related data eagerly loaded."""
        return (
            self.db.query(Decision)
            .options(
                joinedload(Decision.creator),
                joinedload(Decision.alternatives),
                joinedload(Decision.discussions),
                joinedload(Decision.files),
            )
            .filter(Decision.id == id)
            .first()
        )

    def get_filtered(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        created_by: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Decision]:
        """Get decisions with optional filters."""
        query = self.db.query(Decision).options(joinedload(Decision.creator))

        if status:
            query = query.filter(Decision.status == status)
        if category:
            query = query.filter(Decision.category == category)
        if created_by:
            query = query.filter(Decision.created_by == created_by)
        if search:
            query = query.filter(
                Decision.title.ilike(f"%{search}%")
                | Decision.description.ilike(f"%{search}%")
            )

        return query.order_by(Decision.created_at.desc()).offset(skip).limit(limit).all()

    def count_filtered(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        created_by: Optional[int] = None,
        search: Optional[str] = None,
    ) -> int:
        """Count decisions matching filters."""
        query = self.db.query(Decision)

        if status:
            query = query.filter(Decision.status == status)
        if category:
            query = query.filter(Decision.category == category)
        if created_by:
            query = query.filter(Decision.created_by == created_by)
        if search:
            query = query.filter(
                Decision.title.ilike(f"%{search}%")
                | Decision.description.ilike(f"%{search}%")
            )

        return query.count()

    def get_categories(self) -> List[str]:
        """Get all unique decision categories."""
        results = (
            self.db.query(Decision.category)
            .filter(Decision.category.isnot(None))
            .distinct()
            .all()
        )
        return [r[0] for r in results]
