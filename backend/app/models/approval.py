"""
models/approval.py

Approval — one step in a Decision's multi-level approval workflow.

One row per (decision, level, reviewer), rather than a single "current
approver" column on Decision, so the full approval history is preserved
permanently — this is the audit trail the requirements call for.
"""

import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy import Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ApprovalStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.decision import Decision
    from app.models.user import User


class Approval(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "approvals"
    __table_args__ = (
        # A given reviewer can only hold one approval slot per level per
        # decision — prevents duplicate rows when reviewers are (re)assigned.
        UniqueConstraint("decision_id", "level", "reviewer_id", name="uq_approval_decision_level_reviewer"),
    )

    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # 1 = first-level review, 2 = second-level, etc.
    level: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[ApprovalStatus] = mapped_column(
        PgEnum(ApprovalStatus, name="approval_status", native_enum=True),
        default=ApprovalStatus.PENDING,
        nullable=False,
        index=True,
    )
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # No SoftDeleteMixin here: an approval record, once created, is an
    # immutable audit fact. Its status/decided_at fields transition, but
    # the row itself is never deleted — reassigning a reviewer creates a
    # new row instead of overwriting history.

    # --- Relationships ---
    decision: Mapped["Decision"] = relationship(back_populates="approvals")
    reviewer: Mapped["User"] = relationship(back_populates="approvals")

    def __repr__(self) -> str:
        return f"<Approval id={self.id} decision_id={self.decision_id} level={self.level} status={self.status}>"

