"""
Expert Decision Replay Platform - Decision Comment Model

Instagram-style comments on decisions. Supports one level of replies
(parent_comment_id), soft delete for moderation, and is_edited flag.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class DecisionComment(Base):
    __tablename__ = "decision_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    decision_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    parent_comment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("decision_comments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_edited = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    author = relationship("User", lazy="joined")
    replies = relationship(
        "DecisionComment",
        backref="parent",
        remote_side="DecisionComment.id",
        lazy="selectin",
    )
    likes = relationship(
        "DecisionCommentLike",
        back_populates="comment",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_decision_comments_decision_created", "decision_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<DecisionComment(id={self.id}, decision_id={self.decision_id})>"
