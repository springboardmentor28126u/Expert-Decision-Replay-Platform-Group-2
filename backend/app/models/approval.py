"""
Expert Decision Replay Platform - Approval Model

Defines the approvals table for the multi-level approval workflow.
Each approval row represents one approver at one level for a specific decision.
Approvals are processed sequentially: level N+1 is only actionable after level N approves.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Enum, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class ApprovalStatus(str, enum.Enum):
    """Approval lifecycle statuses."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    SUPERSEDED = "superseded"


class Approval(Base):
    """
    Approval row — one per (decision, level).

    Attributes:
        id: Unique approval identifier (UUID).
        decision_id: FK to decisions table.
        approver_id: FK to users — the assigned approver for this level.
        level: Sequential approval level (1, 2, …).
        status: Current approval status.
        comments: Optional reviewer comments on approve/reject.
        acted_at: Timestamp when the approver took action.
        created_at: Timestamp when this approval row was created (on submit).
    """
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approver_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    level = Column(Integer, nullable=False)
    status = Column(
        Enum(ApprovalStatus, name="approval_status"),
        default=ApprovalStatus.PENDING,
        nullable=False,
    )
    comments = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    decision = relationship("Decision", back_populates="approvals")
    approver = relationship("User", lazy="joined")

    # Constraints: one approval per decision+level, and one per decision+approver
    __table_args__ = (
        UniqueConstraint("decision_id", "level", name="uq_approval_decision_level"),
        Index("ix_approvals_decision_status", "decision_id", "status"),
    )

    def __repr__(self) -> str:
        return (
            f"<Approval(decision_id={self.decision_id}, "
            f"level={self.level}, status={self.status})>"
        )
