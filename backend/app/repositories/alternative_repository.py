"""Alternative repository — data access for alternatives table."""

from typing import List

from sqlalchemy.orm import Session

from app.models.alternative import Alternative
from app.repositories.base import BaseRepository


class AlternativeRepository(BaseRepository[Alternative]):
    """Repository for alternative data operations."""

    def __init__(self, db: Session):
        super().__init__(Alternative, db)

    def get_by_decision_id(self, decision_id: int) -> List[Alternative]:
        """Get all alternatives for a specific decision."""
        return (
            self.db.query(Alternative)
            .filter(Alternative.decision_id == decision_id)
            .all()
        )

    def delete_by_decision_id(self, decision_id: int) -> int:
        """Delete all alternatives for a decision. Returns count deleted."""
        count = (
            self.db.query(Alternative)
            .filter(Alternative.decision_id == decision_id)
            .delete()
        )
        self.db.commit()
        return count
