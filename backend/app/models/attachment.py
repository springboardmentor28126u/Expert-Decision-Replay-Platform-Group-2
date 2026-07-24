"""
models/attachment.py

Attachment — an uploaded file, optionally linked to a Decision, an
Alternative, and/or a Comment.

Three separate nullable FKs (rather than a polymorphic owner_id) are
used deliberately: PostgreSQL cannot enforce a polymorphic foreign key,
so a generic owner_type/owner_id pair would allow orphaned references
to slip through silently. Exactly one of the three is expected to be
set, enforced by a CHECK constraint.
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.decision import Decision
    from app.models.alternative import Alternative
    from app.models.comment import Comment
    from app.models.user import User


class Attachment(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "attachments"
    __table_args__ = (
        CheckConstraint(
            "(num_nonnulls(decision_id, alternative_id, comment_id) = 1)",
            name="ck_attachment_exactly_one_owner",
        ),
    )

    decision_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    alternative_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("alternatives.id", ondelete="CASCADE"), nullable=True, index=True
    )
    comment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )

    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Stores the S3 key / local path, never the binary itself — the DB
    # never holds file blobs.
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)  # MIME type
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)  # bytes

    # --- Relationships ---
    decision: Mapped[Optional["Decision"]] = relationship(back_populates="attachments")
    alternative: Mapped[Optional["Alternative"]] = relationship(back_populates="attachments")
    comment: Mapped[Optional["Comment"]] = relationship(back_populates="attachments")
    uploaded_by: Mapped["User"] = relationship(back_populates="attachments_uploaded")

    def __repr__(self) -> str:
        return f"<Attachment id={self.id} file_name={self.file_name!r}>"

