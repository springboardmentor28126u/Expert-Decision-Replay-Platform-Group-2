"""
Expert Decision Replay Platform - Decision Comment Like Model

Toggle-style likes on comments. UNIQUE(comment_id, user_id) enforces
one-like-per-user semantics — creating = like, deleting = unlike.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class DecisionCommentLike(Base):
    __tablename__ = "decision_comment_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decision_comments.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    comment = relationship("DecisionComment", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", name="uq_decision_comment_user_like"),
        Index("ix_decision_comment_likes_comment_id", "comment_id"),
        Index("ix_decision_comment_likes_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<DecisionCommentLike(comment_id={self.comment_id}, user_id={self.user_id})>"
