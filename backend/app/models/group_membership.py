"""
Expert Decision Replay Platform - GroupMembership Model

Join table linking users to groups within a company.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class GroupMembership(Base):
    """
    GroupMembership model — links a User to a Group.

    Attributes:
        id: Unique group membership identifier (UUID).
        group_id: Foreign key to groups.id.
        user_id: Foreign key to users.id.
        joined_at: Timestamp when the membership became active.
        is_active: Whether this membership currently grants group access.
        created_at: Creation timestamp.
    """
    __tablename__ = "group_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="group_memberships")
    user = relationship("User", back_populates="group_memberships")

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_user_membership"),
    )

    def __repr__(self) -> str:
        return f"<GroupMembership(group_id={self.group_id}, user_id={self.user_id})>"
