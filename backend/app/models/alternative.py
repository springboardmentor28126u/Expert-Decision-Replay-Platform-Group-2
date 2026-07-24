"""
models/alternative.py

Alternative — one of several options considered for a Decision.
Many-to-one with Decision.
"""

import uuid
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.decision import Decision
    from app.models.user import User
    from app.models.comment import Comment
    from app.models.attachment import Attachment


class Alternative(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "alternatives"

    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Free-form narrative tied 1:1 to this alternative, not independently
    # queryable — a child table would add join overhead with no
    # normalization benefit.
    pros: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cons: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    cost_estimate: Mapped[Optional[float]] = mapped_column(Numeric(14, 2), nullable=True)
    feasibility_score: Mapped[Optional[int]] = mapped_column(nullable=True)  # e.g. 1-10 scale
    risk_assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # --- Relationships ---
    decision: Mapped["Decision"] = relationship(back_populates="alternatives")
    created_by: Mapped["User"] = relationship(back_populates="alternatives_created")
    comments: Mapped[List["Comment"]] = relationship(back_populates="alternative")
    attachments: Mapped[List["Attachment"]] = relationship(back_populates="alternative")

    def __repr__(self) -> str:
        return f"<Alternative id={self.id} title={self.title!r} decision_id={self.decision_id}>"

