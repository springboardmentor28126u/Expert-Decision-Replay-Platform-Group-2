"""
models/comment.py

Comment — threaded discussion entry. Attaches to a Decision, optionally
to a specific Alternative, and optionally to a parent Comment
(self-referential FK) for threaded replies.
"""

import uuid
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from models.decision import Decision
    from models.alternative import Alternative
    from models.user import User
    from models.attachment import Attachment


class Comment(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "comments"

    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Nullable: a comment can be general discussion on the decision, or
    # scoped to one specific alternative being debated.
    alternative_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("alternatives.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # Self-referential FK for threaded replies.
    parent_comment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Distinguishes an ad-hoc comment from a structured meeting-note
    # entry without needing a second table.
    is_meeting_note: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- Relationships ---
    decision: Mapped["Decision"] = relationship(back_populates="comments")
    alternative: Mapped[Optional["Alternative"]] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship(back_populates="comments")

    parent: Mapped[Optional["Comment"]] = relationship(
        remote_side="Comment.id", back_populates="replies"
    )
    replies: Mapped[List["Comment"]] = relationship(back_populates="parent")

    attachments: Mapped[List["Attachment"]] = relationship(back_populates="comment")

    def __repr__(self) -> str:
        return f"<Comment id={self.id} decision_id={self.decision_id} author_id={self.author_id}>"
