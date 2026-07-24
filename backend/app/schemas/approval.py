"""
Expert Decision Replay Platform - Approval Schemas

Pydantic schemas for the approval workflow operations.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class ApproverAssign(BaseModel):
    """Schema for assigning an approver to a decision level."""
    approver_id: UUID
    level: int = Field(..., ge=1, description="Sequential approval level (1, 2, …)")


from enum import Enum

class ApprovalActionType(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    CHANGES_REQUESTED = "changes_requested"

class ApprovalAction(BaseModel):
    """Schema for approve / reject / request-changes actions."""
    action: ApprovalActionType
    comments: Optional[str] = Field(None, max_length=2000)


class ApprovalResponse(BaseModel):
    """Full approval row response."""
    id: UUID
    decision_id: UUID
    approver_id: UUID
    approver_name: Optional[str] = None
    level: int
    status: str
    comments: Optional[str] = None
    acted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
