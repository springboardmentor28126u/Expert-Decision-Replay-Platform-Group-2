"""
models/decision.py

Decision — the core entity of the platform. Alternatives, comments,
approvals, and attachments all hang off a Decision.
"""

import uuid
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy import Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import DecisionStatus
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from models.user import User
    from models.team import Team
    from models.alternative import Alternative
    from models.comment import Comment
    from models.approval import Approval
    from models.attachment import Attachment


class Decision(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "decisions"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    decision_rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[DecisionStatus] = mapped_column(
        PgEnum(DecisionStatus, name="decision_status", native_enum=True),
        default=DecisionStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Bumped on every material edit once a decision leaves DRAFT; pairs
    # with AuditLog for full change history rather than inline snapshots.
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    team_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # --- Relationships ---
    created_by: Mapped["User"] = relationship(
        back_populates="decisions_created", foreign_keys=[created_by_id]
    )
    team: Mapped[Optional["Team"]] = relationship(back_populates="decisions")

    # cascade="all, delete-orphan" is intentionally NOT used — this
    # platform soft-deletes, so a Decision is never physically DELETEd
    # in normal operation; deactivation is orchestrated explicitly in
    # services/decision_service.py instead.
    alternatives: Mapped[List["Alternative"]] = relationship(
        back_populates="decision", order_by="Alternative.created_at"
    )
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="decision", order_by="Comment.created_at"
    )
    approvals: Mapped[List["Approval"]] = relationship(
        back_populates="decision", order_by="Approval.level"
    )
    attachments: Mapped[List["Attachment"]] = relationship(back_populates="decision")

    def __repr__(self) -> str:
        return f"<Decision id={self.id} title={self.title!r} status={self.status}>"
