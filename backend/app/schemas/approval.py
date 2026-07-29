"""
schemas/approval.py
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.enums import ApprovalStatus
from app.schemas.common import ORMBase


class ApprovalAssign(BaseModel):
    """
    POST /decisions/{id}/approvals — Manager/Administrator assigns a
    reviewer at a given level. Separate from ApprovalDecision because
    assigning a reviewer and that reviewer rendering a decision are
    different actors, different permissions, and different points in
    the workflow.
    """
    reviewer_id: uuid.UUID
    level: int = Field(ge=1, le=10)


class ApprovalDecision(BaseModel):
    """
    PATCH /approvals/{approval_id} — the assigned reviewer records their
    outcome. `status` is restricted to a real decision outcome at the
    schema level (a reviewer can't "un-decide" back to PENDING through
    this endpoint; escalation is a distinct, explicit action).
    """
    status: ApprovalStatus = Field(
        description="Must be one of: approved, rejected, escalated"
    )
    comments: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def status_must_not_be_pending(cls, value: ApprovalStatus) -> ApprovalStatus:
        if value == ApprovalStatus.PENDING:
            raise ValueError(
                "PENDING is not a valid review outcome. "
                "Use PATCH /approvals/{approval_id}/reset instead."
            )
        return value

    @property
    def is_terminal_decision(self) -> bool:
        return self.status in (ApprovalStatus.APPROVED, ApprovalStatus.REJECTED)


class ApprovalReviewerSummary(ORMBase):
    id: uuid.UUID
    full_name: str
    email: str


class ApprovalOut(ORMBase):
    id: uuid.UUID
    decision_id: uuid.UUID
    level: int
    status: ApprovalStatus
    comments: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    reviewer: ApprovalReviewerSummary

