from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.exceptions.handlers import BadRequestException, NotFoundException
from app.models.approval import Approval
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.decision_repository import DecisionRepository


class ApprovalService:
    """Service for approval workflow."""

    def __init__(self, db: Session):
        self.db = db
        self.approval_repo = ApprovalRepository(db)
        self.decision_repo = DecisionRepository(db)

    def assign_reviewer(self, decision_id: int, reviewer_id: int, comments: str = None):
        decision = self.decision_repo.get_by_id(decision_id)

        if not decision:
            raise NotFoundException("Decision not found")

        existing = self.approval_repo.get_by_decision(decision_id)

        for approval in existing:
           if approval.reviewer_id == reviewer_id:
              raise BadRequestException("Reviewer already assigned")

        approval = Approval(
            decision_id=decision_id,
            reviewer_id=reviewer_id,
            status="Pending",
            comments=comments,
       )

        return self.approval_repo.create(approval)
        
    def approve(self, approval_id: int):
        approval = self.approval_repo.get_by_id(approval_id)

        if not approval:
            raise NotFoundException("Approval not found")

        approval.status = "Approved"
        approval.approved_at = datetime.now(timezone.utc)

        decision = self.decision_repo.get_by_id(approval.decision_id)
        decision.status = "Approved"

        self.decision_repo.update(decision)

        return self.approval_repo.update(approval)

    def reject(self, approval_id: int, comments: str = None):
        approval = self.approval_repo.get_by_id(approval_id)

        if not approval:
            raise NotFoundException("Approval not found")

        approval.status = "Rejected"
        approval.comments = comments
        approval.approved_at = datetime.now(timezone.utc)

        decision = self.decision_repo.get_by_id(approval.decision_id)
        decision.status = "Rejected"

        self.decision_repo.update(decision)

        return self.approval_repo.update(approval)

    def get_by_decision(self, decision_id: int):
        return self.approval_repo.get_by_decision(decision_id)

    def get_my_approvals(self, reviewer_id: int):
        return self.approval_repo.get_by_reviewer(reviewer_id)