"""
Expert Decision Replay Platform - Group Model

Defines the groups table (team/unit within a company).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Group(Base):
    """
    Group model — team/group inside a Company.

    Attributes:
        id: Unique group identifier (UUID).
        company_id: Foreign key to companies.id.
        name: Name of the group (e.g., 'Backend Team', 'Compliance').
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
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", back_populates="groups")
    group_memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name='{self.name}', company_id={self.company_id})>"
