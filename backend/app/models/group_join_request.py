"""
Expert Decision Replay Platform - Group Join Request Model

Tracks in-app employee requests to join a group.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class GroupJoinRequestStatus(str, enum.Enum):
    """Lifecycle states for a group join request."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class GroupJoinRequest(Base):
    """Request from a user to join a group owned by an Admin/Manager."""

    __tablename__ = "group_join_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requested_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requested_to = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        Enum(
            GroupJoinRequestStatus,
            name="group_join_request_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=GroupJoinRequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    message = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    group = relationship("Group", lazy="joined")
    requester = relationship("User", foreign_keys=[requested_by], lazy="joined")
    request_owner = relationship("User", foreign_keys=[requested_to], lazy="joined")
    decider = relationship("User", foreign_keys=[decided_by], lazy="joined")

    __table_args__ = (
        Index(
            "uq_group_join_requests_pending",
            "group_id",
            "requested_by",
            unique=True,
            postgresql_where=(status == GroupJoinRequestStatus.PENDING),
        ),
    )
