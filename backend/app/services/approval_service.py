from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.exceptions.handlers import (
    BadRequestException,
    NotFoundException,
)
from app.models.approval import Approval
from app.models.user import User
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.decision_repository import DecisionRepository


class ApprovalService:
    """Service for approval workflow."""

    def __init__(self, db: Session):
        self.db = db
        self.approval_repo = ApprovalRepository(db)
        self.decision_repo = DecisionRepository(db)

    def assign_reviewer(
        self,
        decision_id: int,
        reviewer_id: int,
        assigned_by_id: int,
        comments: str = None,
    ):
        decision = self.decision_repo.get_by_id(decision_id)

        if not decision:
            raise NotFoundException("Decision not found")

        # Make sure selected reviewer actually exists
        reviewer = (
            self.db.query(User)
            .filter(User.id == reviewer_id)
            .first()
        )

        if not reviewer:
            raise NotFoundException("Reviewer not found")

        if reviewer.role != "Reviewer":
            raise BadRequestException(
                "Selected user is not a Reviewer"
            )

        # Make sure assigning user exists
        assigned_by = (
            self.db.query(User)
            .filter(User.id == assigned_by_id)
            .first()
        )

        if not assigned_by:
            raise NotFoundException(
                "Assigning user not found"
            )

        existing = self.approval_repo.get_by_decision(decision_id)

        for approval in existing:
            if approval.reviewer_id == reviewer_id:
                raise BadRequestException(
                    "Reviewer already assigned"
                )

        approval = Approval(
            decision_id=decision_id,
            reviewer_id=reviewer_id,
            assigned_by_id=assigned_by_id,
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

        decision = self.decision_repo.get_by_id(
            approval.decision_id
        )

        if decision:
            decision.status = "Approved"
            self.decision_repo.update(decision)

        return self.approval_repo.update(approval)

    def reject(
        self,
        approval_id: int,
        comments: str = None,
    ):
        approval = self.approval_repo.get_by_id(approval_id)

        if not approval:
            raise NotFoundException("Approval not found")

        approval.status = "Rejected"
        approval.comments = comments
        approval.approved_at = datetime.now(timezone.utc)

        decision = self.decision_repo.get_by_id(
            approval.decision_id
        )

        if decision:
            decision.status = "Rejected"
            self.decision_repo.update(decision)

        return self.approval_repo.update(approval)

    def _format_approval(self, approval):
        """Return approval with actual reviewer and assigner names."""

        reviewer_name = None
        assigned_by_name = None

        if approval.reviewer:
            reviewer_name = approval.reviewer.username

        if approval.assigned_by:
            assigned_by_name = approval.assigned_by.username

        return {
            "id": approval.id,
            "decision_id": approval.decision_id,
            "reviewer_id": approval.reviewer_id,
            "reviewer_name": reviewer_name,
            "assigned_by_id": approval.assigned_by_id,
            "assigned_by_name": assigned_by_name,
            "status": approval.status,
            "comments": approval.comments,
            "approved_at": approval.approved_at,
            "created_at": approval.created_at,
        }

    def get_by_decision(self, decision_id: int):
        approvals = (
            self.db.query(Approval)
            .join(
                User,
                Approval.reviewer_id == User.id,
            )
            .outerjoin(
                User,
                Approval.assigned_by_id == User.id,
            )
        )

        # Use the repository to get the actual approval records.
        approvals = self.approval_repo.get_by_decision(
            decision_id
        )

        # Reload relationships safely using IDs.
        result = []

        for approval in approvals:

            reviewer = (
                self.db.query(User)
                .filter(User.id == approval.reviewer_id)
                .first()
            )

            assigned_by = None

            if approval.assigned_by_id:
                assigned_by = (
                    self.db.query(User)
                    .filter(User.id == approval.assigned_by_id)
                    .first()
                )

            result.append(
                {
                    "id": approval.id,
                    "decision_id": approval.decision_id,
                    "reviewer_id": approval.reviewer_id,
                    "reviewer_name": (
                        reviewer.username
                        if reviewer
                        else None
                    ),
                    "assigned_by_id": approval.assigned_by_id,
                    "assigned_by_name": (
                        assigned_by.username
                        if assigned_by
                        else None
                    ),
                    "status": approval.status,
                    "comments": approval.comments,
                    "approved_at": approval.approved_at,
                    "created_at": approval.created_at,
                }
            )

        return result

    def get_my_approvals(self, reviewer_id: int):
        approvals = self.approval_repo.get_by_reviewer(
            reviewer_id
        )

        result = []

        for approval in approvals:

            reviewer = (
                self.db.query(User)
                .filter(User.id == approval.reviewer_id)
                .first()
            )

            assigned_by = None

            if approval.assigned_by_id:
                assigned_by = (
                    self.db.query(User)
                    .filter(User.id == approval.assigned_by_id)
                    .first()
                )

            result.append(
                {
                    "id": approval.id,
                    "decision_id": approval.decision_id,
                    "reviewer_id": approval.reviewer_id,
                    "reviewer_name": (
                        reviewer.username
                        if reviewer
                        else None
                    ),
                    "assigned_by_id": approval.assigned_by_id,
                    "assigned_by_name": (
                        assigned_by.username
                        if assigned_by
                        else None
                    ),
                    "status": approval.status,
                    "comments": approval.comments,
                    "approved_at": approval.approved_at,
                    "created_at": approval.created_at,
                }
            )

        return result