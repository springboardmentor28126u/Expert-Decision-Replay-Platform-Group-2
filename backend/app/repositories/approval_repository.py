"""Approval repository — data access for approvals table."""

from typing import List

from sqlalchemy.orm import Session, joinedload

from app.models.approval import Approval
from app.repositories.base import BaseRepository


class ApprovalRepository(BaseRepository[Approval]):
    """Repository for approval data operations."""

    def __init__(self, db: Session):
        super().__init__(Approval, db)

    def get_by_decision(self, decision_id: int) -> List[Approval]:
        """Get all approvals for a decision."""
        return (
            self.db.query(Approval)
            .options(
                joinedload(Approval.decision),
                joinedload(Approval.reviewer),
            )
            .filter(Approval.decision_id == decision_id)
            .all()
        )

    def get_by_reviewer(self, reviewer_id: int) -> List[Approval]:
        """Get all approvals assigned to a reviewer."""
        return (
            self.db.query(Approval)
            .options(joinedload(Approval.decision))
            .filter(Approval.reviewer_id == reviewer_id)
            .all()
        )