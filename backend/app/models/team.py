"""
Expert Decision Replay Platform - Team Model

Defines the teams table for organizational grouping.
Teams are scoped to a company.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Team(Base):
    """
    Team model for organizational structure, scoped to a company.

    Attributes:
        id: Unique team identifier (UUID).
        company_id: Foreign key to companies.id (tenant boundary).
        name: Team name (unique within a company).
        description: Description of the team's purpose.
        created_at: Timestamp when the team was created.
        updated_at: Timestamp of last update.
    """
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    team_memberships = relationship("TeamMembership", back_populates="team", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name={self.name}, company_id={self.company_id})>"
