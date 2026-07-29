"""
Expert Decision Replay Platform - Group Model

Defines the groups table (team/unit within a company).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Group(Base):
    """
    Group model — team/group inside a Company.

    Attributes:
        id: Unique group identifier (UUID).
        company_id: Foreign key to companies.id.
        owner_id: Foreign key to users.id for the Admin/Manager who owns the group.
        name: Name of the group (e.g., 'Backend Team', 'Compliance').
        description: Optional group description.
        created_at: Creation timestamp.
    """
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
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

    # Relationships
    company = relationship("Company", back_populates="groups")
    owner = relationship("User", foreign_keys=[owner_id], lazy="joined")
    group_memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name='{self.name}', company_id={self.company_id})>"
