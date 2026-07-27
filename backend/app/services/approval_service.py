"""
services/approval_service.py

Business logic for approval workflow.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import Approval
from app.models.enums import ApprovalStatus
from app.models.user import User

from app.repositories.approval_repository import ApprovalRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.user_repository import UserRepository

from app.schemas.approval import (
    ApprovalAssign,
    ApprovalDecision,
    ApprovalOut,
)

from app.utils.exceptions import (
    ConflictException,
    NotFoundException,
    PermissionDeniedException,
)


class ApprovalService:

    def __init__(
        self,
        db: AsyncSession,
    ) -> None:

        self.db = db

        self.approvals = ApprovalRepository(db)
        self.decisions = DecisionRepository(db)
        self.users = UserRepository(db)

    # --------------------------------------------------
    # Queries
    # --------------------------------------------------

    async def list_approvals(
        self,
        decision_id: uuid.UUID,
    ) -> list[ApprovalOut]:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        approvals = await self.approvals.list_by_decision(
            decision_id
        )

        return [
            ApprovalOut.model_validate(a)
            for a in approvals
        ]

    async def get_approval(
        self,
        approval_id: uuid.UUID,
    ) -> ApprovalOut:

        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        return ApprovalOut.model_validate(
            approval
        )

    # --------------------------------------------------
    # Assignment
    # --------------------------------------------------

    async def assign_reviewer(
        self,
        decision_id: uuid.UUID,
        payload: ApprovalAssign,
    ) -> ApprovalOut:

        decision = await self.decisions.get_by_id(
            decision_id
        )

        if decision is None:
            raise NotFoundException(
                "Decision not found."
            )

        reviewer = await self.users.get_by_id(
            payload.reviewer_id
        )

        if reviewer is None:
            raise NotFoundException(
                "Reviewer not found."
            )

        existing = await self.approvals.find_assignment(
            decision_id,
            payload.reviewer_id,
            payload.level,
        )

        if existing is not None:
            raise ConflictException(
                "Reviewer already assigned."
            )

        approval = Approval(
            decision_id=decision_id,
            reviewer_id=payload.reviewer_id,
            level=payload.level,
            status=ApprovalStatus.PENDING,
        )

        self.approvals.add(
            approval
        )

        await self.db.commit()

        created = await self.approvals.get_by_id(
            approval.id
        )

        return ApprovalOut.model_validate(
            created
        )

    # --------------------------------------------------
    # Review
    # --------------------------------------------------

    async def review_decision(
        self,
        approval_id: uuid.UUID,
        payload: ApprovalDecision,
        current_user: User,
    ) -> ApprovalOut:

        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        if (
            current_user.id != approval.reviewer_id
            and current_user.role.name != "administrator"
        ):
            raise PermissionDeniedException(
                "You do not have permission to review this approval."
            )

        approval.status = payload.status
        approval.comments = payload.comments

        await self.db.commit()

        updated = await self.approvals.get_by_id(
            approval_id
        )

        return ApprovalOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Reset
    # --------------------------------------------------

    async def reset_approval(
        self,
        approval_id: uuid.UUID,
    ) -> ApprovalOut:

        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        approval.status = ApprovalStatus.PENDING
        approval.comments = None
        approval.decided_at = None

        await self.db.commit()

        updated = await self.approvals.get_by_id(
            approval_id
        )

        return ApprovalOut.model_validate(
            updated
        )

    # --------------------------------------------------
    # Delete
    # --------------------------------------------------

    async def remove_assignment(
        self,
        approval_id: uuid.UUID,
    ) -> None:

        raise NotImplementedError(
            "Approval assignments are immutable and cannot be deleted."
        )
        
        approval = await self.approvals.get_by_id(
            approval_id
        )

        if approval is None:
            raise NotFoundException(
                "Approval not found."
            )

        await self.approvals.hard_delete(
            approval
        )

        await self.db.commit()
