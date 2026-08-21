"""
Expert Decision Replay Platform - Approval Model

Defines the approvals table for the multi-level approval workflow.
Each approval row represents one approver at one level for a specific decision.
Approvals are processed sequentially: level N+1 is only actionable after level N approves.
The 'round' column tracks resubmission rounds â€” old rounds are preserved as SUPERSEDED
for audit history, while only the latest round is active.
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
    Approval row â€” one per (decision, level, round).

    Attributes:
        id: Unique approval identifier (UUID).
        decision_id: FK to decisions table.
        approver_id: FK to users â€” the assigned approver for this level.
        level: Sequential approval level (1, 2, â€¦).
        round: Submission round (incremented on each resubmission).
        status: Current approval status.
        comments: Optional reviewer comments on approve/reject.
        acted_at: Timestamp when the approver took action.
        action: Original action taken (approved/rejected/changes_requested).
        signature_hash: SHA-256 hash of the attestation payload.
        attested_at: Timestamp when the attestation was made.
        attestation_text: The attestation text that was agreed to.
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
    round = Column(Integer, nullable=False, default=1)
    status = Column(
        Enum(ApprovalStatus, name="approval_status"),
        default=ApprovalStatus.PENDING,
        nullable=False,
    )
    comments = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)
    signature_hash = Column(String(64), nullable=True, index=True)
    attested_at = Column(DateTime(timezone=True), nullable=True)
    attestation_text = Column(Text, nullable=True)
    action = Column(String(30), nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    decision = relationship("Decision", back_populates="approvals")
    approver = relationship("User", lazy="joined")

    # Constraints: one approval per decision+level+round
    __table_args__ = (
        UniqueConstraint("decision_id", "level", "round", name="uq_approval_decision_level_round"),
        Index("ix_approvals_decision_status", "decision_id", "status"),
        Index("ix_approvals_decision_round", "decision_id", "round"),
    )

    def __repr__(self) -> str:
        return (
            f"<Approval(decision_id={self.decision_id}, "
            f"level={self.level}, round={self.round}, status={self.status})>"
        )
