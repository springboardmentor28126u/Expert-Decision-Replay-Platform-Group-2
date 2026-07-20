"""Version history repository — data access for decision_history table."""

from typing import List

from sqlalchemy.orm import Session, joinedload

from app.models.decision_history import DecisionHistory
from app.repositories.base import BaseRepository


class VersionRepository(BaseRepository[DecisionHistory]):
    """Repository for decision version history operations."""

    def __init__(self, db: Session):
        super().__init__(DecisionHistory, db)

    def get_by_decision_id(self, decision_id: int) -> List[DecisionHistory]:
        """Get all version history entries for a decision, newest first."""
        return (
            self.db.query(DecisionHistory)
            .options(joinedload(DecisionHistory.updater))
            .filter(DecisionHistory.decision_id == decision_id)
            .order_by(DecisionHistory.updated_at.desc())
            .all()
        )
