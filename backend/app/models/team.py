"""
Expert Decision Replay Platform - Team Model

Defines the teams table for organizational grouping.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Team(Base):
    """
    Team model for organizational structure.

    Attributes:
        id: Unique team identifier (UUID).
        name: Team name (unique).
        description: Description of the team's purpose.
        created_at: Timestamp when the team was created.
        updated_at: Timestamp of last update.
        members: Relationship to users in this team.
    """
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships (team_id was removed from User model in multi-tenant redesign)

    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name={self.name})>"
